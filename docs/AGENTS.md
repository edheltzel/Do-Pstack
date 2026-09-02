# docs

## Purpose

Human docs for this omp extension. First-run is omp; the numbered guide is the original pstack product tutorial.

## Ownership

- `getting-started.md` — omp first-run (`omp -e`, `/poteto-mode`, `/skill:ps-…`).
- `guide/` — original numbered tutorial (01–10 plus images), ported from `cursor/plugins` `pstack/docs/guide/`.

## Local Contracts

- Do not replace `getting-started.md` with the original guide.
- README may link to both.
- Guide on-disk skill links use `skills/ps-*` so they resolve in this tree. Slash names in guide prose may still say `/how`; the live surface is `/skill:ps-how`. `/poteto-mode` stays unprefixed.

## Work Guidance

Port guide pages and images from upstream. Remap `../../skills/<name>/` to `../../skills/ps-<name>/`. Keep getting-started omp-specific.

## Verification

- `npx vitest run e2e/unit/product-capabilities.test.ts`
- Relative links in `README.md` and `docs/` must resolve.

## Child DOX Index

None. `guide/` is a leaf tutorial.
