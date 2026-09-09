import { spawn } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { createInterface } from "node:readline";
import { homedir } from "node:os";

const ROOT = "/Users/ed/Developer/pstack";
const NEEDLES = [
  "# Create a verification skill",
  "Every serious project needs a scripted way to drive the real app",
];
const TARGET = "skill:ps-create-verification-skill";
const OLD = "skill:create-verification-skill";
const SLASH = "/skill:ps-create-verification-skill";
const SKILL_SUFFIX = "pstack/skills/ps-create-verification-skill/SKILL.md";
const AGENTS = homedir() + "/.agents";
const OUT = "/Users/ed/Desktop/fm230-proof-out.json";
const work = "/Users/ed/Desktop/fm230-proof-work";
const sessionDir = work + "/sessions";

rmSync(work, { recursive: true, force: true });
mkdirSync(sessionDir, { recursive: true });

function dumpBlob(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return String(obj);
  }
}

function needlesIn(text) {
  const hits = NEEDLES.filter((n) => text.includes(n));
  const leftover = text.includes(SLASH);
  return { hits, leftover };
}

function collectPaths(node, acc) {
  if (!node || typeof node !== "object") return acc;
  if (Array.isArray(node)) {
    for (const x of node) collectPaths(x, acc);
    return acc;
  }
  if (typeof node.path === "string") acc.push({ path: node.path, keys: Object.keys(node) });
  if (node.details && typeof node.details === "object" && typeof node.details.path === "string") {
    acc.push({ path: node.details.path, via: "details.path", keys: Object.keys(node) });
  }
  for (const v of Object.values(node)) {
    if (v && typeof v === "object") collectPaths(v, acc);
  }
  return acc;
}

function scanJsonl(path) {
  if (!path || !existsSync(path)) {
    return { exists: false, path: String(path), lines: 0, hits: [], user_msgs: [], skill_prompts: [], paths: [] };
  }
  const lines = readFileSync(path, "utf8").split(/\n/);
  const hits = [];
  const user_msgs = [];
  const skill_prompts = [];
  const paths = [];
  lines.forEach((line, i) => {
    if (!line) return;
    const { hits: nh, leftover } = needlesIn(line);
    if (nh.length || leftover || line.includes("create-verification-skill") || line.includes("skill-prompt") || line.includes("skill_prompt")) {
      hits.push({ i, needles: nh, leftover_slash: leftover, snip: line.slice(0, 800) });
    }
    let row;
    try {
      row = JSON.parse(line);
    } catch {
      return;
    }
    const t = row.type || row.role || row.customType;
    if (String(t).toLowerCase().includes("skill") || dumpBlob(row).includes("skill-prompt")) {
      skill_prompts.push({ i, type: t, snip: dumpBlob(row).slice(0, 1200) });
    }
    collectPaths(row, paths);
    let text = "";
    if (typeof row.message === "string") text = row.message;
    else if (typeof row.text === "string") text = row.text;
    else if (typeof row.content === "string") text = row.content;
    if (t === "user" || t === "message" || t === "prompt" || row.role === "user") {
      user_msgs.push({ i, type: t, snip: (text || line).slice(0, 800) });
    }
  });
  return { exists: true, path, lines: lines.length, hits, user_msgs: user_msgs.slice(0, 20), skill_prompts: skill_prompts.slice(0, 20), paths: paths.slice(0, 40) };
}

function send(proc, obj) {
  proc.stdin.write(JSON.stringify(obj) + "\n");
}

function readUntil(proc, rl, pred, timeoutMs) {
  return new Promise((resolve, reject) => {
    const frames = [];
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("timeout; last frames: " + dumpBlob(frames.slice(-8)).slice(0, 2000)));
    }, timeoutMs);
    function onLine(line) {
      if (!line.trim()) return;
      let frame;
      try {
        frame = JSON.parse(line);
      } catch {
        frame = { _unparsed: line.slice(0, 500) };
        frames.push(frame);
        return;
      }
      frames.push(frame);
      if (frame.type === "extension_ui_request") {
        const rid = frame.id;
        const method = frame.method;
        if (method === "confirm") send(proc, { type: "extension_ui_response", id: rid, confirmed: true });
        else if (["notify", "setStatus", "setWidget", "setTitle", "set_editor_text"].includes(method)) {
          send(proc, { type: "extension_ui_response", id: rid, value: "ok" });
        } else {
          send(proc, { type: "extension_ui_response", id: rid, cancelled: true });
        }
      }
      if (pred(frame, frames)) {
        cleanup();
        resolve(frames);
      }
    }
    function onExit(code) {
      cleanup();
      reject(new Error("omp exited " + code + " after " + frames.length + " frames"));
    }
    function cleanup() {
      clearTimeout(timer);
      rl.off("line", onLine);
      proc.off("exit", onExit);
    }
    rl.on("line", onLine);
    proc.on("exit", onExit);
  });
}

function waitResponse(proc, rl, reqId, timeoutMs) {
  return readUntil(proc, rl, (f) => f.type === "response" && f.id === reqId, timeoutMs).then((frames) => ({
    resp: frames[frames.length - 1],
    frames,
  }));
}

function pluginDirInArgv(argv) {
  const i = argv.indexOf("--plugin-dir");
  if (i < 0) return null;
  return argv[i + 1];
}

function argvHasPersonalPluginDir(argv) {
  return argv.some((a) => a === "/Users/ed/Developer/pstack") && argv.includes("--plugin-dir");
}

const omp = "/opt/homebrew/bin/omp";
const pluginDirCandidates = [null];

async function runOnce(_pluginDir) {
  const args = [
    "-e",
    "./extensions/pstack.ts",
    "--mode",
    "rpc",
    "--session-dir",
    sessionDir,
    "--thinking",
    "off",
    "--no-title",
    "--auto-approve",
    "--no-tools",
    "--cwd",
    ".",
    "--max-time",
    "45",
  ];
  const cmd = [omp, ...args];
  const report = {
    cmd,
    argv: cmd,
    plugin_dir: null,
    cwd: ROOT,
    session_dir: sessionDir,
    ok: false,
  };
  console.log("CMD", cmd.join(" "));
  console.log("CWD", ROOT);
  console.log("no plugin-dir; -e file only");

  const proc = spawn(omp, args, { cwd: ROOT, stdio: ["pipe", "pipe", "pipe"] });
  const rl = createInterface({ input: proc.stdout });
  let stderr = "";
  proc.stderr.on("data", (d) => {
    stderr += d.toString();
  });

  try {
    await readUntil(proc, rl, (f) => f.type === "ready", 30000);
    send(proc, { id: "proto", type: "negotiate_protocol", protocolVersion: 2 });
    try {
      await waitResponse(proc, rl, "proto", 10000);
    } catch (exc) {
      report.proto_err = String(exc);
    }

    send(proc, { id: "cmds", type: "get_available_commands" });
    const { resp } = await waitResponse(proc, rl, "cmds", 20000);
    const data = resp.data || {};
    const commands = data.commands || [];
    const names = commands.map((c) => (c && typeof c === "object" ? c.name : c));
    const skill_ps = names.filter((n) => typeof n === "string" && n.startsWith("skill:ps-")).sort();
    const skill_unprefixed = names
      .filter((n) => typeof n === "string" && n.startsWith("skill:") && !n.startsWith("skill:ps-"))
      .sort();
    const all_skill = names.filter((n) => typeof n === "string" && n.startsWith("skill:")).sort();
    const poteto = names.filter((n) => typeof n === "string" && n.toLowerCase().includes("poteto"));
    report.get_available_commands = {
      success: resp.success,
      n_commands: names.length,
      n_skill_ps: skill_ps.length,
      n_skill_unprefixed: skill_unprefixed.length,
      n_skill_all: all_skill.length,
      has_skill_ps_create_verification_skill: names.includes(TARGET),
      has_old_skill_create_verification_skill: names.includes(OLD),
      skill_ps,
      skill_unprefixed_sample: skill_unprefixed.slice(0, 30),
      poteto_related: poteto,
      has_poteto_mode_unprefixed: names.includes("poteto-mode"),
      has_skill_ps_poteto_mode: names.includes("skill:ps-poteto-mode"),
      sample_names: names.slice(0, 40),
    };
    console.log(JSON.stringify(report.get_available_commands, null, 2));

    send(proc, { id: "s0", type: "get_state" });
    const st0 = await waitResponse(proc, rl, "s0", 15000);
    report.state0 = st0.resp.data || {};

    send(proc, { id: "inj", type: "prompt", message: SLASH });
    let inj_frames = [];
    try {
      inj_frames = await readUntil(
        proc,
        rl,
        (f) =>
          (f.type === "response" && f.id === "inj") ||
          (f.type === "prompt_result" && f.id === "inj") ||
          (f.type === "agent_end" && f.isTerminal !== false) ||
          NEEDLES.some((n) => dumpBlob(f).includes(n)) ||
          dumpBlob(f).includes("skill-prompt") ||
          dumpBlob(f).includes("skill_prompt"),
        60000
      );
    } catch (exc) {
      report.inject_wait_err = String(exc);
      inj_frames = [];
    }

    const blob = dumpBlob(inj_frames);
    const frameNeedles = needlesIn(blob);
    const framePaths = [];
    for (const f of inj_frames) collectPaths(f, framePaths);
    const skillPromptFrames = inj_frames.filter((f) => {
      const t = String(f.type || f.customType || "");
      const b = dumpBlob(f);
      return t.toLowerCase().includes("skill") || b.includes("skill-prompt") || b.includes("skill_prompt") || b.includes("SKILL.md");
    });

    report.inject_frames = {
      n: inj_frames.length,
      types: inj_frames.slice(-30).map((f) => f.type),
      needle_hits: frameNeedles.hits,
      leftover_slash_in_frames: frameNeedles.leftover,
      paths: framePaths,
      skill_prompt_snips: skillPromptFrames.slice(0, 10).map((f) => ({ type: f.type, id: f.id, snip: dumpBlob(f).slice(0, 1200) })),
    };

    send(proc, { id: "s1", type: "get_state" });
    try {
      const st1 = await waitResponse(proc, rl, "s1", 15000);
      report.state1 = st1.resp.data || {};
    } catch (exc) {
      report.state1_err = String(exc);
      report.state1 = {};
    }

    const sessionFile = (report.state1 && report.state1.sessionFile) || (report.state0 && report.state0.sessionFile);
    const jsonl = scanJsonl(sessionFile);
    report.jsonl = jsonl;

    const allPaths = [...framePaths, ...(jsonl.paths || [])];
    const detailsPaths = allPaths.map((p) => (typeof p === "string" ? p : p.path)).filter(Boolean);
    const repoSkillPaths = detailsPaths.filter((p) => p.endsWith(SKILL_SUFFIX) && !p.includes("/.agents/"));
    const agentsPaths = detailsPaths.filter((p) => p.includes("/.agents/") || p.startsWith(AGENTS));
    const details_path = repoSkillPaths[0] || agentsPaths[0] || detailsPaths.find((p) => p.includes("SKILL.md")) || detailsPaths[0] || null;

    const jsonlHits = [];
    for (const h of jsonl.hits || []) jsonlHits.push(...(h.needles || []));
    const needle_yes = frameNeedles.hits.length > 0 || jsonlHits.length > 0;

    let user_has_literal_slash = false;
    let user_has_needle = false;
    for (const um of jsonl.user_msgs || []) {
      const snip = um.snip || "";
      if (snip.includes(SLASH)) user_has_literal_slash = true;
      if (NEEDLES.some((n) => snip.includes(n))) user_has_needle = true;
    }
    // leftover slash: user text still has the slash command and no skill body
    const leftover_in_user = user_has_literal_slash && !user_has_needle;
    const leftover_slash = leftover_in_user || (frameNeedles.leftover && !needle_yes);

    const path_ok = Boolean(details_path && details_path.includes("/Users/ed/Developer/pstack/skills/") && details_path.endsWith(SKILL_SUFFIX) && !details_path.includes("/.agents/") && !details_path.includes("/.omp/"));
    const path_agents = Boolean(details_path && details_path.includes("/.agents/"));

    const inject_yes = Boolean(needle_yes && path_ok && !leftover_in_user && !path_agents);

    report.inject = {
      yes: inject_yes,
      needles_in_frames: frameNeedles.hits,
      needles_in_jsonl: [...new Set(jsonlHits)].sort(),
      needle_yes,
      details_path,
      details_paths: detailsPaths.slice(0, 20),
      path_ok,
      path_agents,
      leftover_slash,
      leftover_slash_in_user: leftover_in_user,
      user_has_literal_slash,
      user_has_needle,
    };
    report.ok = Boolean(
      report.get_available_commands.has_skill_ps_create_verification_skill &&
        report.get_available_commands.has_poteto_mode_unprefixed &&
        inject_yes
    );
    console.log(JSON.stringify(report.inject, null, 2));
    return report;
  } finally {
    try {
      proc.stdin.end();
    } catch {}
    await new Promise((resolve) => {
      const t = setTimeout(() => {
        proc.kill();
        resolve();
      }, 5000);
      proc.on("exit", () => {
        clearTimeout(t);
        resolve();
      });
    });
    report.stderr_tail = stderr.slice(-3000);
  }
}

const attempts = [];
let final = null;
try {
  final = await runOnce(null);
  attempts.push({ plugin_dir: null, ok: final.ok, ready: true, inject: final.inject, n_skill_ps: final.get_available_commands && final.get_available_commands.n_skill_ps });
} catch (exc) {
  attempts.push({ plugin_dir: null, ok: false, error: String(exc) });
  console.log("FAIL", String(exc));
}

const summary = {
  attempts,
  argv: final && final.argv,
  cmd_joined: final && final.argv && final.argv.join(" "),
  plugin_dir: final && final.plugin_dir,
  cwd: ROOT,
  inject: final && final.inject,
  get_available_commands: final && final.get_available_commands,
  ok: final && final.ok,
  stderr_tail: final && final.stderr_tail,
  jsonl: final && final.jsonl && { exists: final.jsonl.exists, path: final.jsonl.path, lines: final.jsonl.lines, n_hits: (final.jsonl.hits || []).length, n_skill_prompts: (final.jsonl.skill_prompts || []).length, paths: final.jsonl.paths },
  inject_frames: final && final.inject_frames,
};
writeFileSync(OUT, JSON.stringify({ summary, final }, null, 2));
console.log("WROTE", OUT);
console.log(JSON.stringify(summary, null, 2));
