import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import pstackExtension, { lastWinsPstackMode, potetoOnFromScope } from "../../extensions/pstack.ts";

const NEEDLE = "Pstack Poteto Mode is on for this session";

function modeLine(enabled: boolean, customType = "pstack-mode"): string {
  return JSON.stringify({ customType, data: { enabled } });
}

function ctxFor(sid: string, file?: string) {
  return {
    sessionManager: {
      getSessionId: () => sid,
      getSessionFile: () => file,
    },
  };
}

function installFactory() {
  const events: Record<string, (event: unknown, ctx: unknown) => Promise<unknown>> = {};
  let commandHandler: ((args: string, ctx: unknown) => Promise<unknown>) | undefined;
  const pi = {
    on(name: string, fn: (event: unknown, ctx: unknown) => Promise<unknown>) {
      events[name] = fn;
    },
    appendEntry() {},
    registerCommand(_name: string, spec: { handler: (args: string, ctx: unknown) => Promise<unknown> }) {
      commandHandler = spec.handler;
    },
    sendUserMessage() {},
  };
  pstackExtension(pi);
  if (!commandHandler) throw new Error("poteto-mode command was not registered");
  return { events, commandHandler };
}

describe("lastWinsPstackMode", () => {
  it("treats empty jsonl as off", () => {
    expect(lastWinsPstackMode("")).toEqual({ found: false, enabled: false });
    expect(lastWinsPstackMode("\n\n")).toEqual({ found: false, enabled: false });
  });

  it("treats missing customType as off", () => {
    expect(lastWinsPstackMode(JSON.stringify({ type: "custom", data: { enabled: true } }))).toEqual({
      found: false,
      enabled: false,
    });
    expect(lastWinsPstackMode(modeLine(true, "other-mode"))).toEqual({ found: false, enabled: false });
  });

  it("last-wins enabled:true then enabled:false", () => {
    const text = `${modeLine(true)}\n${modeLine(false)}\n`;
    expect(lastWinsPstackMode(text)).toEqual({ found: true, enabled: false });
  });

  it("last-wins enabled:false then enabled:true", () => {
    const text = `${modeLine(false)}\n${modeLine(true)}\n`;
    expect(lastWinsPstackMode(text)).toEqual({ found: true, enabled: true });
  });
});

describe("potetoOnFromScope (Map keyed by sid, missing-entry-is-off)", () => {
  it("sid A enabled does not turn sid B on when B has no pstack-mode entry", () => {
    const cache = new Map<string, boolean>([["sid-a", true]]);
    expect(potetoOnFromScope({ cache, sid: "sid-a" })).toBe(true);
    expect(potetoOnFromScope({ cache, sid: "sid-b" })).toBe(false);
    expect(potetoOnFromScope({ cache, sid: "sid-b", jsonl: { found: false, enabled: false } })).toBe(false);
  });

  it("clearing/shutdown of A does not leave B on", () => {
    const cache = new Map<string, boolean>([
      ["sid-a", true],
      ["sid-b", false],
    ]);
    cache.delete("sid-a");
    expect(potetoOnFromScope({ cache, sid: "sid-a" })).toBe(false);
    expect(potetoOnFromScope({ cache, sid: "sid-b" })).toBe(false);
    expect(potetoOnFromScope({ cache, sid: "sid-b", jsonl: lastWinsPstackMode("") })).toBe(false);
  });

  it("missing Map entry is off even if some other sid is on", () => {
    const cache = new Map<string, boolean>([["sid-a", true]]);
    expect(potetoOnFromScope({ cache })).toBe(false);
    expect(potetoOnFromScope({ cache, sid: "missing" })).toBe(false);
  });
});

describe("factory RPC new_session leak class (ExtensionAPI, no omp)", () => {
  it("same-process sid B stays off when A is poteto-on and B has no jsonl entry", async () => {
    const { events, commandHandler } = installFactory();
    const dir = mkdtempSync(join(tmpdir(), "pstack-sid-"));
    const fileA = join(dir, "sid-a.jsonl");
    const fileB = join(dir, "sid-b.jsonl");
    writeFileSync(fileA, `${modeLine(true)}\n`);
    writeFileSync(fileB, "");

    await commandHandler("", ctxFor("sid-a", fileA));
    const onA = await events.before_agent_start?.({ systemPrompt: "base" }, ctxFor("sid-a", fileA));
    expect(String((onA as { systemPrompt?: string } | undefined)?.systemPrompt ?? "")).toContain(NEEDLE);

    const offB = await events.before_agent_start?.({ systemPrompt: "base" }, ctxFor("sid-b", fileB));
    expect(offB).toBeUndefined();
  });

  it("RPC new_session for sid B does not inherit A's on state", async () => {
    const { events, commandHandler } = installFactory();
    await commandHandler("", ctxFor("sid-a"));
    await events.new_session?.({}, ctxFor("sid-b"));
    const offB = await events.before_agent_start?.({ systemPrompt: "base" }, ctxFor("sid-b"));
    expect(offB).toBeUndefined();
  });

  it("session_shutdown of A does not leave B on", async () => {
    const { events, commandHandler } = installFactory();
    await commandHandler("", ctxFor("sid-a"));
    await events.session_shutdown?.({}, ctxFor("sid-a"));
    const afterA = await events.before_agent_start?.({ systemPrompt: "base" }, ctxFor("sid-a"));
    const afterB = await events.before_agent_start?.({ systemPrompt: "base" }, ctxFor("sid-b"));
    expect(afterA).toBeUndefined();
    expect(afterB).toBeUndefined();
  });

  it("empty jsonl / missing customType on a new sid is off", async () => {
    const { events } = installFactory();
    const dir = mkdtempSync(join(tmpdir(), "pstack-jsonl-"));
    const empty = join(dir, "empty.jsonl");
    const noType = join(dir, "notype.jsonl");
    writeFileSync(empty, "");
    writeFileSync(noType, `${JSON.stringify({ type: "custom", data: { enabled: true } })}\n`);

    const emptyHit = await events.before_agent_start?.({ systemPrompt: "base" }, ctxFor("sid-empty", empty));
    const noTypeHit = await events.before_agent_start?.({ systemPrompt: "base" }, ctxFor("sid-notype", noType));
    expect(emptyHit).toBeUndefined();
    expect(noTypeHit).toBeUndefined();
  });

  it("last-wins jsonl enabled:true then enabled:false is off for that sid", async () => {
    const { events } = installFactory();
    const dir = mkdtempSync(join(tmpdir(), "pstack-wins-"));
    const file = join(dir, "sid-w.jsonl");
    writeFileSync(file, `${modeLine(true)}\n${modeLine(false)}\n`);
    const hit = await events.before_agent_start?.({ systemPrompt: "base" }, ctxFor("sid-w", file));
    expect(hit).toBeUndefined();
  });
});
