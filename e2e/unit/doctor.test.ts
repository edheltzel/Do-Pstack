import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { repoDir, runCiStatic } from "./py-ci.ts";

describe("package.json doctor", () => {
  it("plugin layout is real: omp.extensions path and skills/ps-*/SKILL.md", () => {
    const root = repoDir();
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      omp?: { extensions?: unknown };
    };
    const exts = pkg.omp?.extensions;
    expect(Array.isArray(exts) && exts.length > 0).toBe(true);
    for (const rel of exts as string[]) {
      expect(existsSync(join(root, rel)), rel).toBe(true);
    }
    const skillMd = readdirSync(join(root, "skills")).filter(
      (name) => name.startsWith("ps-") && existsSync(join(root, "skills", name, "SKILL.md")),
    );
    expect(skillMd.length).toBeGreaterThan(0);
  });

  it("passes quality on this repo via ci_static.py", () => {
    const { status, summary } = runCiStatic(["--quality"], repoDir());
    expect(status).toBe(0);
    expect(summary.ok).toBe(true);
    expect(summary.failed).toEqual([]);
  });
});
