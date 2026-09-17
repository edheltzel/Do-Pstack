# scripts

## Purpose

Maintainer CLI for this package. `pstack.mjs` is `pstack sync` (vendor official skills) and `pstack bump` (semver).

## Ownership

- `pstack.mjs` — `pstack sync` (`--dry-run`, `--force`) and `pstack bump <patch|minor|major>` (`--dry-run`, `--tag`, `--release`).

## Local Contracts

- Source of truth is `https://github.com/cursor/plugins.git` folder `pstack/skills`. Not `backnotprop/pstack`. Not skills.sh. `npx skills add` is not the path (it would install a second skill tree).
- Layout map: upstream `skills/<name>/` → package `skills/do-<name>/`. YAML `name` gets the `do-` prefix. Sibling links `../<name>/` become `../do-<name>/`.
- One skill tree: sibling `skills/` at the package root. Do not write `.omp/skills`, `.claude-plugin/skills`, or agent skill dirs.
- Do not restore `poteto-mode/playbooks/shipping.md` (this fork deleted it).
- Default apply adds missing official files and leaves diverged local forks (omp adaptations) in place. `--force` overwrites diverged files except local subtractions.
- `bump <kind>` writes `package.json` version (omp + pi) and `.claude-plugin/plugin.json` only. Marketplace catalog has no version field. After commit, `bump --tag` tags that HEAD sha; `bump --release` pushes the tag and `gh release create --target <sha>`. Kind and --tag together are refused.

## Work Guidance

Keep sync a fetch + layout rewrite. Keep bump a JSON version rewrite. Do not fold either into `extensions/pstack.ts`.

## Verification

```bash
node scripts/pstack.mjs sync --dry-run
node scripts/pstack.mjs bump patch --dry-run
npx vitest run e2e/unit/sync-skills.test.ts
```

## Child DOX Index

None.
