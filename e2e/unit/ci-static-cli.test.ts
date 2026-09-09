import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCiStatic } from "./py-ci.ts";

function fixture(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "pstack-ci-"));
  for (const [rel, body] of Object.entries(files)) {
    const path = join(root, rel);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, body);
  }
  return root;
}

describe("ci_static.py CLI fixtures", () => {
  it("fails quality without package.json", () => {
    const root = fixture({});
    const { status, summary } = runCiStatic(["--quality"], root);
    expect(status).toBe(1);
    expect(summary.failed).toContain("package_json");
  });

  it("fails frontmatter when SKILL.md lacks description", () => {
    const root = fixture({
      "skills/x/SKILL.md": "---\nname: x\n---\n",
      "commands/x.md": "---\ndescription: ok\n---\n",
    });
    const { status, summary } = runCiStatic(["--frontmatter"], root);
    expect(status).toBe(1);
    expect(summary.failed).toContain("skills/x/SKILL.md");
  });

  it("fails quality when the factory is over the size budget", () => {
    const root = fixture({
      "package.json": JSON.stringify({ omp: { extensions: ["./extensions/pstack.ts"] } }),
      "extensions/pstack.ts": `export default function pstack() {${"x".repeat(33 * 1024)}}\n`,
      "skills/.keep": "",
      "agents/.keep": "",
    });
    const { status, summary } = runCiStatic(["--quality"], root);
    expect(status).toBe(1);
    expect(summary.failed).toContain("pstack_size");
  });

  it("fails quality when scratch .tmp-* or e2e/_fm*-proof* files are in the tree", () => {
    const root = fixture({
      "package.json": JSON.stringify({ omp: { extensions: ["./extensions/pstack.ts"] } }),
      "extensions/pstack.ts": "export default function pstack() {}\n",
      "skills/.keep": "",
      "agents/.keep": "",
      ".tmp-fm-x/keep": "",
      "e2e/_fm1-proof.mjs": "export {}\n",
    });
    const { status, summary } = runCiStatic(["--quality"], root);
    expect(status).toBe(1);
    expect(summary.failed).toContain("packaging");
  });

  it("fails quality without Claude plugin.json", () => {
    const root = fixture({
      "package.json": JSON.stringify({ omp: { extensions: ["./extensions/pstack.ts"] } }),
      "extensions/pstack.ts": "export default function pstack() {}\n",
      "skills/.keep": "",
      "agents/.keep": "",
    });
    const { status, summary } = runCiStatic(["--quality"], root);
    expect(status).toBe(1);
    expect(summary.failed).toContain("claude_plugin_json");
  });

  it("fails product when docs/guide is missing", () => {
    const root = fixture({
      "docs/README.md": "# docs\n",
    });
    const { status, summary } = runCiStatic(["--product"], root);
    expect(status).toBe(1);
    expect(summary.failed).toContain("docs/guide/README.md");
    expect(summary.failed).toContain("automations/benny/FOR_AGENTS.md");
    expect(summary.failed).toContain("skills/do-swarm/SKILL.md");
  });
});
