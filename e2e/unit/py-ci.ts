import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ciStaticPath = fileURLToPath(new URL("../ci_static.py", import.meta.url));
const repoRoot = fileURLToPath(new URL("../..", import.meta.url));

export type PyCheck = { name: string; ok: boolean; detail: string };

function lastJsonValue(stdout: string): unknown {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    try {
      return JSON.parse(lines[i]);
    } catch {
      continue;
    }
  }
  throw new Error(`no JSON in python output:\n${stdout}`);
}

export function pyEval(source: string, stdin = ""): unknown {
  const result = spawnSync("python3", ["-c", source, ciStaticPath], {
    cwd: repoRoot,
    encoding: "utf8",
    input: stdin,
  });
  if (result.status !== 0) {
    throw new Error(`python3 failed (${result.status}): ${result.stderr || result.stdout}`);
  }
  return lastJsonValue(result.stdout);
}

const LOAD = `
import json, sys
from importlib.util import module_from_spec, spec_from_file_location
spec = spec_from_file_location("ci_static", sys.argv[1])
mod = module_from_spec(spec)
if spec.loader is None:
    raise SystemExit("no loader")
spec.loader.exec_module(mod)
`;

export function pyFrontmatter(text: string): Record<string, string> | null {
  return pyEval(
    `${LOAD}
print(json.dumps(mod.frontmatter_fields(sys.stdin.read())))
`,
    text,
  ) as Record<string, string> | null;
}

export function pyBraceBalance(text: string): boolean {
  return pyEval(
    `${LOAD}
print(json.dumps(mod._brace_balance(sys.stdin.read())))
`,
    text,
  ) as boolean;
}

export function runCiStatic(
  args: string[],
  root?: string,
): { status: number; summary: { ok: boolean; failed: string[]; n: number } } {
  const argv = [...args];
  if (root) argv.push("--root", root);
  const result = spawnSync("python3", [ciStaticPath, ...argv], {
    cwd: repoRoot,
    encoding: "utf8",
  });
  const summary = lastJsonValue(result.stdout) as { ok: boolean; failed: string[]; n: number };
  return { status: result.status ?? 1, summary };
}

export function repoDir(): string {
  return repoRoot;
}
