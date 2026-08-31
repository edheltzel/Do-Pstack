# pstack

This tree is an omp **extension**. Load it with `omp -e ./extensions/pstack.ts`. That is how `/poteto-mode` and `/skill:ps-…` are live. Skills come from this clone via `.omp/skills` → `../skills`.

It is not an `omp plugin list` plugin. It is not `omp plugin install`. It is not `/add-plugin pstack` (that is Cursor). It is not the Cursor plugin and not an official Cursor port.

`cd pstack && omp` without `-e` does not load this tree. `--plugin-dir .` is optional, not the first command.

## What pstack is

pstack is a Cursor-verified plugin of Lauren Tan ([@poteto](https://x.com/poteto)) skills.

- Marketplace: https://cursor.com/marketplace/cursor/pstack — in Cursor, install with `/add-plugin pstack`
- Source (a folder in `cursor/plugins`, not a standalone repo): https://github.com/cursor/plugins/tree/main/pstack
- Product README: https://github.com/cursor/plugins/blob/main/pstack/README.md
- User guide: https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md

Those pages are the Cursor product. This README does not retell them. `/add-plugin pstack` is Cursor only.

## What omp is

[omp](https://omp.sh) is “A coding agent with the IDE wired in.”

- Home: https://omp.sh
- Install omp: `curl -fsSL https://omp.sh/install | sh`
- Source: https://github.com/can1357/oh-my-pi
- Docs: https://omp.sh/docs
- How omp can install plugins in general (not this repo’s command): https://omp.sh/docs/plugins
- Authoring: https://omp.sh/docs/extension-authoring

## Load this extension

Clone https://github.com/edheltzel/pstack, then start omp with the extension file:

```
git clone https://github.com/edheltzel/pstack.git
cd pstack
omp -e ./extensions/pstack.ts
```

That command lists and injects `/skill:ps-…` from this clone (`.omp/skills` → `../skills`). `--plugin-dir .` is an alternate, not required.

There is no `omp plugin install` or `omp add` in this repo. Do not use `/add-plugin pstack` here. A local `.omp-plugin/marketplace.json` (`source: ./`) does not put this on `omp plugin list`.

## First steps

1. Install omp from https://omp.sh (`curl -fsSL https://omp.sh/install | sh`).
2. Clone this repository and start omp with `-e` (see Load this extension).
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

Files under `skills/` are markdown prompts. Invoke them with `/skill:ps-<name>`. They are live on `omp -e ./extensions/pstack.ts` because `.omp/skills` points at `../skills`. They are not live omp functions or CLIs.

Examples: `/skill:ps-create-verification-skill`, `/skill:ps-swarm`, `/skill:ps-principle-build-the-lever`. Feature Map is a section in `ps-create-verification-skill`, not a runner. Do not treat Feature Map, swarm, or Build the Lever as functions or CLIs.

## License

MIT. omp is also MIT ([license](https://github.com/can1357/oh-my-pi/blob/main/LICENSE)).
