# pstack

This package is an installable omp **plugin**. From the package root, one-time `omp plugin link ./`. Later sessions (any cwd): start `omp`, type `/` (`/skill:ps-…`, sticky `/poteto-mode`). Sibling `skills/` at the package root is what omp auto-discovers after link.

It is not the Cursor plugin and not an official Cursor port.

## What pstack is

pstack is a Cursor-verified plugin of Lauren Tan ([@poteto](https://x.com/poteto)) skills.

- Source (a folder in `cursor/plugins`, not a standalone repo): https://github.com/cursor/plugins/tree/main/pstack
- Product README: https://github.com/cursor/plugins/blob/main/pstack/README.md
- User guide: https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md

Those pages are the Cursor product. This README does not retell them.

## Docs

- [The pstack guide](./docs/guide/README.md) — original numbered product tutorial (setup through recipes, plus images). On-disk skill links use `skills/ps-*`; slash skills are `/skill:ps-…`. `/poteto-mode` stays unprefixed.

## Automations

pstack also ships a dormant [benny automation pack](./automations/benny/). Benny triages Slack issue reports, then reproduces and fixes confirmed bugs with real UI evidence. Its files are **not** slash skills. Sibling `skills/` at the package root is the only skill tree; do not add a second one.

Setup starts at [`automations/benny/FOR_AGENTS.md`](./automations/benny/FOR_AGENTS.md). That README records the Cursor Automations host vs what omp can run.

## What omp is

[omp](https://omp.sh) is “A coding agent with the IDE wired in.”

- Home: https://omp.sh
- Install omp: `curl -fsSL https://omp.sh/install | sh`
- Source: https://github.com/can1357/oh-my-pi
- Docs: https://omp.sh/docs
- How omp can install plugins in general (not this repo’s command): https://omp.sh/docs/plugins
- Authoring: https://omp.sh/docs/extension-authoring

## Load this plugin

Clone https://github.com/edheltzel/pstack, then from the package root:

```
git clone https://github.com/edheltzel/pstack.git
cd pstack
omp plugin link ./
```

That one-time link is how later sessions (any cwd) type `/` (`/skill:ps-…`, sticky `/poteto-mode`). Confirm with `omp plugin list`.

Do not copy only `pstack.ts` into `~/.omp/agent/extensions/`.

## First steps

1. Install omp from https://omp.sh (`curl -fsSL https://omp.sh/install | sh`).
2. Clone this repository and, from the package root, `omp plugin link ./` (see Load this plugin). Later sessions (any cwd): `omp`, then type `/`.
3. `/poteto-mode` — enable sticky Poteto Mode for this conversation. Optional task arguments are passed through; this also sends `/skill:ps-poteto-mode`.
4. Work as usual. Resume an on conversation and it stays on. `/new` starts off.
5. `/poteto-mode off` (aliases: `disable`, `stop`) — disable this conversation.

If Poteto Mode was never turned on in this conversation, it is off. Mode is per conversation, not process-wide.

The TUI status reads `pstack: poteto mode` when on. Other omp surfaces may not show it.

## Commands

| Command | What it does |
|---|---|
| `/poteto-mode` | Enable sticky Poteto Mode for this conversation. Also sends `/skill:ps-poteto-mode`. |
| `/poteto-mode off` | Disable this conversation. Aliases: `disable`, `stop`. |

That is the live extension command. It stays unprefixed. There is no worktree command. No `hooks/` tree. No `src/` tree. No Cursor marketplace APIs.

## Poteto Mode (this extension)

- Enable sends `/skill:ps-poteto-mode`. The `/skill:ps-poteto-mode` input hook also persists enabled.
- Stored as a custom `pstack-mode` entry on that conversation’s session jsonl. Last `{enabled}` wins. Missing means off.
- `session_start` re-reads the jsonl. `new_session` / `/new` starts off. Resume of an on conversation stays on.
- When on, a prompt needle prepends “Pstack Poteto Mode is on…”
- The TUI status reads `pstack: poteto mode` when on.
- Off aliases: `off`, `disable`, `stop`.
- No Cursor marketplace APIs. No `models.json` writer. No `hooks/` or `src/` tree.

## Skills

Files under `skills/` are markdown prompts. Invoke them with `/skill:ps-<name>`. They are live after `omp plugin link ./` (sibling tree auto-discovered). They are not live omp functions or CLIs.

Examples: `/skill:ps-create-verification-skill`, `/skill:ps-swarm`, `/skill:ps-principle-build-the-lever`. Feature Map is a section in `ps-create-verification-skill`, not a runner. Do not treat Feature Map, swarm, or Build the Lever as functions or CLIs.

## License

MIT. omp is also MIT ([license](https://github.com/can1357/oh-my-pi/blob/main/LICENSE)).
