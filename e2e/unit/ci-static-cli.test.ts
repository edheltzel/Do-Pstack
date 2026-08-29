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

  it("fails parse when the factory has no export default", () => {
    const root = fixture({
      "extensions/pstack.ts": "const nope = 1;\n",
    });
    const { status, summary } = runCiStatic(["--perf"], root);
    expect(status).toBe(1);
    expect(summary.failed).toContain("pstack_parse");
  });
});
