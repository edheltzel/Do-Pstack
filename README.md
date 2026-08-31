# pstack

This repository is a clone of pstack skills plus `extensions/pstack.ts`. It is not the Cursor plugin. It is not an official Cursor port. It is not an `omp plugin list` plugin.

`package.json` `omp.extensions` does not auto-load. `cd pstack && omp` without `-e` does not load this tree.

## What pstack is

pstack is a Cursor-verified plugin of Lauren Tan ([@poteto](https://x.com/poteto)) skills.

- Marketplace: https://cursor.com/marketplace/cursor/pstack — in Cursor, install with `/add-plugin pstack`
- Source (a folder in `cursor/plugins`, not a standalone repo): https://github.com/cursor/plugins/tree/main/pstack
- Product README: https://github.com/cursor/plugins/blob/main/pstack/README.md
- User guide: https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md

Those pages are the Cursor product. This README does not retell them. `/add-plugin pstack` is Cursor only. It is not the omp install for this repo.

## What omp is

[omp](https://omp.sh) is “A coding agent with the IDE wired in.”

- Home: https://omp.sh
- Install omp: `curl -fsSL https://omp.sh/install | sh`
- Source: https://github.com/can1357/oh-my-pi
- Docs: https://omp.sh/docs
- How omp can install plugins in general (not this repo’s command): https://omp.sh/docs/plugins
- Authoring: https://omp.sh/docs/extension-authoring

## Load this tree

Clone https://github.com/edheltzel/pstack, then start omp with the extension file. That is how `/poteto-mode` is live.

```
git clone https://github.com/edheltzel/pstack.git
cd pstack
omp -e ./extensions/pstack.ts
```

There is no `omp plugin install` or `omp add` in this repo. Do not use `/add-plugin pstack` here. A local `.omp-plugin/marketplace.json` (`source: ./`) does not put this on `omp plugin list`.

## First steps

1. Install omp from https://omp.sh (`curl -fsSL https://omp.sh/install | sh`).
2. Clone this repository and start omp with `-e` (see Load this tree).
3. `/poteto-mode` — enable sticky Poteto Mode for this conversation. Optional task arguments are passed through; this also sends `/skill:poteto-mode`.
4. Work as usual. Resume an on conversation and it stays on. `/new` starts off.
5. `/poteto-mode off` (aliases: `disable`, `stop`) — disable this conversation.

If Poteto Mode was never turned on in this conversation, it is off. Mode is per conversation, not process-wide.

The TUI status reads `pstack: poteto mode` when on. Other omp surfaces may not show it.

## Commands

| Command | What it does |
|---|---|
| `/poteto-mode` | Enable sticky Poteto Mode for this conversation. Also sends `/skill:poteto-mode`. |
| `/poteto-mode off` | Disable this conversation. Aliases: `disable`, `stop`. |

That is the live extension. There is no worktree command. No `hooks/` tree. No `src/` tree. No Cursor marketplace APIs.

## Poteto Mode (this extension)

- Enable sends `/skill:poteto-mode`. The `/skill:poteto-mode` input hook also persists enabled.
- Stored as a custom `pstack-mode` entry on that conversation’s session jsonl. Last `{enabled}` wins. Missing means off.
- `session_start` re-reads the jsonl. `new_session` / `/new` starts off. Resume of an on conversation stays on.
- When on, a prompt needle prepends “Pstack Poteto Mode is on…”
- The TUI status reads `pstack: poteto mode` when on.
- Off aliases: `off`, `disable`, `stop`.
- No Cursor marketplace APIs. No `models.json` writer. No `hooks/` or `src/` tree.

## Skills

Files under `skills/` are markdown prompts. Invoke them with `/skill:<name>`. They are not live omp functions or CLIs.

`/skill:create-verification-skill`, `/skill:swarm`, and `/skill:principle-build-the-lever` are markdown prompts. Feature Map is a section in `create-verification-skill`, not a runner. Do not treat Feature Map, swarm, or Build the Lever as functions or CLIs.

## License

MIT. omp is also MIT ([license](https://github.com/can1357/oh-my-pi/blob/main/LICENSE)).
