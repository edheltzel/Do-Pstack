# pstack e2e

Static doctor/lint + Vitest on every PR. Live omp RPC evals are local-only. Not chat-only.

Static (CI and local; no omp, no claude):

```bash
python3 e2e/run.py --skip-rpc
npm test
```

Live RPC (local only; needs `omp` on PATH). The launcher runs `omp plugin link ./` then `omp --mode rpc` from this tree. It does not pass `-e`.

```bash
python3 e2e/run.py
python3 e2e/run.py --case poteto_on --case new_session_starts_off
```

Each RPC run uses `--session-dir` under a temp folder and `--no-tools`.
A factory change still needs an omp restart (a fresh `omp --mode rpc` process loads the tree).
Do not run `omp --mode rpc` on GitHub runners.

Host-only prove (needs omp and/or Claude Code on the machine; not CI):

```bash
omp plugin link ./
omp plugin list
omp plugin doctor
claude plugin validate .
```

| Case | What it proves |
| --- | --- |
| `install_plugin_link` | README/AGENTS teach omp marketplace, pi git install, Claude plugin install; competing stories gone |
| `pstack sync` | `e2e/unit/sync-skills.test.ts` — official skills SoT is `cursor/plugins`; writes into `skills/do-*` only |
| `poteto_on` | `/poteto-mode` injects the needle and writes `pstack-mode` on this session |
| `second_turn_sticky` | Next turn still has the needle |
| `poteto_off` | `/poteto-mode off` then next turn has no needle |
| `new_session_starts_off` | Same-process `new_session`: new sid, empty jsonl, no needle |
| `new_session_next_turn_off` | Turn after `new_session` still off |
| `resume_stays_on` | `switch_session` back to the on-session restores the needle |
| `plugin_link` | Live RPC first ran `omp plugin link ./` |
| `worktree_cleanup_omp` | Playbook uses `~/.omp/wt` + `worktree.base` |
