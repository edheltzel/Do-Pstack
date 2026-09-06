import { existsSync, readFileSync } from "node:fs";

const POTETO_SKILL = "/skill:do-poteto-mode";
const POTETO_PROMPT =
  "Pstack Poteto Mode is on for this session. Follow skills/do-poteto-mode/SKILL.md: match a playbook, copy its steps, delegate through omp task({ context, tasks: [{ agent, task }] }), verify real behavior, name only principles that changed a decision. /poteto-mode off disables it.";

type ModeEntry = {
  type?: string;
  customType?: string;
  data?: { enabled?: unknown };
};

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

function lastPotetoInJsonl(path: string): { found: boolean; enabled: boolean } | undefined {
  if (!existsSync(path)) return undefined;
  let found = false;
  let enabled = false;
  let text = "";
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return undefined;
  }
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
  return { found, enabled };
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

  function setStatus(ctx: any, on: boolean): void {
    if (ctx?.mode !== "tui") return;
    try {
      ctx.ui?.setStatus?.("pstack-mode", on ? "pstack: poteto mode" : undefined);
    } catch {
      // ignore
    }
  }

  function persistMode(enabled: boolean, ctx?: any): void {
    const sid = sessionIdFromCtx(ctx);
    const file = sessionFileFromCtx(ctx);
    if (sid) modeBySession.set(sid, enabled);
    if (file) modeBySession.set(file, enabled);
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
    return on;
  }

  pi.on("session_shutdown", async (_event: unknown, ctx: any) => {
    const sid = sessionIdFromCtx(ctx);
    if (sid) modeBySession.delete(sid);
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
    description: "Enable or disable sticky pstack Poteto Mode. Usage: /poteto-mode [task] | /poteto-mode off",
    getArgumentCompletions: (prefix: string) => {
      const token = String(prefix ?? "").trim().toLowerCase();
      if (!token || "off".startsWith(token)) {
        return [{ value: "off", label: "off" }];
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
      const payload = `${POTETO_SKILL}${raw ? ` ${raw}` : ""}`;
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
