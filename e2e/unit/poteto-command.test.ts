import { describe, expect, it } from "vitest";
import pstackExtension from "../../extensions/pstack.ts";

type Completions = { value: string; label: string }[] | null;

function boot() {
  let command: {
    getArgumentCompletions?: (prefix: string) => Completions;
    handler: (args: string, ctx: unknown) => Promise<void>;
  };
  const messages: string[] = [];
  pstackExtension({
    setLabel() {},
    on() {},
    appendEntry() {},
    sendUserMessage(text: string) {
      messages.push(text);
    },
    registerCommand(_name: string, opts: typeof command) {
      command = opts;
    },
  });
  const ctx = {
    mode: "rpc",
    isIdle: () => true,
    sessionManager: {
      getSessionId: () => "s1",
      getSessionFile: () => undefined,
    },
    ui: { setStatus() {}, notify() {} },
  };
  return { command: command!, messages, ctx };
}

describe("poteto-mode completions", () => {
  it("lists on when off and off when on", async () => {
    const { command, ctx } = boot();
    expect(command.getArgumentCompletions?.("")).toEqual([{ value: "on", label: "on" }]);
    await command.handler("", ctx);
    expect(command.getArgumentCompletions?.("")).toEqual([{ value: "off", label: "off" }]);
    await command.handler("off", ctx);
    expect(command.getArgumentCompletions?.("")).toEqual([{ value: "on", label: "on" }]);
  });

  it("does not send on as a skill task", async () => {
    const { command, messages, ctx } = boot();
    await command.handler("on", ctx);
    expect(messages).toEqual(["/skill:do-poteto-mode"]);
  });
});
