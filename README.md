# pstack (omp)

Git tree: `~/Developer/pstack`

omp loads this plugin (one extension: `extensions/pstack.ts`). Restart omp after a factory change.

Sticky mode: `/poteto-mode` or `/poteto-mode <task>`. Off: `/poteto-mode off`. `/new` starts a new conversation (off). Resume of an on-session stays on.

Roles: `/setup-pstack` lists `modelRoles` and `agents/*.md` `@role`. Persist via `/model` Roles and `/agents`. Does not write `models.json` or `config.yml`.

Worktrees: `~/.omp/wt`, override `worktree.base` / `OMP_WORKTREE_DIR`.

## Evals

Static (CI and local; no omp):

```bash
python3 e2e/run.py --skip-rpc
npm test
```

Live RPC (local only; needs omp):

```bash
python3 e2e/run.py
```

See [e2e/README.md](e2e/README.md).
