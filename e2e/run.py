#!/usr/bin/env python3
"""Live omp RPC evals for the pstack plugin.

Cases:
  poteto_on              /poteto-mode injects the needle
  second_turn_sticky     next turn still has the needle
  poteto_off             /poteto-mode off removes the needle
  new_session_starts_off same-process new_session: new sid, no entry, next turn off
  resume_stays_on        switch_session back to the on-session: needle on
  setup_pstack_no_write  /setup-pstack does not write models.json or config.yml
  worktree_cleanup_omp   playbook uses ~/.omp/wt and worktree.base

Usage (from repo root):
  python3 e2e/run.py
  python3 e2e/run.py --skip-rpc          # static checks only
  python3 e2e/run.py --case poteto_on
"""
from __future__ import annotations

import argparse
import json
import os
import select
import shutil
import subprocess
import sys
import tempfile
import time
from pathlib import Path

NEEDLE = "Pstack Poteto Mode is on for this session"
ROOT = Path(__file__).resolve().parents[1]


def send(proc, obj):
    proc.stdin.write((json.dumps(obj) + "\n").encode("utf-8"))
    proc.stdin.flush()


def read_until(proc, pred, timeout=90):
    deadline = time.time() + timeout
    frames = []
    buf = b""
    while time.time() < deadline:
        if proc.poll() is not None:
            rest = proc.stdout.read() if proc.stdout else b""
            raise RuntimeError(
                f"omp exited {proc.returncode}: {(buf + rest).decode('utf-8', 'replace')[-2000:]}"
            )
        r, _, _ = select.select([proc.stdout], [], [], 0.2)
        if not r:
            continue
        chunk = os.read(proc.stdout.fileno(), 65536)
        if not chunk:
            continue
        buf += chunk
        while b"\n" in buf:
            raw, buf = buf.split(b"\n", 1)
            if not raw.strip():
                continue
            try:
                frame = json.loads(raw.decode("utf-8"))
            except json.JSONDecodeError:
                frames.append({"_unparsed": raw.decode("utf-8", "replace")[:500]})
                continue
            frames.append(frame)
            if frame.get("type") == "extension_ui_request":
                rid = frame.get("id")
                method = frame.get("method")
                if method == "confirm":
                    send(proc, {"type": "extension_ui_response", "id": rid, "confirmed": True})
                elif method in ("notify", "setStatus", "setWidget", "setTitle", "set_editor_text"):
                    send(proc, {"type": "extension_ui_response", "id": rid, "value": "ok"})
                else:
                    send(proc, {"type": "extension_ui_response", "id": rid, "cancelled": True})
            if pred(frame, frames):
                return frames
    raise TimeoutError(f"timeout; last frames: {json.dumps(frames[-8:], default=str)[:2000]}")


def wait_response(proc, req_id, timeout=90):
    frames = read_until(
        proc,
        lambda f, _fs: f.get("type") == "response" and f.get("id") == req_id,
        timeout=timeout,
    )
    return frames[-1], frames


def wait_prompt_done(proc, req_id, timeout=180):
    def pred(f, _fs):
        if f.get("type") == "response" and f.get("id") == req_id:
            data = f.get("data") or {}
            if f.get("success") and data.get("agentInvoked") is False:
                return True
        if f.get("type") == "prompt_result" and f.get("id") == req_id and f.get("agentInvoked") is False:
            return True
        if f.get("type") == "agent_end" and f.get("isTerminal") is not False:
            return True
        return False

    return read_until(proc, pred, timeout=timeout)


def get_state(proc, req_id):
    send(proc, {"id": req_id, "type": "get_state"})
    resp, frames = wait_response(proc, req_id)
    if not resp.get("success"):
        raise RuntimeError(f"get_state failed: {resp}")
    return resp.get("data") or {}, frames


def has_needle(system_prompt):
    if isinstance(system_prompt, list):
        blob = "\n".join(str(x) for x in system_prompt)
    else:
        blob = str(system_prompt or "")
    return NEEDLE in blob


def scan_pstack_mode(path):
    p = Path(path) if path else None
    if not p or not p.exists():
        return []
    hits = []
    for line in p.read_text(errors="replace").splitlines():
        if "pstack-mode" in line:
            hits.append(line[:400])
    return hits


def start_omp(session_dir: Path):
    omp = shutil.which("omp") or "/opt/homebrew/bin/omp"
    cmd = [
        omp,
        "--mode",
        "rpc",
        "--session-dir",
        str(session_dir),
        "--thinking",
        "off",
        "--no-title",
        "--auto-approve",
        "--no-tools",
        "--cwd",
        str(ROOT),
    ]
    proc = subprocess.Popen(
        cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(ROOT),
        bufsize=0,
    )
    read_until(proc, lambda f, _fs: f.get("type") == "ready", timeout=30)
    send(proc, {"id": "proto", "type": "negotiate_protocol", "protocolVersion": 2})
    try:
        wait_response(proc, "proto", timeout=10)
    except Exception:
        pass
    return proc


def stop_omp(proc):
    try:
        proc.stdin.close()
    except Exception:
        pass
    try:
        proc.wait(timeout=5)
    except Exception:
        proc.kill()


def check(name, ok, detail):
    status = "PASS" if ok else "FAIL"
    print(f"{status}  {name}: {detail}", flush=True)
    return {"name": name, "ok": bool(ok), "detail": detail}


def static_worktree():
    path = ROOT / "skills/poteto-mode/playbooks/worktree-cleanup.md"
    text = path.read_text()
    ok = (
        "~/.omp/wt" in text
        and "worktree.base" in text
        and "Treehouse" in text
        and "Git Butler" in text
        and "not omp's path" in text
        and ".cursor/worktrees" not in text
    )
    return check(
        "worktree_cleanup_omp",
        ok,
        "playbook uses ~/.omp/wt + worktree.base; Treehouse/Git Butler are not roots",
    )


def static_setup_docs():
    skill = (ROOT / "skills/setup-pstack/SKILL.md").read_text()
    cmd = (ROOT / "commands/setup-pstack.md").read_text()
    ok = (
        "Do not write" in skill
        and "models.json" in skill
        and "config.yml" in skill
        and "modelRoles" in skill
        and "/model" in skill
        and "/agents" in cmd
    )
    return check("setup_pstack_docs", ok, "setup-pstack lists roles; writes nothing")


def rpc_suite():
    results = []
    work = Path(tempfile.mkdtemp(prefix="pstack-e2e-"))
    session_dir = work / "sessions"
    session_dir.mkdir()
    home = Path.home()
    models_json = home / ".omp/agent/pstack/models.json"
    config_yml = home / ".omp/agent/config.yml"
    models_existed = models_json.exists()
    config_stat = config_yml.stat() if config_yml.exists() else None
    proc = start_omp(session_dir)
    try:
        send(proc, {"id": "cmds", "type": "get_available_commands"})
        resp, _ = wait_response(proc, "cmds", timeout=20)
        names = [c.get("name") for c in ((resp.get("data") or {}).get("commands") or [])]
        results.append(check("plugin_loaded", "poteto-mode" in names, f"commands={len(names)}"))

        st, _ = get_state(proc, "s0")
        results.append(check("fresh_off", not has_needle(st.get("systemPrompt")), f"sid={st.get('sessionId')}"))

        send(proc, {"id": "on", "type": "prompt", "message": "/poteto-mode"})
        wait_prompt_done(proc, "on")
        st_on, _ = get_state(proc, "s_on")
        on_file = st_on.get("sessionFile")
        on_sid = st_on.get("sessionId")
        on_ok = has_needle(st_on.get("systemPrompt")) and bool(scan_pstack_mode(on_file))
        results.append(check("poteto_on", on_ok, f"sid={on_sid} needle={has_needle(st_on.get('systemPrompt'))}"))

        send(proc, {"id": "sticky", "type": "prompt", "message": "Reply with only the word STICKY."})
        wait_prompt_done(proc, "sticky")
        st_st, _ = get_state(proc, "s_st")
        results.append(
            check(
                "second_turn_sticky",
                has_needle(st_st.get("systemPrompt")),
                f"sid={st_st.get('sessionId')}",
            )
        )

        send(proc, {"id": "off", "type": "prompt", "message": "/poteto-mode off"})
        wait_prompt_done(proc, "off")
        send(proc, {"id": "off2", "type": "prompt", "message": "Reply with only the word OFFCHECK."})
        wait_prompt_done(proc, "off2")
        st_off, _ = get_state(proc, "s_off")
        results.append(
            check(
                "poteto_off",
                not has_needle(st_off.get("systemPrompt")),
                f"sid={st_off.get('sessionId')}",
            )
        )

        send(proc, {"id": "on2", "type": "prompt", "message": "/poteto-mode"})
        wait_prompt_done(proc, "on2")
        st_on2, _ = get_state(proc, "s_on2")
        on_file = st_on2.get("sessionFile")
        on_sid = st_on2.get("sessionId")

        send(proc, {"id": "ns", "type": "new_session"})
        ns, _ = wait_response(proc, "ns", timeout=30)
        st_new, _ = get_state(proc, "s_new")
        new_sid = st_new.get("sessionId")
        new_file = st_new.get("sessionFile")
        new_ok = (
            ns.get("success")
            and new_sid != on_sid
            and not scan_pstack_mode(new_file)
            and not has_needle(st_new.get("systemPrompt"))
        )
        results.append(
            check(
                "new_session_starts_off",
                new_ok,
                f"{on_sid} -> {new_sid} needle={has_needle(st_new.get('systemPrompt'))}",
            )
        )

        send(proc, {"id": "newturn", "type": "prompt", "message": "Reply with only the word NEWOFF."})
        wait_prompt_done(proc, "newturn")
        st_nt, _ = get_state(proc, "s_nt")
        results.append(
            check(
                "new_session_next_turn_off",
                not has_needle(st_nt.get("systemPrompt")),
                f"sid={st_nt.get('sessionId')}",
            )
        )

        send(proc, {"id": "sw", "type": "switch_session", "sessionPath": on_file})
        sw, _ = wait_response(proc, "sw", timeout=30)
        st_res, _ = get_state(proc, "s_res")
        results.append(
            check(
                "resume_stays_on",
                sw.get("success") and has_needle(st_res.get("systemPrompt")),
                f"sid={st_res.get('sessionId')} needle={has_needle(st_res.get('systemPrompt'))}",
            )
        )

        send(proc, {"id": "setup", "type": "prompt", "message": "/setup-pstack"})
        wait_prompt_done(proc, "setup")
        models_now = models_json.exists()
        config_same = True
        if config_stat and config_yml.exists():
            now = config_yml.stat()
            config_same = (now.st_mtime, now.st_size) == (config_stat.st_mtime, config_stat.st_size)
        write_ok = (models_now == models_existed) and config_same
        results.append(
            check(
                "setup_pstack_no_write",
                write_ok,
                f"models.json existed={models_existed} now={models_now} config_same={config_same}",
            )
        )
    finally:
        stop_omp(proc)
    return results


def main():
    parser = argparse.ArgumentParser(description="pstack omp e2e")
    parser.add_argument("--skip-rpc", action="store_true")
    parser.add_argument("--case", action="append", default=[])
    args = parser.parse_args()
    results = [static_worktree(), static_setup_docs()]
    if not args.skip_rpc:
        results.extend(rpc_suite())
    if args.case:
        results = [r for r in results if r["name"] in set(args.case)]
    failed = [r for r in results if not r["ok"]]
    print(json.dumps({"ok": not failed, "failed": [r["name"] for r in failed], "n": len(results)}), flush=True)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
