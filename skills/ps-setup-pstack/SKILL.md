---
name: ps-setup-pstack
description: Show which pstack plugin agents use which @role. Change routing via /agents or /model Roles. Use for /setup-pstack, "configure pstack models", or changing pstack's model choices.
---

# Setup pstack (omp)

Official persist is `/model` → Roles (`modelRoles` in config.yml) and each plugin `agents/*.md` `model: "@role"`. This is **not** `~/.omp/agent/pstack/models.json` (that file is not omp routing; ignore it). Do not write Cursor `pstack-models.mdc`. Do not edit `~/.omp/agent/config.yml` by hand unless the user asks.

## Plugin agents and current roles

These files live in this plugin's `agents/` directory. Change a mapping with `/agents` (per-agent model override) or `/model` → Roles (the `@role` alias). Reuse the existing roles; do not invent new required ones.

| Agent | Role | Typical use |
| --- | --- | --- |
| poteto-agent | `@default` | /poteto-mode delegates and general playbook workers |
| comment-sicko | `@smol` | /no-comments report-only pass |
| how-explorer | `@default` | /how complex-question explorers; also source-wave / mining readers |
| how-explainer | `@slow` | /how synthesis |
| arena-runner | `@default` | /arena candidate (writes only its assigned path) |
| arena-judge | `@slow` | /arena readonly cross-judge |
| swarm-worker | `@default` | /swarm slice or race arm |
| interrogate-reviewer | `@slow` | /interrogate readonly adversarial reviewer |

N parallel models is not available from one agent definition. Diversity is prompt, path, or label only unless the user changes that agent's `model` in `/agents`.

## Steps

1. Read `~/.omp/agent/config.yml` `modelRoles` and print the live map. Then list the table above. Do not write config.yml, models.json, or pstack-models.mdc.
2. If the user wants a different concrete model for a role, tell them to open `/model` → Roles and change that `@role`. If they want one agent on a different role or concrete selector, tell them to open `/agents` and override that agent.
3. Confirm the change is in `/agents` or Roles. New `task` calls pick it up. Re-running this skill only re-lists; it writes no routing files.

## Offer a verification skill (optional)

If the project has no `verify-*` skill or harness, offer once to run `/create-verification-skill`. On no, move on.
