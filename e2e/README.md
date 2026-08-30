# pstack e2e

Static doctor/lint/perf + Vitest on every PR. Live omp RPC evals are local-only. Not chat-only.

Static (CI and local; no omp):

```bash
python3 e2e/run.py --skip-rpc
npm test
```

Live RPC (local only; needs `omp` on PATH):

```bash
python3 e2e/run.py
python3 e2e/run.py --case poteto_on --case new_session_starts_off
```

Each RPC run uses `--session-dir` under a temp folder and `--no-tools`.
A factory change still needs an omp restart (a fresh `omp --mode rpc` process loads the tree).
Do not run `omp --mode rpc` on GitHub runners.

| Case | What it proves |
| --- | --- |
| `poteto_on` | `/poteto-mode` injects the needle and writes `pstack-mode` on this session |
| `second_turn_sticky` | Next turn still has the needle |
| `poteto_off` | `/poteto-mode off` then next turn has no needle |
| `new_session_starts_off` | Same-process `new_session`: new sid, empty jsonl, no needle |
| `new_session_next_turn_off` | Turn after `new_session` still off |
| `resume_stays_on` | `switch_session` back to the on-session restores the needle |
| `setup_pstack_no_write` | `/setup-pstack` does not write `models.json` or `config.yml` |
| `worktree_cleanup_omp` | Playbook uses `~/.omp/wt` + `worktree.base` |
