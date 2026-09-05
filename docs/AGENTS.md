# docs

## Purpose

Human docs for this omp plugin. First-run is the README (`omp plugin link ./`). The numbered guide is the original pstack product tutorial. This file must not teach a second mount story.

## Ownership

- `guide/` — original numbered tutorial (01–10 plus images), ported from `cursor/plugins` `pstack/docs/guide/`.

## Local Contracts

- README owns first-run: `omp plugin link ./`. Do not add `docs/getting-started.md` or teach `omp -e` as an install path.
- README may link the numbered guide.
- Guide on-disk skill links use `skills/do-*` so they resolve in this tree. Slash names in guide prose may still say `/how`; the live surface is `/skill:do-how`. `/poteto-mode` stays unprefixed.
- Operator install matches the root rail Native omp contract.

## Work Guidance

Port guide pages and images from upstream. Remap `../../skills/<name>/` to `../../skills/do-<name>/`. Agents tell operators plugin-link.

## Verification

- `npx vitest run e2e/unit/product-capabilities.test.ts`
- Relative links in `README.md` and `docs/` must resolve.

## Child DOX Index

None. `guide/` is a leaf tutorial.
