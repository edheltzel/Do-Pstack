import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { repoDir, runCiStatic } from "./py-ci.ts";

const TEXT = /\.(md|ts|py|json|yml|yaml|txt)$/;

function walkText(root: string, rel = ""): string[] {
  const dir = rel ? join(root, rel) : root;
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === "node_modules" || name === ".delta" || name === ".codegraph") continue;

    const child = rel ? `${rel}/${name}` : name;
    const st = statSync(join(root, child));
    if (st.isDirectory()) out.push(...walkText(root, child));
    else if (TEXT.test(name)) out.push(child);
  }
  return out;
}

describe("package.json doctor", () => {
  it("plugin layout is real: omp.extensions path, Claude plugin.json, and skills/do-*/SKILL.md", () => {
    const root = repoDir();
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as {
      omp?: { extensions?: unknown };
      pi?: { extensions?: unknown };
    };
    const exts = pkg.omp?.extensions;
    expect(Array.isArray(exts) && exts.length > 0).toBe(true);
    for (const rel of exts as string[]) {
      expect(existsSync(join(root, rel)), rel).toBe(true);
    }
    expect(pkg.pi?.extensions).toEqual(exts);
    const skillMd = readdirSync(join(root, "skills")).filter(
      (name) => name.startsWith("do-") && existsSync(join(root, "skills", name, "SKILL.md")),
    );
    expect(skillMd.length).toBeGreaterThan(0);

    const plugin = JSON.parse(readFileSync(join(root, ".claude-plugin/plugin.json"), "utf8")) as {
      name?: unknown;
    };
    const market = JSON.parse(readFileSync(join(root, ".claude-plugin/marketplace.json"), "utf8")) as {
      name?: unknown;
      owner?: { name?: unknown };
      plugins?: { name?: unknown; source?: unknown }[];
    };
    expect(plugin.name).toBe("pstack");
    expect(market.name).toBe("pstack");
    expect(market.owner?.name).toBeTruthy();
    expect(market.plugins?.some((entry) => entry.source === "./" && entry.name === "pstack")).toBe(true);
    expect(existsSync(join(root, ".claude-plugin/skills"))).toBe(false);
    expect(existsSync(join(root, "skills"))).toBe(true);

    const factory = readFileSync(join(root, "extensions/pstack.ts"), "utf8");
    expect(factory).toContain("export default function pstackExtension");
    expect(factory).not.toContain("@zenspc/pi-pstack");
  });

  it("live slash is /skill:do-* and leftover ps- skill folders/slashes are gone", () => {
    const root = repoDir();
    const skillDirs = readdirSync(join(root, "skills")).filter((name) =>
      existsSync(join(root, "skills", name, "SKILL.md")),
    );
    expect(skillDirs.filter((name) => name.startsWith("ps-"))).toEqual([]);
    expect(skillDirs.length).toBeGreaterThan(0);
    expect(skillDirs.every((name) => name.startsWith("do-"))).toBe(true);
    for (const name of skillDirs) {
      const text = readFileSync(join(root, "skills", name, "SKILL.md"), "utf8");
      expect(text.startsWith(`---\nname: ${name}\n`), name).toBe(true);
    }

    const factory = readFileSync(join(root, "extensions/pstack.ts"), "utf8");
    expect(factory).toContain('const POTETO_SKILL = "/skill:do-poteto-mode"');
    expect(factory).toContain('pi.registerCommand("poteto-mode"');
    const oldSlash = `/skill:${"ps-"}`;
    const oldPath = `skills/${"ps-"}`;
    expect(factory.includes(oldSlash)).toBe(false);

    const leftover = walkText(root).flatMap((rel) => {
      const text = readFileSync(join(root, rel), "utf8");
      const hits = [
        ...(text.includes(oldSlash) ? [oldSlash] : []),
        ...(text.includes(oldPath) ? [oldPath] : []),
      ];
      return hits.map((hit) => ({ file: rel, hit }));
    });
    expect(leftover, JSON.stringify(leftover)).toEqual([]);
  });

  it("passes quality on this repo via ci_static.py", () => {
    const { status, summary } = runCiStatic(["--quality"], repoDir());
    expect(status).toBe(0);
    expect(summary.ok).toBe(true);
    expect(summary.failed).toEqual([]);
  });
});
