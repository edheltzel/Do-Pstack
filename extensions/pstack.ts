import { existsSync, readFileSync, statSync } from "node:fs";

const POTETO_SKILL = "/skill:do-poteto-mode";
const POTETO_PROMPT =
  "Pstack Poteto Mode is on for this session. Follow skills/do-poteto-mode/SKILL.md: match a playbook, copy its steps, delegate through omp task({ context, tasks: [{ agent, task }] }), verify real behavior, name only principles that changed a decision. /poteto-mode off disables it.";

type ModeEntry = {
  type?: string;
  customType?: string;
  data?: { enabled?: unknown };
};

type PotetoScan = { found: boolean; enabled: boolean };
const jsonlCache = new Map<string, { mtimeMs: number; size: number; value: PotetoScan }>();

function sessionIdFromFile(path: unknown): string | undefined {
  if (typeof path !== "string" || !path) return undefined;
  const base = path.split("/").pop() ?? path;
  const stem = base.replace(/\.jsonl$/i, "");
  return stem || undefined;
}

function sessionIdFromCtx(ctx: any): string | undefined {
  const direct = ctx?.sessionManager?.getSessionId?.();
  if (typeof direct === "string" && direct.length > 0) return direct;
  const file = ctx?.sessionManager?.getSessionFile?.();
  return sessionIdFromFile(file);
}

function sessionFileFromCtx(ctx: any): string | undefined {
  const file = ctx?.sessionManager?.getSessionFile?.();
  return typeof file === "string" && file.length > 0 ? file : undefined;
}

function lastPotetoInJsonl(path: string): PotetoScan | undefined {
  if (!existsSync(path)) {
    jsonlCache.delete(path);
    return undefined;
  }
  let st;
  try {
    st = statSync(path);
  } catch {
    jsonlCache.delete(path);
    return undefined;
  }
  const hit = jsonlCache.get(path);
  if (hit && hit.mtimeMs === st.mtimeMs && hit.size === st.size) return hit.value;
  let text = "";
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
  let found = false;
  let enabled = false;
  for (const line of text.split("\n")) {
    if (!line.includes("pstack-mode")) continue;
    try {
      const row = JSON.parse(line) as ModeEntry & { entry?: ModeEntry };
      const entry = row.customType === "pstack-mode" ? row : row.entry;
      const data = entry?.data ?? (row as ModeEntry).data;
      if (entry && (entry.customType === "pstack-mode" || row.customType === "pstack-mode")) {
        found = true;
        enabled = Boolean(data?.enabled);
      }
    } catch {
      // ignore bad lines
    }
  }
  const value = { found, enabled };
  jsonlCache.set(path, { mtimeMs: st.mtimeMs, size: st.size, value });
  return value;
}

/** This conversation only. Missing pstack-mode entry means off. Never a process-wide boolean. */
function isPotetoOn(ctx: any, cache: Map<string, boolean>): boolean {
  const file = sessionFileFromCtx(ctx);
  const sid = sessionIdFromCtx(ctx);
  if (file) {
    const parsed = lastPotetoInJsonl(file);
    if (parsed?.found) return parsed.enabled;
  }
  if (sid && cache.has(sid)) return cache.get(sid) === true;
  if (file && cache.has(file)) return cache.get(file) === true;
  return false;
}

export default function pstackExtension(pi: any): void {
  try {
    pi.setLabel?.("pstack");
  } catch {
    // older hosts
  }

  const modeBySession = new Map<string, boolean>();
  let lastOn = false;

  function setStatus(ctx: any, on: boolean): void {
    if (ctx?.mode !== "tui") return;
    try {
      ctx.ui?.setStatus?.("pstack-mode", on ? "🍠 poteto: ✓ on" : undefined);
    } catch {
      // ignore
    }
  }

  function persistMode(enabled: boolean, ctx?: any): void {
    const sid = sessionIdFromCtx(ctx);
    const file = sessionFileFromCtx(ctx);
    if (sid) modeBySession.set(sid, enabled);
    if (file) modeBySession.set(file, enabled);
    lastOn = enabled;
    try {
      pi.appendEntry("pstack-mode", { enabled });
    } catch {
      // ignore
    }
    if (ctx) setStatus(ctx, enabled);
  }

  function syncThisSession(ctx: any): boolean {
    const sid = sessionIdFromCtx(ctx);
    if (sid) modeBySession.delete(sid);
    const on = isPotetoOn(ctx, modeBySession);
    setStatus(ctx, on);
    lastOn = on;
    return on;
  }

  pi.on("session_shutdown", async (_event: unknown, ctx: any) => {
    const sid = sessionIdFromCtx(ctx);
    if (sid) modeBySession.delete(sid);
    lastOn = false;
    setStatus(ctx, false);
  });

  pi.on("session_start", async (_event: unknown, ctx: any) => {
    syncThisSession(ctx);
  });

  try {
    pi.on("new_session", async (_event: unknown, ctx: any) => {
      syncThisSession(ctx);
    });
  } catch {
    // event may not exist
  }

  pi.on("input", async (event: any, ctx: any) => {
    if (typeof event?.text === "string" && /^\/skill:do-poteto-mode(?:\s|$)/.test(event.text)) {
      persistMode(true, ctx);
    }
    return { action: "continue" as const };
  });

  pi.on("before_agent_start", async (event: any, ctx: any) => {
    if (!isPotetoOn(ctx, modeBySession)) return;
    const base = typeof event?.systemPrompt === "string" ? event.systemPrompt : "";
    return { systemPrompt: `${base}\n\n${POTETO_PROMPT}` };
  });

  pi.registerCommand("poteto-mode", {
    description: "Enable or disable sticky pstack Poteto Mode. Usage: /poteto-mode [on|off|task]",
    getArgumentCompletions: (prefix: string) => {
      const token = String(prefix ?? "").trim().toLowerCase();
      const value = lastOn ? "off" : "on";
      if (!token || value.startsWith(token)) {
        return [{ value, label: value }];
      }
      return null;
    },
    handler: async (args: string, ctx: any) => {
      const raw = String(args ?? "").trim();
      const token = raw.split(/\s+/)[0]?.toLowerCase() ?? "";
      if (token === "off" || token === "disable" || token === "stop") {
        persistMode(false, ctx);
        try {
          ctx?.ui?.notify?.("Poteto Mode off.", "info");
        } catch {
          // ignore
        }
        return;
      }
      persistMode(true, ctx);
      try {
        ctx?.ui?.notify?.(
          "Poteto Mode on for this conversation. /new starts a new conversation (off). /poteto-mode off disables this one.",
          "info",
        );
      } catch {
        // ignore
      }
      const task =
        token === "on" || token === "enable" || token === "start"
          ? raw.slice(token.length).trim()
          : raw;
      const payload = `${POTETO_SKILL}${task ? ` ${task}` : ""}`;
      if (typeof pi.sendUserMessage === "function") {
        const idle = typeof ctx?.isIdle === "function" ? ctx.isIdle() : true;
        pi.sendUserMessage(
          payload,
          idle
            ? { expandPromptTemplates: true }
            : { expandPromptTemplates: true, deliverAs: "followUp" },
        );
      }
    },
  });
}
