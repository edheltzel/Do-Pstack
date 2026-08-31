# pstack

This repository is an [omp](https://omp.sh) plugin that loads pstack skills from this tree. It is not the Cursor plugin. It is not an official Cursor port.

## What pstack is

pstack is a Cursor-verified plugin of Lauren Tan ([@poteto](https://x.com/poteto)) skills.

- Marketplace: https://cursor.com/marketplace/cursor/pstack — in Cursor, install with `/add-plugin pstack`
- Source (a folder in `cursor/plugins`, not a standalone repo): https://github.com/cursor/plugins/tree/main/pstack
- Product README: https://github.com/cursor/plugins/blob/main/pstack/README.md — `/setup-pstack` then `/poteto-mode`; 22 playbooks; MIT
- User guide: https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md

Those pages are the product. This README does not retell them.

## What omp is

[omp](https://omp.sh) is “A coding agent with the IDE wired in.”

- Home: https://omp.sh
- Install omp: `curl -fsSL https://omp.sh/install | sh`
- Source: https://github.com/can1357/oh-my-pi
- Docs: https://omp.sh/docs
- How omp can install plugins in general (not this repo’s command): https://omp.sh/docs/plugins
- Authoring: https://omp.sh/docs/extension-authoring

## Install this plugin

Clone https://github.com/edheltzel/pstack, then open omp in that directory so it loads `extensions/pstack.ts` (`package.json` `omp.extensions` / `omp.skills`). There is no `omp plugin install` or `omp add` in this repo. `/add-plugin pstack` is Cursor only.

```
git clone https://github.com/edheltzel/pstack.git
cd pstack
omp
```

A local marketplace file lives at `.omp-plugin/marketplace.json` (`source: ./`). There is no CLI next to it.

## First steps

1. Open omp in the cloned directory (see Install).
2. `/setup-pstack` — lists `@role` maps. It does not write `config.yml` or `models.json`.
3. `/poteto-mode` — enable sticky Poteto Mode for this conversation. Optional task arguments are passed through; this also sends `/skill:poteto-mode`.
4. Work as usual. Resume an on conversation and it stays on. `/new` starts off.
5. `/poteto-mode off` (aliases: `disable`, `stop`) — disable this conversation.

If Poteto Mode was never turned on in this conversation, it is off. Mode is per conversation, not process-wide.

The TUI status reads `pstack: poteto mode` when on. Other omp surfaces may not show it.

## Commands

| Command | What it does |
|---|---|
| `/setup-pstack` | Lists `@role` maps. Does not write config. |
| `/poteto-mode` | Enable sticky Poteto Mode for this conversation. Also sends `/skill:poteto-mode`. |
| `/poteto-mode off` | Disable this conversation. Aliases: `disable`, `stop`. |

There is no worktree command. No `hooks/` tree. No `src/` tree. No Cursor marketplace APIs. `/setup-pstack` does not write `config.yml` or `models.json`.

## Poteto Mode (this plugin)

- Enable sends `/skill:poteto-mode`. The `/skill:poteto-mode` input hook also persists enabled.
- Stored as a custom `pstack-mode` entry on that conversation’s session jsonl. Last `{enabled}` wins. Missing means off.
- `session_start` re-reads the jsonl. `new_session` / `/new` starts off. Resume of an on conversation stays on.
- When on, a prompt needle prepends “Pstack Poteto Mode is on…”
- The TUI status reads `pstack: poteto mode` when on.
- Off aliases: `off`, `disable`, `stop`.
- Skill tree comes from `package.json` (`omp.skills: ["./skills"]`), not from the extension factory.
- No Cursor marketplace APIs. No `models.json` writer. No `hooks/` or `src/` tree.

## Skills

Loaded via `omp.skills: ["./skills"]` (not slash unless noted). Each lives at `skills/<name>/SKILL.md`:

architect, arena, automate-me, blast-radius, bro, create-verification-skill, figure-it-out, how, interrogate, maintain-verification-skill, make-bot-ui, no-comments, poteto-mode, recall, reflect, setup-pstack, show-me-your-work, swarm, tdd, teach, technical-writing, typescript-best-practices, unslop, why

Plus 21 `principle-*` under `skills/<name>/SKILL.md`.

This list is the tree on disk. Do not call these Cursor’s 22 playbooks.

## Agents

These are agents, not slash commands: poteto-agent, comment-sicko, how-explorer, how-explainer, arena-runner, arena-judge, swarm-worker, interrogate-reviewer.

## License

MIT. omp is also MIT ([license](https://github.com/can1357/oh-my-pi/blob/main/LICENSE)).
