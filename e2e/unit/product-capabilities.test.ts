import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import {
  brokenLocalMarkdownLinks,
  markdownHrefs,
  posixJoin,
  PRODUCT_PACK_FILES,
  productPackChecks,
  type TreeStat,
} from "./static-checks.ts";
import { repoDir, runCiStatic } from "./py-ci.ts";

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

function repoTree(root: string): TreeStat {
  return {
    exists: (rel) => existsSync(join(root, rel)),
    isFile: (rel) => {
      const p = join(root, rel);
      return existsSync(p) && statSync(p).isFile();
    },
    isDir: (rel) => {
      const p = join(root, rel);
      return existsSync(p) && statSync(p).isDirectory();
    },
  };
}

describe("markdown link helpers", () => {
  it("extracts image and link hrefs and skips titled extras", () => {
    const md =
      "See [guide](./docs/guide/README.md) and ![x](./docs/guide/images/router.jpg \"alt\").\n" +
      "Skip [remote](https://example.com/x) and [mail](mailto:a@b.c) and [here](#anchor).\n" +
      "Keep [rel](../skills/ps-swarm/SKILL.md#name).";
    expect(markdownHrefs(md)).toEqual([
      "./docs/guide/README.md",
      "./docs/guide/images/router.jpg",
      "https://example.com/x",
      "mailto:a@b.c",
      "#anchor",
      "../skills/ps-swarm/SKILL.md#name",
    ]);
  });

  it("posixJoin walks .. segments", () => {
    expect(posixJoin("docs/guide", "../../skills/ps-how/SKILL.md")).toBe("skills/ps-how/SKILL.md");
    expect(posixJoin("", "./docs/guide/README.md")).toBe("docs/guide/README.md");
  });

  it("reports broken relative targets and ignores http", () => {
    const exists = (rel: string) => rel === "docs/guide/README.md";
    const broken = brokenLocalMarkdownLinks({
      fromRel: "README.md",
      markdown: "[ok](./docs/guide/README.md) [bad](./docs/guide/nope.md) [web](https://x)",
      exists,
    });
    expect(broken).toEqual([
      { from: "README.md", href: "./docs/guide/nope.md", resolved: "docs/guide/nope.md" },
    ]);
  });
});

describe("original product pack", () => {
  const root = repoDir();
  const tree = repoTree(root);

  it("fails when docs/guide, benny, or ps-swarm are missing", () => {
    const missing: TreeStat = {
      exists: () => false,
      isFile: () => false,
      isDir: () => false,
    };
    const results = productPackChecks(missing);
    expect(results.find((r) => r.name === "docs/guide/README.md")?.ok).toBe(false);
    expect(results.find((r) => r.name === "automations/benny/FOR_AGENTS.md")?.ok).toBe(false);
    expect(results.find((r) => r.name === "skills/ps-swarm/SKILL.md")?.ok).toBe(false);
  });

  it("keeps the original numbered guide, benny pack, ps-swarm, and comment-sicko", () => {
    const results = productPackChecks(tree);
    expect(results.filter((r) => !r.ok).map((r) => r.name)).toEqual([]);
    expect(PRODUCT_PACK_FILES).toContain("docs/getting-started.md");
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

  it("README and docs relative links resolve (no 404 on original guide paths)", () => {
    const files = ["README.md", ...walkMarkdown(root, "docs"), ...walkMarkdown(root, "automations")];
    const broken = files.flatMap((fromRel) =>
      brokenLocalMarkdownLinks({
        fromRel,
        markdown: readFileSync(join(root, fromRel), "utf8"),
        exists: (rel) => tree.exists(rel),
      }),
    );
    expect(broken, JSON.stringify(broken, null, 2)).toEqual([]);
  });

  it("benny pack stays a non-slash source (not under skills/)", () => {
    expect(tree.isDir("automations/benny")).toBe(true);
    expect(tree.isFile("skills/ps-setup-benny/SKILL.md")).toBe(false);
    expect(tree.isFile("skills/setup-benny/SKILL.md")).toBe(false);
  });

  it("comment-sicko still matches the original product and is spawned by ps-no-comments", () => {
    const sicko = readFileSync(join(root, "agents/comment-sicko.md"), "utf8");
    expect(sicko).toContain("Yes... Ha ha ha... Yes!");
    expect(sicko).toContain("MUST KILL");
    expect(sicko).toContain("I never write application code.");
    const noComments = readFileSync(join(root, "skills/ps-no-comments/SKILL.md"), "utf8");
    expect(noComments).toMatch(/agent:\s*"comment-sicko"/);
  });

  it("ci_static.py --product matches this pack on the repo", () => {
    const { status, summary } = runCiStatic(["--product"], root);
    expect(status).toBe(0);
    expect(summary.ok).toBe(true);
    expect(summary.failed).toEqual([]);
    expect(summary.n).toBe(PRODUCT_PACK_FILES.length);
  });

  it("ci_static.py --product fails a tree without the guide", () => {
    const empty = mkdtempSync(join(tmpdir(), "pstack-product-"));
    mkdirSync(join(empty, "docs"), { recursive: true });
    writeFileSync(join(empty, "docs/getting-started.md"), "# hi\n");
    const { status, summary } = runCiStatic(["--product"], empty);
    expect(status).toBe(1);
    expect(summary.failed).toContain("docs/guide/README.md");
    expect(summary.failed).toContain("automations/benny/FOR_AGENTS.md");
    expect(summary.failed).toContain("skills/ps-swarm/SKILL.md");
  });
});

describe("posixJoin used by repo-relative checks", () => {
  it("stays inside the listing used by product pack", () => {
    const root = repoDir();
    const listing = PRODUCT_PACK_FILES.map((rel) => relative(root, join(root, rel)));
    expect(listing).toEqual([...PRODUCT_PACK_FILES]);
  });
});
