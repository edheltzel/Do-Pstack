export type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

export const PSTACK_MAX_BYTES = 32 * 1024;

const FOLDED = new Set([">", "|", ">-", "|-", ">+", "|+"]);

export function parseFrontmatter(text: string): Record<string, string> | null {
  if (!text.startsWith("---")) return null;
  const lines = text.split(/\r?\n/);
  if (lines.length === 0 || lines[0].trim() !== "---") return null;
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === "---");
  if (end < 0) return null;
  const fields: Record<string, string> = {};
  let current: string | undefined;
  for (const line of lines.slice(1, end)) {
    if (line && !line[0].match(/\s/) && line.includes(":")) {
      const idx = line.indexOf(":");
      current = line.slice(0, idx).trim();
      let val = line.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
      if (FOLDED.has(val)) val = "";
      fields[current] = val;
    } else if (current && (line.startsWith(" ") || line.startsWith("\t"))) {
      const extra = line.trim();
      if (extra) {
        fields[current] = fields[current] ? `${fields[current]} ${extra}` : extra;
      }
    }
  }
  return fields;
}

export function braceBalance(text: string): boolean {
  let depth = 0;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const ch = text[i];
    if (ch === "'" || ch === '"') {
      const quote = ch;
      i += 1;
      while (i < n) {
        if (text[i] === "\\") {
          i += 2;
          continue;
        }
        if (text[i] === quote) {
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }
    if (ch === "/" && i + 1 < n && text[i + 1] === "/") {
      const nl = text.indexOf("\n", i);
      i = nl < 0 ? n : nl + 1;
      continue;
    }
    if (ch === "/" && i + 1 < n && text[i + 1] === "*") {
      const end = text.indexOf("*/", i + 2);
      i = end < 0 ? n : end + 2;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth < 0) return false;
    }
    i += 1;
  }
  return depth === 0;
}

export function sizeAndParse(
  raw: Uint8Array,
  maxBytes: number = PSTACK_MAX_BYTES,
): CheckResult[] {
  const results: CheckResult[] = [];
  const sizeOk = raw.byteLength <= maxBytes;
  results.push({
    name: "pstack_size",
    ok: sizeOk,
    detail: `${raw.byteLength} bytes (budget ${maxBytes})`,
  });
  if (raw.includes(0)) {
    results.push({ name: "pstack_parse", ok: false, detail: "contains NUL" });
    return results;
  }
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(raw);
  } catch (err) {
    results.push({ name: "pstack_parse", ok: false, detail: `not utf-8: ${String(err)}` });
    return results;
  }
  const parseOk = text.includes("export default function") && braceBalance(text);
  results.push({
    name: "pstack_parse",
    ok: parseOk,
    detail: parseOk ? "utf-8 TS/JS with export default" : "does not parse as TS/JS",
  });
  return results;
}

export function sizeAndParseMissing(): CheckResult {
  return { name: "pstack_size", ok: false, detail: "extensions/pstack.ts missing" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type TreeStat = {
  exists: (rel: string) => boolean;
  isFile: (rel: string) => boolean;
  isDir: (rel: string) => boolean;
};

export function qualityFromPackage(args: {
  packageJsonText: string | undefined;
  tree: TreeStat;
}): CheckResult[] {
  const { packageJsonText, tree } = args;
  if (packageJsonText === undefined) {
    return [{ name: "package_json", ok: false, detail: "package.json missing" }];
  }
  let pkg: unknown;
  try {
    pkg = JSON.parse(packageJsonText);
  } catch (err) {
    return [{ name: "package_json", ok: false, detail: `invalid JSON: ${String(err)}` }];
  }
  const results: CheckResult[] = [{ name: "package_json", ok: true, detail: "present" }];
  const omp = isRecord(pkg) ? pkg.omp : undefined;
  let declared: string[] = [];
  if (!isRecord(omp)) {
    results.push({ name: "omp_extensions", ok: false, detail: "package.json has no omp object" });
    results.push({ name: "omp_skills", ok: false, detail: "package.json has no omp object" });
  } else {
    const exts = omp.extensions;
    const skills = omp.skills;
    const extOk = Array.isArray(exts) && exts.length > 0;
    const skillOk = Array.isArray(skills) && skills.length > 0;
    results.push({
      name: "omp_extensions",
      ok: extOk,
      detail: extOk ? "omp.extensions declared" : "missing or empty",
    });
    results.push({
      name: "omp_skills",
      ok: skillOk,
      detail: skillOk ? "omp.skills declared" : "missing or empty",
    });
    declared = [
      ...(Array.isArray(exts) ? exts.map(String) : []),
      ...(Array.isArray(skills) ? skills.map(String) : []),
    ];
  }
  for (const rel of declared) {
    const ok = tree.exists(rel);
    results.push({
      name: `omp_path:${rel}`,
      ok,
      detail: ok ? "present" : "missing",
    });
  }
  const required = [
    { rel: "extensions/pstack.ts", wantFile: true },
    { rel: "skills", wantFile: false },
    { rel: "agents", wantFile: false },
    { rel: "commands", wantFile: false },
  ] as const;
  for (const { rel, wantFile } of required) {
    const ok = wantFile ? tree.isFile(rel) : tree.isDir(rel);
    const kind = wantFile ? "file" : "directory";
    results.push({
      name: rel,
      ok,
      detail: ok ? `${kind} present` : `${kind} missing`,
    });
  }
  return results;
}

export function frontmatterSkillCheck(text: string): CheckResult {
  const fields = parseFrontmatter(text);
  if (fields === null) {
    return { name: "skill", ok: false, detail: "missing YAML frontmatter" };
  }
  const name = (fields.name ?? "").trim();
  const description = (fields.description ?? "").trim();
  const missing = [
    ...(name ? [] : ["name"]),
    ...(description ? [] : ["description"]),
  ];
  return {
    name: "skill",
    ok: missing.length === 0,
    detail: missing.length === 0 ? "name + description" : `missing ${missing.join(", ")}`,
  };
}

export function frontmatterCommandCheck(text: string): CheckResult {
  const fields = parseFrontmatter(text);
  if (fields === null) {
    return { name: "command", ok: false, detail: "missing YAML frontmatter" };
  }
  const description = (fields.description ?? "").trim();
  return {
    name: "command",
    ok: Boolean(description),
    detail: description ? "description" : "missing description",
  };
}

/** Original product files that must stay in this omp fork. */
export const PRODUCT_PACK_FILES = [
  "docs/getting-started.md",
  "docs/guide/README.md",
  "docs/guide/01-setup.md",
  "docs/guide/02-poteto-mode.md",
  "docs/guide/03-understand.md",
  "docs/guide/04-design.md",
  "docs/guide/05-build-and-clean.md",
  "docs/guide/06-verify-and-ship.md",
  "docs/guide/07-overnight.md",
  "docs/guide/08-principles.md",
  "docs/guide/09-make-it-yours.md",
  "docs/guide/10-recipes-and-pitfalls.md",
  "docs/guide/images/design.jpg",
  "docs/guide/images/overnight.jpg",
  "docs/guide/images/recipes.jpg",
  "docs/guide/images/router.jpg",
  "docs/guide/images/understanding.jpg",
  "docs/guide/images/verification.jpg",
  "automations/benny/FOR_AGENTS.md",
  "automations/benny/README.md",
  "automations/benny/skills/reproduce-and-fix-issues/SKILL.md",
  "automations/benny/skills/reproduce-and-fix-issues/references/control-adapter.md",
  "automations/benny/skills/reproduce-and-fix-issues/references/feature-map.example.md",
  "automations/benny/skills/reproduce-and-fix-issues/references/verify-existing-fix.md",
  "automations/benny/skills/setup-benny/SKILL.md",
  "automations/benny/skills/triage-issue-reports/SKILL.md",
  "automations/benny/skills/triage-issue-reports/references/routing.example.md",
  "automations/benny/templates/configuration.example.yaml",
  "automations/benny/templates/reproduce-automation-prompt.md",
  "automations/benny/templates/triage-automation-prompt.md",
  "skills/ps-swarm/SKILL.md",
  "agents/comment-sicko.md",
  "agents/poteto-agent.md",
] as const;

export function productPackChecks(tree: TreeStat): CheckResult[] {
  return PRODUCT_PACK_FILES.map((rel) => {
    const ok = tree.exists(rel);
    return { name: rel, ok, detail: ok ? "present" : "missing" };
  });
}

const SKIP_HREF = /^(https?:|mailto:|javascript:|#)/i;

/** Markdown image/link hrefs, excluding autolinks. */
export function markdownHrefs(markdown: string): string[] {
  const hrefs: string[] = [];
  const re = /!?\[(?:\\.|[^\]])*\]\(\s*(<[^>\n]+>|[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'))?\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    let href = match[1] ?? "";
    if (href.startsWith("<") && href.endsWith(">")) href = href.slice(1, -1);
    hrefs.push(href);
  }
  return hrefs;
}

export function posixJoin(baseDir: string, rel: string): string {
  const raw = rel.replace(/\\/g, "/");
  const start = raw.startsWith("/") ? [] : baseDir.split("/").filter(Boolean);
  for (const part of raw.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      start.pop();
      continue;
    }
    start.push(part);
  }
  return start.join("/");
}

export type BrokenLink = { from: string; href: string; resolved: string };

export function brokenLocalMarkdownLinks(args: {
  fromRel: string;
  markdown: string;
  exists: (rel: string) => boolean;
}): BrokenLink[] {
  const dir = args.fromRel.includes("/") ? args.fromRel.slice(0, args.fromRel.lastIndexOf("/")) : "";
  const broken: BrokenLink[] = [];
  for (const href of markdownHrefs(args.markdown)) {
    if (SKIP_HREF.test(href)) continue;
    const noHash = href.split("#")[0] ?? "";
    if (!noHash) continue;
    const resolved = posixJoin(dir, noHash);
    if (!args.exists(resolved)) {
      broken.push({ from: args.fromRel, href, resolved });
    }
  }
  return broken;
}
