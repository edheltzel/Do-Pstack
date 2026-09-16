import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { repoDir, runCiStatic } from "./py-ci.ts";

const SKIP_HREF = /^(https?:|mailto:|javascript:|#)/i;

function markdownHrefs(markdown: string): string[] {
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

function posixJoin(baseDir: string, rel: string): string {
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

function brokenLocalMarkdownLinks(args: {
  fromRel: string;
  markdown: string;
  exists: (rel: string) => boolean;
}): { from: string; href: string; resolved: string }[] {
  const dir = args.fromRel.includes("/") ? args.fromRel.slice(0, args.fromRel.lastIndexOf("/")) : "";
  const broken: { from: string; href: string; resolved: string }[] = [];
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

function walkMarkdown(root: string, relDir: string): string[] {
  const dir = join(root, relDir);
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const rel = relDir ? `${relDir}/${name}` : name;
    const full = join(root, rel);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walkMarkdown(root, rel));
    else if (name.endsWith(".md")) out.push(rel);
  }
  return out;
}

describe("original product pack", () => {
  const root = repoDir();

  it("ci_static.py --product fails when docs/guide, benny, or do-swarm are missing", () => {
    const empty = mkdtempSync(join(tmpdir(), "pstack-product-"));
    mkdirSync(join(empty, "docs"), { recursive: true });
    writeFileSync(join(empty, "docs/README.md"), "# hi\n");
    const { status, summary } = runCiStatic(["--product"], empty);
    expect(status).toBe(1);
    expect(summary.failed).toContain("docs/guide/README.md");
    expect(summary.failed).toContain("automations/benny/FOR_AGENTS.md");
    expect(summary.failed).toContain("skills/do-swarm/SKILL.md");
  });

  it("keeps the original numbered guide, benny pack, do-swarm, and comment-sicko", () => {
    const { status, summary } = runCiStatic(["--product"], root);
    expect(status).toBe(0);
    expect(summary.ok).toBe(true);
    expect(summary.failed).toEqual([]);
  });

  it("README links the local original guide path", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8");
    const hrefs = markdownHrefs(readme);
    const hits = hrefs.filter((h) => {
      if (/^https?:/i.test(h)) return false;
      const resolved = posixJoin("", h.split("#")[0] ?? "");
      return resolved === "docs/guide/README.md";
    });
    expect(hits.length, "README.md must link to ./docs/guide/README.md").toBeGreaterThan(0);
  });

  it("README teaches GitHub omp/Pi install and Claude plugin install; competing stories gone", () => {
    const readme = readFileSync(join(root, "README.md"), "utf8");
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
    expect(readme).toContain("omp plugin marketplace add edheltzel/pstack-for-omp");
    expect(readme).toContain("omp plugin install pstack@pstack");
    expect(agents).toContain("omp plugin marketplace add edheltzel/pstack-for-omp");
    expect(readme).toContain("pi install git:github.com/edheltzel/pstack-for-omp");
    expect(agents).toContain("pi install git:github.com/edheltzel/pstack-for-omp");
    expect(readme).toContain("omp plugin link ./");
    expect(agents).toContain("omp plugin link ./");
    expect(readme).toContain("claude plugin marketplace add");
    expect(readme).toContain("claude plugin install pstack@pstack");
    expect(agents).toContain("claude plugin install pstack@pstack");
    expect(readme).toContain("claude --plugin-dir ./");
    expect(readme).toContain("/pstack:do-");

    expect(readme).not.toMatch(/omp -e /);
    expect(readme).not.toContain("/add-plugin");
    expect(readme).not.toContain(".omp/skills");
    expect(existsSync(join(root, ".omp/skills"))).toBe(false);
    expect(() => lstatSync(join(root, ".omp/skills"))).toThrow();
    expect(existsSync(join(root, "docs/getting-started.md"))).toBe(false);
    expect(existsSync(join(root, "commands/setup-pstack.md"))).toBe(false);
    expect(existsSync(join(root, "commands/poteto-mode.md"))).toBe(false);
    expect(existsSync(join(root, ".omp-plugin/marketplace.json"))).toBe(false);
    expect(existsSync(join(root, ".claude-plugin/plugin.json"))).toBe(true);
    expect(existsSync(join(root, ".claude-plugin/marketplace.json"))).toBe(true);
    expect(existsSync(join(root, ".claude-plugin/skills"))).toBe(false);
    expect(existsSync(join(root, "e2e/unit/static-checks.ts"))).toBe(false);
    expect(existsSync(join(root, "skills/do-poteto-mode/playbooks/shipping.md"))).toBe(false);
  });

  it("scratch .tmp-* and e2e/_fm*-proof* are gone and gitignored", () => {
    const root = repoDir();
    const gitignore = readFileSync(join(root, ".gitignore"), "utf8");
    expect(gitignore).toMatch(/^\.tmp\*\//m);
    expect(gitignore).toMatch(/_fm\*-proof\*/);
    expect(existsSync(join(root, "e2e/_fm230-proof.mjs"))).toBe(false);
    expect(existsSync(join(root, ".tmp-fm-ponytail"))).toBe(false);
    expect(existsSync(join(root, ".tmp-fm320-ponytail"))).toBe(false);
    const { status, summary } = runCiStatic(["--quality"], root);
    expect(status).toBe(0);
    expect(summary.failed).not.toContain("packaging");
  });

  it("guide setup matches do-setup-pstack Roles /agents; no pstack-models.mdc leftover", () => {
    const root = repoDir();
    const leftover = walkMarkdown(root, "docs/guide").filter((rel) =>
      readFileSync(join(root, rel), "utf8").includes("pstack-models.mdc"),
    );
    expect(leftover, JSON.stringify(leftover)).toEqual([]);
    const setup = readFileSync(join(root, "docs/guide/01-setup.md"), "utf8");
    expect(setup).toContain("/agents");
    expect(setup).toContain("Roles");
    expect(setup).not.toContain("inherit-parent");
  });

  it("README and docs relative links resolve (no 404 on original guide paths)", () => {
    const files = ["README.md", ...walkMarkdown(root, "docs"), ...walkMarkdown(root, "automations")];
    const exists = (rel: string) => existsSync(join(root, rel));
    const broken = files.flatMap((fromRel) =>
      brokenLocalMarkdownLinks({
        fromRel,
        markdown: readFileSync(join(root, fromRel), "utf8"),
        exists,
      }),
    );
    expect(broken, JSON.stringify(broken, null, 2)).toEqual([]);
  });

  it("benny pack stays a non-slash source (not under skills/)", () => {
    expect(statSync(join(root, "automations/benny")).isDirectory()).toBe(true);
    expect(existsSync(join(root, "skills/do-setup-benny/SKILL.md"))).toBe(false);
    expect(existsSync(join(root, "skills/setup-benny/SKILL.md"))).toBe(false);
  });

  it("comment-sicko still matches the original product and is spawned by do-no-comments", () => {
    const sicko = readFileSync(join(root, "agents/comment-sicko.md"), "utf8");
    expect(sicko).toContain("Yes... Ha ha ha... Yes!");
    expect(sicko).toContain("MUST KILL");
    expect(sicko).toContain("I never write application code.");
    const noComments = readFileSync(join(root, "skills/do-no-comments/SKILL.md"), "utf8");
    expect(noComments).toMatch(/agent:\s*"comment-sicko"/);
  });

  it("e2e launcher loads via omp plugin link ./ and never -e", () => {
    const launcher = readFileSync(join(root, "e2e/run.py"), "utf8");
    expect(launcher).toContain('"plugin", "link"');
    expect(launcher).not.toMatch(/-e .*extensions\/pstack/);
  });
});
