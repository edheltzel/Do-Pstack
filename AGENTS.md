# pstack

omp + Claude Code plugin: one factory (`extensions/pstack.ts`), Claude manifest (`.claude-plugin/plugin.json`), skills, agents.

## Codegraph

Use codegraph before guessing structure.

Commands: `codegraph query`, `codegraph explore`, `codegraph context`, `codegraph node`.

- Captain's machine: `/Users/ed/.bun/bin/codegraph`
- Else `codegraph` on PATH, or `npx codegraph`

Do not require codegraph on CI. If the binary is missing, read the tree.

## DOX

AGENTS.md files are binding work contracts for their subtrees.

Work products must stay understandable from the nearest AGENTS.md plus every parent above it.

### Read before editing

1. Read root AGENTS.md.
2. Identify every path you will touch.
3. Walk from repo root to each target.
4. Read every AGENTS.md along each route.
5. Nearer doc wins local details.
6. No child may weaken DOX.
7. Re-read the chain in the current session; do not rely on memory.

### Update after editing

Every meaningful change needs a DOX pass.

- Update the closest owning AGENTS.md when purpose/scope/ownership, durable structure/contracts, inputs/outputs/constraints, user preferences, or AGENTS.md index contents change.
- Update parents when child index or ownership changes.
- Remove stale text.
- Small edits that do not change contracts may leave docs unchanged, but the pass still happens.

### Hierarchy

Root is the DOX rail (project-wide rules + Child DOX Index). Child AGENTS.md own domain rules + their own index. Closer = more specific.

Child shape: Purpose, Ownership, Local Contracts, Work Guidance, Verification, Child DOX Index.

Style: concise, operational, no diary.

Closeout: re-check paths, update owning docs, refresh indexes, run verification, report docs left unchanged.

## Project contracts

- Static gate (CI and local): `python3 e2e/run.py --skip-rpc` and `npm test` (Vitest).
- No `omp`, no `omp --mode rpc`, no TUI, no `claude` on GitHub runners. Live RPC is local only: `python3 e2e/run.py` without `--skip-rpc`. Host-only prove (`omp plugin doctor`, `claude plugin validate`) is documented in e2e/AGENTS.md.
- One factory. Poteto-mode is per-session, never a process-wide boolean.
- Official skills SoT is `cursor/plugins` `pstack/skills`. Update with `npm run sync` (`node scripts/pstack.mjs sync`). Writes into existing `skills/do-*` only. Not `backnotprop/pstack`, not skills.sh, not `npx skills add`.

## Version control

GitButler (`but`) is the VCS. The main checkout is the `gitbutler/workspace` branch; target is `origin/master`.

- All writes go through `but` (`commit`, `push`, `pr new`, `move`, `squash`). Read-only git (`git log`, `git blame`) is fine.
- One dedicated `but` branch per feature. Commit only that session's changes to it.
- Commit small and often: after every working checkpoint, not at the end of the task. Split unrelated hunks into separate commits. Large commits hide what changed from the human in the loop.
- Stack when a change clearly builds on an unmerged branch: `but move <child> --above <parent>`. Do not mix dependent work into one branch.
- Prefer `but` branches in the workspace over git worktrees (GitButler does not commit from linked worktrees). If a worktree is needed for a new feature, suffix it `-wip`.
- PRs only when asked. Use `but pr new <top-branch> -t`, never `gh pr create`. Write the PR body; when the branch is stacked, name the branches it depends on with a `Stacked on:` line so the reviewer can find them.

## Native omp

Tell operators plugin-link only:

- Install host via https://omp.sh/install if needed.
- From this package root: `omp plugin link ./`
- Later sessions, any cwd: type `/` (`/skill:do-…`, sticky `/poteto-mode`)
- Do not marketplace. Do not copy `pstack.ts` into `~/.omp/agent/extensions/`.
- Do not keep a repo `.omp/skills` symlink. Sibling `skills/` is what plugin-link discovers.

## Native Claude Code

Tell operators plugin-first only:

- Manifest: `.claude-plugin/plugin.json`. Catalog: `.claude-plugin/marketplace.json`. Skills stay at plugin-root `skills/`, not inside `.claude-plugin/`.
- Install: `claude plugin marketplace add <checkout-or-edheltzel/pstack-for-omp>` then `claude plugin install pstack@pstack`.
- This session only: `claude --plugin-dir ./`
- Slash skills: `/pstack:do-*`. Do not rename the `do-` skill set.
- Validate on a host with Claude Code: `claude plugin validate .`
- Sticky `/poteto-mode` is omp factory only. Claude uses `/pstack:do-poteto-mode`.

## Verification

```bash
python3 e2e/run.py --skip-rpc
npm test
```

## Child DOX Index

| Path                                           | Owns                                                                                            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [extensions/AGENTS.md](extensions/AGENTS.md)   | Factory `pstack.ts`; per-session poteto-mode                                                    |
| [e2e/AGENTS.md](e2e/AGENTS.md)                 | Static doctor/lint + Vitest; live RPC local-only via plugin-link                                |
| [skills/AGENTS.md](skills/AGENTS.md)           | Skill tree; SKILL.md frontmatter `name` + `description`                                         |
| [docs/AGENTS.md](docs/AGENTS.md)               | original numbered `guide/`; first-run lives on README (omp plugin link + Claude plugin install) |
| [automations/AGENTS.md](automations/AGENTS.md) | Dormant Benny pack; not slash skills                                                            |
| [scripts/AGENTS.md](scripts/AGENTS.md)         | `pstack sync`: vendor official skills from cursor/plugins into `skills/do-*`                    |

`agents/` and `commands/` have no child AGENTS.md; they follow this rail. Commands need frontmatter `description`.
