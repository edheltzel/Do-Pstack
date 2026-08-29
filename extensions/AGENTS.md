# extensions

## Purpose

The one omp factory. Sticky `/poteto-mode` for a single conversation.

## Ownership

- `pstack.ts` — only extension file.

## Local Contracts

- Mode is per-session (`pstack-mode` on that session's jsonl / session id). Missing entry means off.
- Never a process-wide boolean.
- `package.json` `omp.extensions` points here.

## Work Guidance

Restart omp after a factory change. Do not add a second extension unless the root rail changes.

## Verification

- `npx tsc --noEmit -p tsconfig.ci.json`
- `python3 e2e/ci_static.py --perf` (size/parse)
- Live sticky behavior: `python3 e2e/run.py` locally (not CI)

## Child DOX Index

None. This directory is a leaf.
