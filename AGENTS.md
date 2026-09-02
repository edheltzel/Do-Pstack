# pstack

omp plugin: one factory (`extensions/pstack.ts`), skills, agents, and commands.

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
- No `omp`, no `omp --mode rpc`, no TUI on GitHub runners. Live RPC is local only: `python3 e2e/run.py` without `--skip-rpc`.
- One factory. Poteto-mode is per-session, never a process-wide boolean.

## Verification

```bash
python3 e2e/run.py --skip-rpc
npm test
```

## Child DOX Index

| Path | Owns |
| --- | --- |
| [extensions/AGENTS.md](extensions/AGENTS.md) | Factory `pstack.ts`; per-session poteto-mode |
| [e2e/AGENTS.md](e2e/AGENTS.md) | Static doctor/lint/perf + Vitest; live RPC local-only |
| [skills/AGENTS.md](skills/AGENTS.md) | Skill tree; SKILL.md frontmatter `name` + `description` |
| [docs/AGENTS.md](docs/AGENTS.md) | omp first-run `getting-started.md`; original numbered `guide/` |
| [automations/AGENTS.md](automations/AGENTS.md) | Dormant Benny pack; not slash skills |

`agents/` and `commands/` have no child AGENTS.md; they follow this rail. Commands need frontmatter `description`.
