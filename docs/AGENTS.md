# docs

## Purpose

Human docs for this omp plugin. First-run is omp; the numbered guide is the original pstack product tutorial. Agent-facing native install lives on the root rail; this file must not tell operators `-e` every session.

## Ownership

- `getting-started.md` — omp first-run (`omp plugin link ./`, later any cwd type `/` for `/skill:ps-…` and sticky `/poteto-mode`). One-off `omp -e ./extensions/pstack.ts` stays a test path.
- `guide/` — original numbered tutorial (01–10 plus images), ported from `cursor/plugins` `pstack/docs/guide/`.

## Local Contracts

- Do not replace `getting-started.md` with the original guide.
- README may link to both.
- Guide on-disk skill links use `skills/ps-*` so they resolve in this tree. Slash names in guide prose may still say `/how`; the live surface is `/skill:ps-how`. `/poteto-mode` stays unprefixed.
- Operator install matches the root rail Native omp contract. Do not tell operators `-e` every session.

## Work Guidance

Port guide pages and images from upstream. Remap `../../skills/<name>/` to `../../skills/ps-<name>/`. Keep getting-started omp-specific. Agents tell operators plugin-link, not `-e` every session.

## Verification

- `npx vitest run e2e/unit/product-capabilities.test.ts`
- Relative links in `README.md` and `docs/` must resolve.

## Child DOX Index

None. `guide/` is a leaf tutorial.
