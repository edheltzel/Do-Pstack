# e2e

## Purpose

Prove the plugin without chat-only guesses. Static doctor/lint + Vitest on every PR. Live omp RPC is local-only and loads this tree with `omp plugin link ./`.

## Ownership

- `run.py` — live RPC evals; `--skip-rpc` is static-only
- `ci_static.py` — doctor, frontmatter, size, product pack
- `unit/` — Vitest helpers and tests
- `ci-shims/` — `node:fs` stub for `tsc` without `@types/node`

## Local Contracts

- CI and local static gate: `python3 e2e/run.py --skip-rpc` and `npm test`.
- No `omp --mode rpc` on GitHub runners.
- Do not install or run live omp / the plugin extension as a test harness on CI.
- Live RPC, when omp is present, must `omp plugin link ./` before starting. Do not pass `-e`.
- Do not keep a TypeScript copy of `ci_static.py` (no `unit/static-checks.ts`, no homemade brace parser).
- Do not keep a repo `.omp/skills` symlink. `static_install_docs` and `unit/product-capabilities.test.ts` assert filesystem absence, not only README text.

## Work Guidance

Add static cases to `ci_static.py` or `unit/`. Product-pack presence (docs/guide, automations/benny, do-swarm) lives in `ci_static.py --product` and `unit/product-capabilities.test.ts`. Add live RPC cases to `run.py` only when they stay local.

## Verification

```bash
python3 e2e/run.py --skip-rpc
npm test
```

## Child DOX Index

| Path | Owns |
| --- | --- |
| `unit/` | Vitest helpers and unit tests (no child AGENTS.md) |
