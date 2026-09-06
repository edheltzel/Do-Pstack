#!/usr/bin/env python3
"""Doctor, frontmatter, and size checks for CI. No omp required."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PSTACK_MAX_BYTES = 32 * 1024
KEBAB = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
CLAUDE_FORBIDDEN = ("skills", "agents", "commands", "hooks")


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
        declared: list[str] = []
    else:
        exts = omp.get("extensions")
        ext_ok = isinstance(exts, list) and bool(exts)
        results.append(check("omp_extensions", ext_ok, "omp.extensions declared" if ext_ok else "missing or empty"))
        declared = [*(exts if isinstance(exts, list) else [])]
    for rel in declared:
        path = root / str(rel)
        results.append(check(f"omp_path:{rel}", path.exists(), "present" if path.exists() else "missing"))

    required = (
        ("extensions/pstack.ts", True),
        ("skills", False),
        ("agents", False),
    )
    for rel, want_file in required:
        path = root / rel
        ok = path.is_file() if want_file else path.is_dir()
        kind = "file" if want_file else "directory"
        results.append(check(rel, ok, f"{kind} present" if ok else f"{kind} missing"))

    target = pstack_ts(root)
    if not target.is_file():
        results.append(check("pstack_size", False, "extensions/pstack.ts missing"))
    else:
        raw = target.read_bytes()
        factory_text = ""
        try:
            factory_text = raw.decode("utf-8")
        except UnicodeDecodeError:
            pass
        size_ok = len(raw) <= PSTACK_MAX_BYTES and b"\0" not in raw and factory_text != ""
        results.append(
            check(
                "pstack_size",
                size_ok,
                f"{len(raw)} bytes (budget {PSTACK_MAX_BYTES})",
            )
        )
        if factory_text:
            results.append(
                check(
                    "factory_default_export",
                    "export default function" in factory_text,
                    "default factory function",
                )
            )
            results.append(
                check(
                    "independent_of_zenspc",
                    "@zenspc/pi-pstack" not in factory_text,
                    "no @zenspc/pi-pstack import",
                )
            )
    pi = pkg.get("pi")
    if isinstance(pi, dict) and isinstance(pi.get("extensions"), list):
        results.append(
            check(
                "pi_extensions",
                pi.get("extensions") == declared,
                "pi.extensions matches omp.extensions",
            )
        )
    results.extend(claude_plugin(root))
    return results


def claude_plugin(root: Path) -> list[dict]:
    """Official Claude Code plugin layout: manifest in .claude-plugin/, skills at plugin root."""
    results = []
    hidden = root / ".claude-plugin"
    plugin_path = hidden / "plugin.json"
    market_path = hidden / "marketplace.json"
    if not hidden.is_dir():
        return [
            check("claude_plugin_dir", False, ".claude-plugin missing"),
            check("claude_plugin_json", False, "plugin.json missing"),
            check("claude_marketplace_json", False, "marketplace.json missing"),
            check("claude_skills_at_root", False, "skills/ at plugin root"),
        ]
    nested = [name for name in CLAUDE_FORBIDDEN if (hidden / name).exists()]
    results.append(
        check(
            "claude_plugin_dir",
            not nested,
            "no component dirs inside .claude-plugin" if not nested else f"nested {nested}",
        )
    )
    if not plugin_path.is_file():
        results.append(check("claude_plugin_json", False, "plugin.json missing"))
    else:
        try:
            manifest = json.loads(plugin_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            results.append(check("claude_plugin_json", False, f"invalid JSON: {exc}"))
            manifest = None
        if isinstance(manifest, dict):
            name = manifest.get("name")
            name_ok = isinstance(name, str) and bool(KEBAB.fullmatch(name)) and name == "pstack"
            results.append(
                check(
                    "claude_plugin_json",
                    name_ok,
                    f"name={name!r}" if name_ok else "name must be kebab-case pstack",
                )
            )
            pkg_path = root / "package.json"
            pkg_ver = None
            try:
                pkg_ver = json.loads(pkg_path.read_text(encoding="utf-8")).get("version")
            except (OSError, json.JSONDecodeError):
                pkg_ver = None
            plugin_ver = manifest.get("version")
            if isinstance(pkg_ver, str) and isinstance(plugin_ver, str):
                results.append(
                    check(
                        "claude_plugin_version",
                        plugin_ver == pkg_ver,
                        f"{plugin_ver} == package.json {pkg_ver}",
                    )
                )
        elif manifest is not None:
            results.append(check("claude_plugin_json", False, "plugin.json must be an object"))
    if not market_path.is_file():
        results.append(check("claude_marketplace_json", False, "marketplace.json missing"))
    else:
        try:
            market = json.loads(market_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            results.append(check("claude_marketplace_json", False, f"invalid JSON: {exc}"))
            market = None
        if isinstance(market, dict):
            plugins = market.get("plugins")
            sources = [entry.get("source") for entry in plugins if isinstance(entry, dict)] if isinstance(plugins, list) else []
            ok = (
                isinstance(market.get("name"), str)
                and bool(KEBAB.fullmatch(str(market.get("name") or "")))
                and isinstance(market.get("description"), str)
                and bool(str(market.get("description") or "").strip())
                and isinstance(market.get("owner"), dict)
                and isinstance((market.get("owner") or {}).get("name"), str)
                and isinstance(plugins, list)
                and "./" in sources
            )
            results.append(
                check(
                    "claude_marketplace_json",
                    ok,
                    "name + description + owner + plugins source ./" if ok else "marketplace catalog incomplete",
                )
            )
        elif market is not None:
            results.append(check("claude_marketplace_json", False, "marketplace.json must be an object"))
    results.append(
        check(
            "claude_skills_at_root",
            (root / "skills").is_dir() and not (hidden / "skills").exists(),
            "skills/ at plugin root",
        )
    )
    return results


PRODUCT_PACK_FILES = (
    "docs/guide/README.md",
    "docs/guide/01-setup.md",
    "docs/guide/02-poteto-mode.md",
    "docs/guide/03-understand.md",
    "docs/guide/04-design.md",
    "docs/guide/05-build-and-clean.md",
    "docs/guide/06-verify-and-ship.md",
    "docs/guide/07-overnight.md",
    "docs/guide/08-principles.md",
    "docs/guide/09-make-it-yours.md",
    "docs/guide/10-recipes-and-pitfalls.md",
    "docs/guide/images/design.jpg",
    "docs/guide/images/overnight.jpg",
    "docs/guide/images/recipes.jpg",
    "docs/guide/images/router.jpg",
    "docs/guide/images/understanding.jpg",
    "docs/guide/images/verification.jpg",
    "automations/benny/FOR_AGENTS.md",
    "automations/benny/README.md",
    "automations/benny/skills/reproduce-and-fix-issues/SKILL.md",
    "automations/benny/skills/reproduce-and-fix-issues/references/control-adapter.md",
    "automations/benny/skills/reproduce-and-fix-issues/references/feature-map.example.md",
    "automations/benny/skills/reproduce-and-fix-issues/references/verify-existing-fix.md",
    "automations/benny/skills/setup-benny/SKILL.md",
    "automations/benny/skills/triage-issue-reports/SKILL.md",
    "automations/benny/skills/triage-issue-reports/references/routing.example.md",
    "automations/benny/templates/configuration.example.yaml",
    "automations/benny/templates/reproduce-automation-prompt.md",
    "automations/benny/templates/triage-automation-prompt.md",
    "skills/do-swarm/SKILL.md",
    "agents/comment-sicko.md",
    "agents/poteto-agent.md",
)


def product(root: Path | None = None) -> list[dict]:
    root = ROOT if root is None else Path(root)
    results = []
    for rel in PRODUCT_PACK_FILES:
        path = root / rel
        ok = path.is_file()
        results.append(check(rel, ok, "present" if ok else "missing"))
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

    commands_dir = root / "commands"
    commands = sorted(commands_dir.glob("*.md")) if commands_dir.is_dir() else []
    results.append(check("command_files", True, f"{len(commands)} command md"))
    for path in commands:
        rel = path.relative_to(root).as_posix()
        fields = frontmatter_fields(path.read_text(encoding="utf-8"))
        if fields is None:
            results.append(check(rel, False, "missing YAML frontmatter"))
            continue
        desc = (fields.get("description") or "").strip()
        results.append(check(rel, bool(desc), "description" if desc else "missing description"))
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="pstack CI static checks (no omp)")
    parser.add_argument("--quality", action="store_true")
    parser.add_argument("--frontmatter", action="store_true")
    parser.add_argument("--product", action="store_true")
    parser.add_argument("--root", type=Path, default=None, help="plugin root (tests)")
    args = parser.parse_args()
    root = args.root.resolve() if args.root is not None else ROOT
    selected = [args.quality, args.frontmatter, args.product]
    run_all = not any(selected)
    results: list[dict] = []
    if run_all or args.quality:
        results.extend(quality(root))
    if run_all or args.product:
        results.extend(product(root))
    if run_all or args.frontmatter:
        results.extend(frontmatter(root))
    failed = [r for r in results if not r["ok"]]
    print(json.dumps({"ok": not failed, "failed": [r["name"] for r in failed], "n": len(results)}), flush=True)
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
