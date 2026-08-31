# Getting started

In about ten minutes we clone pstack wherever we want, load that clone as an omp plugin, then prove sticky Poteto Mode and role listing.

You need omp (Oh My Pi) on PATH. There is no required host, data directory, or identity provider.

## Clone and load the plugin

Clone this repository to any directory. The path you choose is the plugin tree.

```sh
git clone https://github.com/edheltzel/pstack.git
cd pstack
omp plugin install .
```

`omp plugin install .` is omp's documented local-folder install (same as `omp plugin link .`). It reads this tree: `package.json` `omp.extensions` loads `./extensions/pstack.ts`, and `.omp-plugin/marketplace.json` catalogs the plugin as `pstack` with source `./`. Do not copy the tree into a special plugin directory and do not invent a symlink.

Restart omp so the factory loads. `/poteto-mode` and `/setup-pstack` should be available.

## Turn Poteto Mode on

In an omp session:

```text
/poteto-mode
```

`/poteto-mode <task>` turns it on with work attached. Send another message in the same conversation. Poteto Mode should still be on.

## List roles without writing config

```text
/setup-pstack
```

You should see `modelRoles` and the `agents/*.md` `@role` table. `/setup-pstack` does not write `models.json` or `config.yml`. Persist role changes with `/model` Roles and `/agents`.

## Turn it off and start a new session

```text
/poteto-mode off
```

Then `/new`. The new conversation starts with Poteto Mode off. Resume of a conversation that was on stays on.

## Optional: evals

Static checks (CI and local; no omp):

```sh
python3 e2e/run.py --skip-rpc
npm test
```

Live RPC is local-only and needs omp. See [e2e/README.md](../e2e/README.md).

Isolated omp worktrees default to `~/.omp/wt` (override with `worktree.base` or `OMP_WORKTREE_DIR`).
