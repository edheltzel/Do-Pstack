# automations

## Purpose

Dormant Benny pack: Slack issue triage plus reproduce/fix. Not a slash-skill tree.

## Ownership

- `benny/` — original pack from `cursor/plugins` `pstack/automations/benny/`, adapted for omp without dropping product behavior.

## Local Contracts

- `SKILL.md` files here are automation instructions. Do not add this directory to `package.json` `omp.skills`. Do not prefix them as `ps-*` slash skills.
- Cursor host: copy to `.cursor/automations/benny/`, enable pstack in `.cursor/settings.json`, create live automations with `/automate`.
- omp host: copy or run in-repo after `omp plugin link ./`; shared skills are `/skill:ps-…`. omp has no Slack-triggered Cursor Automations equivalent (HOST GAP in `benny/README.md`).

## Work Guidance

Keep the operational files. Adapt `FOR_AGENTS.md`, `README.md`, and setup notes for omp. Do not add a Slack poller to `extensions/pstack.ts`.

## Verification

- `npx vitest run e2e/unit/product-capabilities.test.ts`
- Key pack files listed in `e2e/ci_static.py` `PRODUCT_PACK_FILES` must exist.

## Child DOX Index

None. `benny/` is the pack.
