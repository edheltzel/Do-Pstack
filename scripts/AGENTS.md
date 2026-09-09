# scripts

## Purpose

Maintainer CLI for this package. `pstack.mjs` is the `pstack sync` entry: pull official skills from `cursor/plugins` `pstack/skills` into the existing `skills/do-*` tree.

## Ownership

- `pstack.mjs` — `pstack sync` (and `--dry-run`).

## Local Contracts

- Source of truth is `https://github.com/cursor/plugins.git` folder `pstack/skills`. Not `backnotprop/pstack`. Not skills.sh. `npx skills add` is not the path (it would install a second skill tree).
- Layout map: upstream `skills/<name>/` → package `skills/do-<name>/`. YAML `name` gets the `do-` prefix. Sibling links `../<name>/` become `../do-<name>/`.
- One skill tree: sibling `skills/` at the package root. Do not write `.omp/skills`, `.claude-plugin/skills`, or agent skill dirs.
- Do not restore `poteto-mode/playbooks/shipping.md` (this fork deleted it).
- Default apply adds missing official files and leaves diverged local forks (omp adaptations) in place. `--force` overwrites diverged files except local subtractions.

## Work Guidance

Keep this a fetch + layout rewrite. Do not fold sync into `extensions/pstack.ts`.

## Verification

```bash
node scripts/pstack.mjs sync --dry-run
npx vitest run e2e/unit/sync-skills.test.ts
```

## Child DOX Index

None.
