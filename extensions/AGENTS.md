# extensions

## Purpose

The one omp factory. Sticky `/poteto-mode` for a single conversation.

## Ownership

- `pstack.ts` — only extension file.

## Local Contracts

- Mode is per-session (`pstack-mode` on that session's jsonl / session id). Missing entry means off.
- Never a process-wide boolean.
- Sticky `/poteto-mode` is factory `registerCommand("poteto-mode")` only. Do not ship `commands/poteto-mode.md`.
- `package.json` `omp.extensions` points here. Keep legacy `pi.extensions` as the same path list.

## Work Guidance

Restart omp after a factory change. Do not add a second extension unless the root rail changes.

## Verification

- `npx tsc --noEmit -p tsconfig.ci.json`
- `python3 e2e/ci_static.py --quality` (includes factory size)
- Live sticky behavior: `python3 e2e/run.py` locally (not CI); launcher uses `omp plugin link ./`
- Host-only: `omp plugin list` / `omp plugin doctor` after link. Claude does not load this factory.

## Child DOX Index

None. This directory is a leaf.
