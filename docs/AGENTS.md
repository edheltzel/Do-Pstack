# docs

## Purpose

Human docs for this plugin. First-run is the README (omp marketplace `pstack@pstack`, `pi install git:github.com/edheltzel/Do-Pstack`, Claude `claude plugin install pstack@pstack`). The numbered guide is an omp walkthrough of the original pstack product tutorial. This file must not teach a second omp mount story (`omp -e`) or a fake installer.

## Ownership

- `guide/` — numbered walkthrough (01–10 plus images). Tutorial stills still come from `cursor/plugins` `pstack/docs/guide/`. `images/pstack-demo.gif` is live Terminal stills of omp (`/poteto-mode`, playbook todos, `npm run sync -- --dry-run`).

## Local Contracts

- README owns first-run: omp `marketplace add edheltzel/Do-Pstack` + `install pstack@pstack`, Pi `pi install git:github.com/edheltzel/Do-Pstack`, Claude plugin install (`marketplace add` + `pstack@pstack`, or `claude --plugin-dir ./`). Checkout path is `omp plugin link ./` / `pi install ./`. Do not add `docs/getting-started.md` or teach `omp -e` / `pi -e` as an install path.
- README may link the numbered guide.
- Guide on-disk skill links use `skills/do-*` so they resolve in this tree. Slash names in guide prose may still say `/how`; the live omp surface is `/skill:do-how`, Claude is `/pstack:do-how`. `/poteto-mode` stays unprefixed on omp.
- Setup guide (`01-setup.md`) matches `do-setup-pstack`: `/model` Roles and `/agents` only. Do not teach `pstack-models.mdc`.
- Operator install matches the root rail Native omp, Native Pi, and Native Claude Code contracts.

## Work Guidance

Keep the omp walkthrough. Do not paste upstream Cursor install prose back over it. Remap `../../skills/<name>/` to `../../skills/do-<name>/`. Agents tell operators GitHub install (omp marketplace, `pi install git:…`, Claude plugin install).

## Verification

- `npx vitest run e2e/unit/product-capabilities.test.ts`
- Relative links in `README.md` and `docs/` must resolve.

## Child DOX Index

None. `guide/` is a leaf tutorial.
