import { describe, expect, it } from "vitest";
import { qualityFromPackage, type TreeStat } from "./static-checks.ts";
import { repoDir, runCiStatic } from "./py-ci.ts";

const present: TreeStat = {
  exists: () => true,
  isFile: (rel) => rel.endsWith(".ts"),
  isDir: (rel) => !rel.endsWith(".ts"),
};

const validPkg = JSON.stringify({
  omp: {
    extensions: ["./extensions/pstack.ts"],
    skills: ["./skills"],
  },
});

describe("package.json doctor", () => {
  it("passes a complete plugin manifest", () => {
    const results = qualityFromPackage({ packageJsonText: validPkg, tree: present });
    expect(results.every((r) => r.ok)).toBe(true);
    expect(results.map((r) => r.name)).toEqual([
      "package_json",
      "omp_extensions",
      "omp_skills",
      "omp_path:./extensions/pstack.ts",
      "omp_path:./skills",
      "extensions/pstack.ts",
      "skills",
      "agents",
      "commands",
    ]);
  });

  it("fails when package.json is missing", () => {
    const results = qualityFromPackage({ packageJsonText: undefined, tree: present });
    expect(results).toEqual([{ name: "package_json", ok: false, detail: "package.json missing" }]);
  });

  it("fails when omp.extensions or omp.skills are missing", () => {
    const results = qualityFromPackage({
      packageJsonText: JSON.stringify({ name: "pstack" }),
      tree: present,
    });
    expect(results.find((r) => r.name === "omp_extensions")?.ok).toBe(false);
    expect(results.find((r) => r.name === "omp_skills")?.ok).toBe(false);
  });

  it("fails when declared omp paths or required dirs are gone", () => {
    const missing: TreeStat = {
      exists: () => false,
      isFile: () => false,
      isDir: () => false,
    };
    const results = qualityFromPackage({ packageJsonText: validPkg, tree: missing });
    expect(results.find((r) => r.name === "omp_path:./extensions/pstack.ts")?.ok).toBe(false);
    expect(results.find((r) => r.name === "extensions/pstack.ts")?.ok).toBe(false);
    expect(results.find((r) => r.name === "skills")?.ok).toBe(false);
    expect(results.find((r) => r.name === "agents")?.ok).toBe(false);
    expect(results.find((r) => r.name === "commands")?.ok).toBe(false);
  });

  it("passes quality on this repo via ci_static.py", () => {
    const { status, summary } = runCiStatic(["--quality"], repoDir());
    expect(status).toBe(0);
    expect(summary.ok).toBe(true);
    expect(summary.failed).toEqual([]);
  });
});
