import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { repoDir } from "./py-ci.ts";
import {
  LOCAL_SUBTRACTIONS,
  UPSTREAM_REPO,
  UPSTREAM_SKILLS,
  bumpSemver,
  formatReport,
  parseArgs,
  planSync,
  rewriteLayout,
  runBump,
  runSync,
} from "../../scripts/pstack.mjs";

const cli = fileURLToPath(new URL("../../scripts/pstack.mjs", import.meta.url));

function write(root: string, rel: string, body: string): void {
  const path = join(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
}

function git(cwd: string, ...args: string[]) {
  return spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8" });
}

function gitVersionRepo(version: string): string {
  const root = mkdtempSync(join(tmpdir(), "pstack-bump-git-"));
  write(root, "package.json", JSON.stringify({ name: "pstack", version }, null, 2) + "\n");
  write(root, ".claude-plugin/plugin.json", JSON.stringify({ name: "pstack", version }, null, 2) + "\n");
  git(root, "init");
  git(root, "config", "user.email", "dev@example.com");
  git(root, "config", "user.name", "dev");
  git(root, "add", "package.json", ".claude-plugin/plugin.json");
  git(root, "commit", "-m", `v${version}`);
  return root;
}

function fixture(): { root: string; from: string } {
  const root = mkdtempSync(join(tmpdir(), "pstack-sync-pkg-"));
  const from = mkdtempSync(join(tmpdir(), "pstack-sync-up-"));
  write(
    from,
    "how/SKILL.md",
    "---\nname: how\ndescription: Explain code.\n---\n\nSee [Why](../why/SKILL.md).\n",
  );
  write(
    from,
    "why/SKILL.md",
    "---\nname: why\ndescription: Motivation.\n---\n\n# Why\n",
  );
  write(
    from,
    "setup-pstack/SKILL.md",
    "---\nname: setup-pstack\ndescription: Cursor setup.\n---\n\nWrite pstack-models.mdc.\n",
  );
  write(from, "poteto-mode/SKILL.md", "---\nname: poteto-mode\ndescription: Router.\n---\n\n# Poteto\n");
  write(from, "poteto-mode/playbooks/shipping.md", "### Shipping\n");
  write(
    from,
    "principle-attack-the-premise/SKILL.md",
    "---\nname: principle-attack-the-premise\ndescription: Question the premise.\n---\n\nSee [Build the Lever](../principle-build-the-lever/SKILL.md).\n",
  );
  write(
    from,
    "principle-build-the-lever/SKILL.md",
    "---\nname: principle-build-the-lever\ndescription: Build the script.\n---\n\n# Lever\n",
  );

  write(
    root,
    "skills/do-how/SKILL.md",
    "---\nname: do-how\ndescription: Explain code (omp).\n---\n\nLocal omp fork.\n",
  );
  write(
    root,
    "skills/do-setup-pstack/SKILL.md",
    "---\nname: do-setup-pstack\ndescription: omp setup.\n---\n\nDo not write models.json.\n",
  );
  write(root, "skills/do-poteto-mode/SKILL.md", "---\nname: do-poteto-mode\ndescription: Router.\n---\n\n# Poteto\n");
  write(
    root,
    "skills/do-principle-build-the-lever/SKILL.md",
    "---\nname: do-principle-build-the-lever\ndescription: Build the script.\n---\n\n# Lever\n",
  );
  return { root, from };
}

describe("pstack sync", () => {
  it("defaults SoT to cursor/plugins, not backnotprop or skills.sh", () => {
    expect(UPSTREAM_REPO).toBe("https://github.com/cursor/plugins.git");
    expect(UPSTREAM_SKILLS).toBe("pstack/skills");
    expect(UPSTREAM_REPO).not.toContain("backnotprop");
    expect(LOCAL_SUBTRACTIONS).toContain("poteto-mode/playbooks/shipping.md");
    const opts = parseArgs(["sync"]);
    expect(opts.repo).toBe(UPSTREAM_REPO);
    expect(opts.command).toBe("sync");
  });

  it("rewrites official layout onto skills/do-* without a second tree", () => {
    const slugs = ["how", "why", "principle-build-the-lever"];
    const text = rewriteLayout(
      "---\nname: how\ndescription: x\n---\n\n[Why](../why/SKILL.md) and skills/how/SKILL.md\n",
      slugs,
      "how",
    );
    expect(text).toContain("name: do-how");
    expect(text).toContain("../do-why/SKILL.md");
    expect(text).toContain("skills/do-how/SKILL.md");
    expect(text).not.toContain("name: how\n");
    expect(text).not.toContain("../why/");
    expect(text).not.toContain("do-do-");
  });

  it("adds missing official skills, skips shipping.md, keeps diverged local forks", () => {
    const { root, from } = fixture();
    const plan = planSync({
      upstreamSkills: from,
      destSkills: join(root, "skills"),
      force: false,
    });
    const kinds = Object.fromEntries(plan.actions.map((a) => [a.destRel, a.kind]));
    expect(kinds["skills/do-why/SKILL.md"]).toBe("add");
    expect(kinds["skills/do-principle-attack-the-premise/SKILL.md"]).toBe("add");
    expect(kinds["skills/do-poteto-mode/playbooks/shipping.md"]).toBe("skip");
    expect(kinds["skills/do-how/SKILL.md"]).toBe("diverged");
    expect(kinds["skills/do-setup-pstack/SKILL.md"]).toBe("diverged");
    expect(kinds["skills/do-poteto-mode/SKILL.md"]).toBeUndefined();

    const report = runSync({
      command: "sync",
      dryRun: false,
      force: false,
      from,
      repo: UPSTREAM_REPO,
      ref: null,
      root,
      help: false,
    });
    const added = readFileSync(join(root, "skills/do-principle-attack-the-premise/SKILL.md"), "utf8");
    expect(added.startsWith("---\nname: do-principle-attack-the-premise\n")).toBe(true);
    expect(added).toContain("../do-principle-build-the-lever/SKILL.md");
    expect(readFileSync(join(root, "skills/do-how/SKILL.md"), "utf8")).toContain("Local omp fork");
    expect(readFileSync(join(root, "skills/do-setup-pstack/SKILL.md"), "utf8")).toContain("Do not write models.json");
    expect(() => readFileSync(join(root, "skills/do-poteto-mode/playbooks/shipping.md"))).toThrow();
    expect(existsSync(join(root, "skills/why"))).toBe(false);
    expect(existsSync(join(root, "skills/how"))).toBe(false);
    expect(existsSync(join(root, "skills/do-why/SKILL.md"))).toBe(true);
    const text = formatReport(report);
    expect(text).toContain("sot: cursor/plugins pstack/skills → skills/do-*");
    expect(text).toContain("added: skills/do-why/SKILL.md");
    expect(text).toContain("skipped: skills/do-poteto-mode/playbooks/shipping.md");
    expect(text).toMatch(/summary: added=\d+ updated=0 skipped=1 diverged=\d+/);
  });

  it("dry-run writes nothing", () => {
    const { root, from } = fixture();
    runSync({
      command: "sync",
      dryRun: true,
      force: false,
      from,
      repo: UPSTREAM_REPO,
      ref: null,
      root,
      help: false,
    });
    expect(() => readFileSync(join(root, "skills/do-why/SKILL.md"))).toThrow();
  });

  it("package docs name npm run sync and cursor/plugins as SoT", () => {
    const readme = readFileSync(join(repoDir(), "README.md"), "utf8");
    const agents = readFileSync(join(repoDir(), "AGENTS.md"), "utf8");
    expect(readme).toContain("npm run sync");
    expect(readme).toContain("node scripts/pstack.mjs sync");
    expect(readme).toContain("cursor/plugins");
    expect(readme).not.toMatch(/npx skills add/);
    expect(agents).toContain("npm run sync");
    expect(agents).toContain("cursor/plugins");
  });

  it("CLI sync --dry-run --from prints a plan and exits 0", () => {
    const { root, from } = fixture();
    const result = spawnSync(process.execPath, [cli, "sync", "--dry-run", "--from", from, "--root", root], {
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("mode: dry-run");
    expect(result.stdout).toContain("added: skills/do-why/SKILL.md");
    expect(result.stdout).toContain("cursor/plugins");
    expect(() => readFileSync(join(root, "skills/do-why/SKILL.md"))).toThrow();
  });
});

describe("pstack bump", () => {
  it("bumps patch minor major", () => {
    expect(bumpSemver("0.15.0", "patch")).toBe("0.15.1");
    expect(bumpSemver("0.15.0", "minor")).toBe("0.16.0");
    expect(bumpSemver("0.15.0", "major")).toBe("1.0.0");
  });

  it("writes package.json and plugin.json together", () => {
    const root = mkdtempSync(join(tmpdir(), "pstack-bump-"));
    write(root, "package.json", JSON.stringify({ name: "pstack", version: "0.15.0" }, null, 2) + "\n");
    write(
      root,
      ".claude-plugin/plugin.json",
      JSON.stringify({ name: "pstack", version: "0.15.0" }, null, 2) + "\n",
    );
    const report = runBump({
      command: "bump",
      kind: "patch",
      dryRun: false,
      tag: false,
      release: false,
      root,
    });
    expect(report.to).toBe("0.15.1");
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version).toBe("0.15.1");
    expect(JSON.parse(readFileSync(join(root, ".claude-plugin/plugin.json"), "utf8")).version).toBe("0.15.1");
  });

  it("does not write package.json when plugin.json is invalid", () => {
    const root = mkdtempSync(join(tmpdir(), "pstack-bump-bad-plugin-"));
    write(root, "package.json", JSON.stringify({ version: "0.15.0" }, null, 2) + "\n");
    write(root, ".claude-plugin/plugin.json", "{not json");
    expect(() =>
      runBump({ command: "bump", kind: "patch", dryRun: false, tag: false, release: false, root }),
    ).toThrow(/invalid JSON/);
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version).toBe("0.15.0");
  });

  it("dry-run writes nothing", () => {
    const root = mkdtempSync(join(tmpdir(), "pstack-bump-dry-"));
    write(root, "package.json", JSON.stringify({ version: "1.2.3" }, null, 2) + "\n");
    write(root, ".claude-plugin/plugin.json", JSON.stringify({ version: "1.2.3" }, null, 2) + "\n");
    runBump({ command: "bump", kind: "minor", dryRun: true, tag: false, release: false, root });
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version).toBe("1.2.3");
  });

  it("docs name npm run bump", () => {
    const readme = readFileSync(join(repoDir(), "README.md"), "utf8");
    const agents = readFileSync(join(repoDir(), "AGENTS.md"), "utf8");
    expect(readme).toContain("npm run bump -- patch");
    expect(agents).toContain("npm run bump -- patch");
    expect(agents).toContain("npm run bump -- --tag");
    expect(readme).toContain("npm run bump -- --tag");
  });

  it("CLI bump patch --dry-run exits 0", () => {
    const root = mkdtempSync(join(tmpdir(), "pstack-bump-cli-"));
    write(root, "package.json", JSON.stringify({ version: "0.1.0" }, null, 2) + "\n");
    write(root, ".claude-plugin/plugin.json", JSON.stringify({ version: "0.1.0" }, null, 2) + "\n");
    const result = spawnSync(process.execPath, [cli, "bump", "patch", "--dry-run", "--root", root], {
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("0.1.0 -> 0.1.1");
    expect(JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version).toBe("0.1.0");
  });

  it("refuses kind with --tag so it cannot tag old HEAD", () => {
    const root = mkdtempSync(join(tmpdir(), "pstack-bump-refuse-"));
    write(root, "package.json", JSON.stringify({ version: "0.15.0" }, null, 2) + "\n");
    write(root, ".claude-plugin/plugin.json", JSON.stringify({ version: "0.15.0" }, null, 2) + "\n");
    expect(() =>
      runBump({ command: "bump", kind: "patch", dryRun: false, tag: true, release: false, root }),
    ).toThrow(/commit, then pstack bump --tag/);
  });

  it("tags the committed HEAD sha, not a dirty tree", () => {
    const root = gitVersionRepo("0.15.1");
    const sha = git(root, "rev-parse", "HEAD").stdout.trim();
    const report = runBump({ command: "bump", kind: null, dryRun: false, tag: true, release: false, root });
    expect(report.sha).toBe(sha);
    expect(report.tag).toBe("v0.15.1");
    const tagged = git(root, "rev-parse", "v0.15.1^{commit}").stdout.trim();
    expect(tagged).toBe(sha);
    write(root, "package.json", JSON.stringify({ version: "0.15.2" }, null, 2) + "\n");
    expect(() =>
      runBump({ command: "bump", kind: null, dryRun: false, tag: true, release: false, root }),
    ).toThrow(/not committed/);
  });

  it("release pushes the tag and gh --target HEAD sha", () => {
    const root = gitVersionRepo("0.16.0");
    const bare = mkdtempSync(join(tmpdir(), "pstack-bump-bare-"));
    git(bare, "init", "--bare");
    git(root, "remote", "add", "origin", bare);
    const sha = git(root, "rev-parse", "HEAD").stdout.trim();
    const gh: string[][] = [];
    const spawn = (cmd: string, args: string[], opts?: object) => {
      if (cmd === "gh") {
        gh.push(args);
        return { status: 0, stdout: "", stderr: "" };
      }
      return spawnSync(cmd, args, opts);
    };
    runBump({ command: "bump", kind: null, dryRun: false, tag: true, release: true, root }, spawn);
    expect(git(root, "rev-parse", "v0.16.0^{commit}").stdout.trim()).toBe(sha);
    expect(git(bare, "rev-parse", "v0.16.0^{commit}").stdout.trim()).toBe(sha);
    expect(gh[0]).toEqual([
      "release",
      "create",
      "v0.16.0",
      "--title",
      "v0.16.0",
      "--notes",
      "pstack 0.16.0",
      "--target",
      sha,
    ]);
  });

  it("tag then release reuses the existing matching tag", () => {
    const root = gitVersionRepo("0.17.0");
    const bare = mkdtempSync(join(tmpdir(), "pstack-bump-seq-"));
    git(bare, "init", "--bare");
    git(root, "remote", "add", "origin", bare);
    const sha = git(root, "rev-parse", "HEAD").stdout.trim();
    runBump({ command: "bump", kind: null, dryRun: false, tag: true, release: false, root });
    expect(git(root, "rev-parse", "v0.17.0^{commit}").stdout.trim()).toBe(sha);
    const gh: string[][] = [];
    const spawn = (cmd: string, args: string[], opts?: object) => {
      if (cmd === "gh") {
        gh.push(args);
        return { status: 0, stdout: "", stderr: "" };
      }
      return spawnSync(cmd, args, opts);
    };
    runBump({ command: "bump", kind: null, dryRun: false, tag: false, release: true, root }, spawn);
    expect(git(root, "rev-parse", "v0.17.0^{commit}").stdout.trim()).toBe(sha);
    expect(git(bare, "rev-parse", "v0.17.0^{commit}").stdout.trim()).toBe(sha);
    expect(gh[0]?.includes("--target")).toBe(true);
    expect(gh[0]?.at(-1)).toBe(sha);
  });
});
