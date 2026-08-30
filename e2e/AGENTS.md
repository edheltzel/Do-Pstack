# e2e

## Purpose

Prove the plugin without chat-only guesses. Static doctor/lint/perf + Vitest on every PR. Live omp RPC is local-only.

## Ownership

- `run.py` — live RPC evals; `--skip-rpc` is static-only
- `ci_static.py` — doctor, frontmatter, size/parse, e2e budget
- `unit/` — Vitest helpers and tests
- `ci-shims/` — `node:fs` stub for `tsc` without `@types/node`

## Local Contracts

- CI and local static gate: `python3 e2e/run.py --skip-rpc` and `npm test`.
- No `omp --mode rpc` on GitHub runners.
- Do not install or run live omp / the plugin extension as a test harness.

## Work Guidance

Add static cases to `ci_static.py` or `unit/`. Add live RPC cases to `run.py` only when they stay local.

## Verification

```bash
python3 e2e/run.py --skip-rpc
npm test
```

## Child DOX Index

| Path | Owns |
| --- | --- |
| `unit/` | Vitest helpers and unit tests (no child AGENTS.md) |
