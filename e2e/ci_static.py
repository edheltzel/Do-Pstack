#!/usr/bin/env python3
"""Doctor, frontmatter, and cheap perf checks for CI. No omp required."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PSTACK_MAX_BYTES = 32 * 1024
E2E_BUDGET_S = 8.0


def pstack_ts(root: Path) -> Path:
    return root / "extensions/pstack.ts"


def check(name: str, ok: bool, detail: str) -> dict:
    status = "PASS" if ok else "FAIL"
    print(f"{status}  {name}: {detail}", flush=True)
    return {"name": name, "ok": bool(ok), "detail": detail}


def frontmatter_fields(text: str) -> dict[str, str] | None:
    if not text.startswith("---"):
        return None
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return None
    end = next((i for i, line in enumerate(lines[1:], 1) if line.strip() == "---"), None)
    if end is None:
        return None
    fields: dict[str, str] = {}
    current: str | None = None
    for line in lines[1:end]:
        if line and not line[0].isspace() and ":" in line:
            key, _, raw = line.partition(":")
            current = key.strip()
            val = raw.strip().strip("'\"")
            if val in {">", "|", ">-", "|-", ">+", "|+"}:
                val = ""
            fields[current] = val
        elif current and line[:1] in {" ", "\t"}:
            extra = line.strip()
            if extra:
                fields[current] = f"{fields[current]} {extra}".strip() if fields[current] else extra
    return fields


def quality(root: Path | None = None) -> list[dict]:
    root = ROOT if root is None else Path(root)
    results = []
    pkg_path = root / "package.json"
    if not pkg_path.is_file():
        return [check("package_json", False, "package.json missing")]
    try:
        pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        return [check("package_json", False, f"invalid JSON: {exc}")]
    omp = pkg.get("omp")
    results.append(check("package_json", True, "present"))
    if not isinstance(omp, dict):
        results.append(check("omp_extensions", False, "package.json has no omp object"))
        results.append(check("omp_skills", False, "package.json has no omp object"))
        declared: list[str] = []
    else:
        exts = omp.get("extensions")
        skills = omp.get("skills")
        ext_ok = isinstance(exts, list) and bool(exts)
        skill_ok = isinstance(skills, list) and bool(skills)
        results.append(check("omp_extensions", ext_ok, "omp.extensions declared" if ext_ok else "missing or empty"))
        results.append(check("omp_skills", skill_ok, "omp.skills declared" if skill_ok else "missing or empty"))
        declared = [*(exts if isinstance(exts, list) else []), *(skills if isinstance(skills, list) else [])]
    for rel in declared:
        path = root / str(rel)
        results.append(check(f"omp_path:{rel}", path.exists(), "present" if path.exists() else "missing"))

    required = (
        ("extensions/pstack.ts", True),
        ("skills", False),
        ("agents", False),
        ("commands", False),
    )
    for rel, want_file in required:
        path = root / rel
        ok = path.is_file() if want_file else path.is_dir()
        kind = "file" if want_file else "directory"
        results.append(check(rel, ok, f"{kind} present" if ok else f"{kind} missing"))
    return results


def frontmatter(root: Path | None = None) -> list[dict]:
    root = ROOT if root is None else Path(root)
    results = []
    skills = sorted(root.glob("skills/**/SKILL.md"))
    results.append(check("skill_files", bool(skills), f"{len(skills)} SKILL.md"))
    for path in skills:
        rel = path.relative_to(root).as_posix()
        fields = frontmatter_fields(path.read_text(encoding="utf-8"))
        if fields is None:
            results.append(check(rel, False, "missing YAML frontmatter"))
            continue
        name = (fields.get("name") or "").strip()
        desc = (fields.get("description") or "").strip()
        ok = bool(name) and bool(desc)
        missing = [k for k, v in (("name", name), ("description", desc)) if not v]
        results.append(check(rel, ok, "name + description" if ok else f"missing {', '.join(missing)}"))

    commands = sorted((root / "commands").glob("*.md")) if (root / "commands").is_dir() else []
    results.append(check("command_files", bool(commands), f"{len(commands)} command md"))
    for path in commands:
        rel = path.relative_to(root).as_posix()
        fields = frontmatter_fields(path.read_text(encoding="utf-8"))
        if fields is None:
            results.append(check(rel, False, "missing YAML frontmatter"))
            continue
        desc = (fields.get("description") or "").strip()
        results.append(check(rel, bool(desc), "description" if desc else "missing description"))
    return results


def _brace_balance(text: str) -> bool:
    depth = 0
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if ch in {"'", '"'}:
            quote = ch
            i += 1
            while i < n:
                if text[i] == "\\":
                    i += 2
                    continue
                if text[i] == quote:
                    i += 1
                    break
                i += 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "/":
            i = text.find("\n", i)
            i = n if i < 0 else i + 1
            continue
        if ch == "/" and i + 1 < n and text[i + 1] == "*":
            end = text.find("*/", i + 2)
            i = n if end < 0 else end + 2
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth < 0:
                return False
        i += 1
    return depth == 0


def size_and_parse(root: Path | None = None) -> list[dict]:
    root = ROOT if root is None else Path(root)
    results = []
    target = pstack_ts(root)
    if not target.is_file():
        return [check("pstack_size", False, "extensions/pstack.ts missing")]
    raw = target.read_bytes()
    size_ok = len(raw) <= PSTACK_MAX_BYTES
    results.append(
        check(
            "pstack_size",
            size_ok,
            f"{len(raw)} bytes (budget {PSTACK_MAX_BYTES})",
        )
    )
    if b"\0" in raw:
        results.append(check("pstack_parse", False, "contains NUL"))
        return results
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError as exc:
        results.append(check("pstack_parse", False, f"not utf-8: {exc}"))
        return results
    parse_ok = "export default function" in text and _brace_balance(text)
    results.append(
        check(
            "pstack_parse",
            parse_ok,
            "utf-8 TS/JS with export default" if parse_ok else "does not parse as TS/JS",
        )
    )
    return results


def timed_e2e() -> list[dict]:
    start = time.perf_counter()
    proc = subprocess.run(
        [sys.executable, str(ROOT / "e2e/run.py"), "--skip-rpc"],
        cwd=str(ROOT),
    )
    elapsed = time.perf_counter() - start
    results = [
        check("e2e_skip_rpc", proc.returncode == 0, f"exit {proc.returncode} in {elapsed:.3f}s"),
    ]
    if proc.returncode == 0:
        budget_ok = elapsed <= E2E_BUDGET_S
        results.append(
            check(
                "e2e_budget",
                budget_ok,
                f"{elapsed:.3f}s (budget {E2E_BUDGET_S:.1f}s)",
            )
        )
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="pstack CI static checks (no omp)")
    parser.add_argument("--quality", action="store_true")
    parser.add_argument("--frontmatter", action="store_true")
    parser.add_argument("--perf", action="store_true")
    parser.add_argument("--root", type=Path, default=None, help="plugin root (tests)")
    args = parser.parse_args()
    root = args.root.resolve() if args.root is not None else ROOT
    selected = [args.quality, args.frontmatter, args.perf]
    run_all = not any(selected)
    results: list[dict] = []
    if run_all or args.quality:
        results.extend(quality(root))
    if run_all or args.frontmatter:
        results.extend(frontmatter(root))
    if run_all or args.perf:
        results.extend(size_and_parse(root))
        if root == ROOT:
            results.extend(timed_e2e())
    failed = [r for r in results if not r["ok"]]
    print(json.dumps({"ok": not failed, "failed": [r["name"] for r in failed], "n": len(results)}), flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
