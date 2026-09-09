#!/usr/bin/env node
/**
 * Vendor official pstack skills from cursor/plugins into this package's
 * single skills/do-* tree. Not a second skill tree. Not skills.sh.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const UPSTREAM_REPO = "https://github.com/cursor/plugins.git";
export const UPSTREAM_SKILLS = "pstack/skills";
export const UPSTREAM_PLUGIN_JSON = "pstack/.cursor-plugin/plugin.json";
/** Paths this fork removed on purpose. Relative to upstream skills/. */
export const LOCAL_SUBTRACTIONS = Object.freeze(["poteto-mode/playbooks/shipping.md"]);

const TEXT = /\.(md|txt|json|yml|yaml|ts|js|mjs|cjs|sh)$/i;
const HELP = `Usage: pstack <command> [options]

Commands:
  sync    Pull official skills from cursor/plugins into skills/do-*

pstack sync [--dry-run] [--force] [--from DIR] [--repo URL] [--ref REF] [--root DIR]

SoT is github.com/cursor/plugins (pstack/skills), not backnotprop/pstack or skills.sh.
Writes into the existing skills/do-* tree. Does not install into agent skill dirs.
`;

export function parseArgs(argv) {
  const args = [...argv];
  const command = args.shift() ?? "";
  const opts = {
    command,
    dryRun: false,
    force: false,
    from: null,
    repo: UPSTREAM_REPO,
    ref: null,
    root: null,
    help: false,
  };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--force") opts.force = true;
    else if (a === "--from") opts.from = args[++i];
    else if (a === "--repo") opts.repo = args[++i];
    else if (a === "--ref") opts.ref = args[++i];
    else if (a === "--root") opts.root = args[++i];
    else throw new Error(`unknown option: ${a}`);
  }
  return opts;
}

export function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function rewriteLayout(text, slugs, ownSlug) {
  let out = text;
  if (ownSlug && !ownSlug.startsWith("do-")) {
    out = out.replace(new RegExp(`^(name:\\s*)${escapeRegExp(ownSlug)}\\s*$`, "m"), `$1do-${ownSlug}`);
  }
  const sorted = [...slugs].filter((s) => s && !s.startsWith("do-")).sort((a, b) => b.length - a.length);
  for (const slug of sorted) {
    const dest = `do-${slug}`;
    const reSlug = escapeRegExp(slug);
    out = out.replace(new RegExp(`(?<![\\w-])skills/${reSlug}/`, "g"), `skills/${dest}/`);
    out = out.replace(new RegExp(`\\.\\./${reSlug}/`, "g"), `../${dest}/`);
  }
  return out;
}

function isTextPath(rel) {
  return TEXT.test(rel);
}

function listSkillSlugs(skillsDir) {
  if (!existsSync(skillsDir)) return [];
  return readdirSync(skillsDir)
    .filter((name) => existsSync(join(skillsDir, name, "SKILL.md")))
    .sort();
}

function walkFiles(root) {
  const out = [];
  if (!existsSync(root)) return out;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const name of readdirSync(dir).sort().reverse()) {
      if (name === ".git" || name === "node_modules") continue;
      const full = join(dir, name);
      const st = statSync(full);
      if (st.isDirectory()) stack.push(full);
      else out.push(relative(root, full).split("\\").join("/"));
    }
  }
  return out.sort();
}

export function resolveUpstreamSkillsDir(fromDir) {
  const abs = resolve(fromDir);
  const nested = join(abs, UPSTREAM_SKILLS);
  if (existsSync(join(nested, "how", "SKILL.md")) || existsSync(nested)) {
    const slugs = listSkillSlugs(nested);
    if (slugs.length) return nested;
  }
  const slugs = listSkillSlugs(abs);
  if (slugs.length) return abs;
  throw new Error(`no upstream skills at ${fromDir} (expected ${UPSTREAM_SKILLS} or a skills dir)`);
}

function readJsonVersion(path) {
  if (!existsSync(path)) return null;
  try {
    const json = JSON.parse(readFileSync(path, "utf8"));
    return typeof json.version === "string" ? json.version : null;
  } catch {
    return null;
  }
}

function findPluginVersion(start) {
  const abs = resolve(start);
  return (
    readJsonVersion(join(abs, UPSTREAM_PLUGIN_JSON)) ||
    readJsonVersion(join(abs, ".cursor-plugin/plugin.json")) ||
    readJsonVersion(join(abs, "..", ".cursor-plugin/plugin.json"))
  );
}

function gitRev(dir) {
  const result = spawnSync("git", ["-C", dir, "rev-parse", "HEAD"], { encoding: "utf8" });
  if (result.status !== 0) return null;
  return (result.stdout || "").trim() || null;
}

export function fetchUpstream(opts) {
  const dest = opts.dest;
  const args = ["clone", "--depth", "1", "--filter=blob:none", "--sparse"];
  if (opts.ref) args.push("--branch", opts.ref);
  args.push(opts.repo, dest);
  const clone = spawnSync("git", args, { encoding: "utf8" });
  if (clone.status !== 0) {
    throw new Error(`git clone failed (${clone.status}): ${(clone.stderr || clone.stdout || "").trim()}`);
  }
  const sparse = spawnSync(
    "git",
    ["-C", dest, "sparse-checkout", "set", UPSTREAM_SKILLS, "pstack/.cursor-plugin"],
    { encoding: "utf8" },
  );
  if (sparse.status !== 0) {
    throw new Error(`git sparse-checkout failed (${sparse.status}): ${(sparse.stderr || sparse.stdout || "").trim()}`);
  }
  return {
    skillsDir: resolveUpstreamSkillsDir(dest),
    sha: gitRev(dest),
    version: findPluginVersion(dest),
    repo: opts.repo,
  };
}

function transformedBytes(relInSkill, raw, slugs, slug) {
  if (!isTextPath(relInSkill)) return raw;
  let text;
  try {
    text = raw.toString("utf8");
  } catch {
    return raw;
  }
  return Buffer.from(rewriteLayout(text, slugs, slug), "utf8");
}

export function planSync(args) {
  const upstreamSkills = args.upstreamSkills;
  const destSkills = args.destSkills;
  const force = Boolean(args.force);
  const slugs = listSkillSlugs(upstreamSkills);
  if (!slugs.length) throw new Error(`no SKILL.md trees under ${upstreamSkills}`);
  const subtraction = new Set(LOCAL_SUBTRACTIONS);
  /** @type {{kind: string, destRel: string, src: string, bytes?: Buffer}[]} */
  const actions = [];
  let unchanged = 0;
  let diverged = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const srcRoot = join(upstreamSkills, slug);
    const destRoot = join(destSkills, `do-${slug}`);
    for (const rel of walkFiles(srcRoot)) {
      const upRel = `${slug}/${rel}`;
      const destRel = `skills/do-${slug}/${rel}`;
      if (subtraction.has(upRel)) {
        actions.push({ kind: "skip", destRel, src: upRel });
        skipped += 1;
        continue;
      }
      const srcPath = join(srcRoot, rel);
      const raw = readFileSync(srcPath);
      const bytes = transformedBytes(rel, raw, slugs, slug);
      const destPath = join(destRoot, rel);
      if (!existsSync(destPath)) {
        actions.push({ kind: "add", destRel, src: upRel, bytes });
        continue;
      }
      const current = readFileSync(destPath);
      if (current.equals(bytes)) {
        unchanged += 1;
        continue;
      }
      if (force) {
        actions.push({ kind: "update", destRel, src: upRel, bytes });
        continue;
      }
      actions.push({ kind: "diverged", destRel, src: upRel });
      diverged += 1;
    }
  }

  return { slugs, actions, unchanged, diverged, skipped };
}

export function applyPlan(root, plan) {
  const written = [];
  for (const action of plan.actions) {
    if (action.kind !== "add" && action.kind !== "update") continue;
    const path = join(root, action.destRel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, action.bytes);
    written.push(action.destRel);
  }
  return written;
}

export function formatReport(info) {
  const lines = [
    `source: ${info.repo}${info.sha ? `@${info.sha}` : ""}`,
    `sot: cursor/plugins pstack/skills → skills/do-*`,
  ];
  if (info.version) lines.push(`upstream-version: ${info.version}`);
  if (info.dryRun) lines.push("mode: dry-run");
  const added = info.plan.actions.filter((a) => a.kind === "add");
  const updated = info.plan.actions.filter((a) => a.kind === "update");
  const skipped = info.plan.actions.filter((a) => a.kind === "skip");
  const diverged = info.plan.actions.filter((a) => a.kind === "diverged");
  for (const a of added) lines.push(`added: ${a.destRel}`);
  for (const a of updated) lines.push(`updated: ${a.destRel}`);
  for (const a of skipped) lines.push(`skipped: ${a.destRel} (local subtraction)`);
  const divergedSkills = [...new Set(diverged.map((a) => a.destRel.split("/").slice(0, 2).join("/")))].sort();
  if (divergedSkills.length) {
    lines.push(`diverged-kept-local: ${divergedSkills.join(" ")}`);
  }
  lines.push(
    `summary: added=${added.length} updated=${updated.length} skipped=${skipped.length} diverged=${diverged.length} unchanged=${info.plan.unchanged}`,
  );
  return lines.join("\n");
}

export function runSync(opts) {
  const root = resolve(opts.root);
  const destSkills = join(root, "skills");
  let tmp = null;
  let fetched = {
    skillsDir: "",
    sha: null,
    version: null,
    repo: opts.from ? opts.from : opts.repo,
  };
  try {
    if (opts.from) {
      fetched.skillsDir = resolveUpstreamSkillsDir(opts.from);
      fetched.sha = gitRev(opts.from) || gitRev(fetched.skillsDir);
      fetched.version = findPluginVersion(opts.from) || findPluginVersion(fetched.skillsDir);
    } else {
      tmp = mkdtempSync(join(tmpdir(), "pstack-sync-"));
      fetched = fetchUpstream({ repo: opts.repo, ref: opts.ref, dest: tmp });
    }
    const plan = planSync({
      upstreamSkills: fetched.skillsDir,
      destSkills,
      force: opts.force,
    });
    if (!opts.dryRun) applyPlan(root, plan);
    return {
      repo: fetched.repo,
      sha: fetched.sha,
      version: fetched.version,
      dryRun: Boolean(opts.dryRun),
      plan,
    };
  } finally {
    if (tmp) rmSync(tmp, { recursive: true, force: true });
  }
}

export function main(argv = process.argv.slice(2), io = process) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (err) {
    io.stderr.write(`${err instanceof Error ? err.message : err}\n${HELP}`);
    return 2;
  }
  if (opts.help || !opts.command) {
    io.stdout.write(HELP);
    return opts.help ? 0 : 2;
  }
  if (opts.command !== "sync") {
    io.stderr.write(`unknown command: ${opts.command}\n${HELP}`);
    return 2;
  }
  try {
    const root = opts.root ? resolve(opts.root) : resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const report = runSync({ ...opts, root });
    io.stdout.write(`${formatReport(report)}\n`);
    return 0;
  } catch (err) {
    io.stderr.write(`${err instanceof Error ? err.message : err}\n`);
    return 1;
  }
}

const entry = process.argv[1] ? resolve(process.argv[1]) : "";
if (entry && fileURLToPath(import.meta.url) === entry) {
  process.exit(main());
}
