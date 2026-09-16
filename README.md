```
██████╗ ███████╗████████╗ █████╗  ██████╗██╗  ██╗
██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
██████╔╝███████╗   ██║   ███████║██║     █████╔╝
██╔═══╝ ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
██║     ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
╚═╝     ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
```

# pstack

> [!NOTE]
> EdHeltzel's pstack for omp

This package is an installable **plugin** for omp/Pi and Claude Code. Skills stay `do-*` on disk. omp exposes them as `/skill:do-…`. Claude Code exposes them as `/pstack:do-*`. Sticky `/poteto-mode` is the omp factory command.

It is not the Cursor plugin and not an official Cursor port.

## What pstack is

pstack is a Cursor-verified plugin of Lauren Tan ([@poteto](https://x.com/poteto)) skills.

- Source (a folder in `cursor/plugins`, not a standalone repo): https://github.com/cursor/plugins/tree/main/pstack
- Product README: https://github.com/cursor/plugins/blob/main/pstack/README.md
- User guide: https://github.com/cursor/plugins/blob/main/pstack/docs/guide/README.md

Those pages are the Cursor product. This README does not retell them.

## Docs

- [The pstack guide](./docs/guide/README.md) — original numbered product tutorial (setup through recipes, plus images). On-disk skill links use `skills/do-*`. omp slash skills are `/skill:do-…`. Claude slash skills are `/pstack:do-*`. `/poteto-mode` stays unprefixed on omp.

## Automations

pstack also ships a dormant [benny automation pack](./automations/benny/). Benny triages Slack issue reports, then reproduces and fixes confirmed bugs with real UI evidence. Its files are **not** slash skills. Sibling `skills/` at the package root is the only skill tree; do not add a second one.

Setup starts at [`automations/benny/FOR_AGENTS.md`](./automations/benny/FOR_AGENTS.md). That README records the Cursor Automations host vs what omp can run.

## Load this plugin

GitHub install. No clone required.

### omp

```
omp plugin marketplace add edheltzel/Do-Pstack
omp plugin install pstack@pstack
```

This checkout: `omp plugin link ./`. Confirm with `omp plugin list`. Prove with `omp plugin doctor`.

Do not copy only `pstack.ts` into `~/.omp/agent/extensions/`. Catalog is `.claude-plugin/marketplace.json` (omp reads that fallback). Do not add `.omp-plugin/`.

omp docs: https://omp.sh/docs/plugins

### Pi

```
pi install git:github.com/edheltzel/Do-Pstack
```

This checkout: `pi install ./`. List with `pi list`. Docs: https://pi.dev/docs/latest/packages#install-and-manage

Do not use `pi -e` as the install path.

### Claude Code

This checkout is the plugin root: `.claude-plugin/plugin.json` plus `skills/` and `agents/` beside it (not inside `.claude-plugin/`).

From the package root, add this repo as a marketplace and install:

```
claude plugin marketplace add /absolute/path/to/Do-Pstack
claude plugin install pstack@pstack
```

From GitHub: `claude plugin marketplace add edheltzel/Do-Pstack` then `claude plugin install pstack@pstack`.

This session only (no install record):

```
claude --plugin-dir ./
```

Claude slash skills are namespaced: `/pstack:do-how`, `/pstack:do-poteto-mode`. Validate the layout with `claude plugin validate .`. Sticky `/poteto-mode` is omp-only; on Claude run `/pstack:do-poteto-mode`.

Claude plugin docs: https://code.claude.com/docs/en/plugins.

## First steps

1. Install the host (omp from https://omp.sh, Pi, or Claude Code).
2. Load this plugin (see Load this plugin).
3. On omp: `/poteto-mode` — enable sticky Poteto Mode for this conversation. Optional task arguments are passed through; this also sends `/skill:do-poteto-mode`. On Claude: `/pstack:do-poteto-mode`.
4. Work as usual. On omp, resume an on conversation and it stays on. `/new` starts off.
5. `/poteto-mode off` (aliases: `disable`, `stop`) — disable this omp conversation.

If Poteto Mode was never turned on in this omp conversation, it is off. Mode is per conversation, not process-wide.

The TUI status reads `pstack: poteto mode` when on. Other omp surfaces may not show it.

## Commands

| Command | What it does |
|---|---|
| `/poteto-mode` | omp factory: enable sticky Poteto Mode for this conversation. Also sends `/skill:do-poteto-mode`. |
| `/poteto-mode off` | Disable this omp conversation. Aliases: `disable`, `stop`. |

That is the live omp extension command. It stays unprefixed. There is no worktree command. No `hooks/` tree. No `src/` tree. No Cursor marketplace APIs. Do not ship `commands/poteto-mode.md`.

## Poteto Mode (this extension)

- On omp, enable sends `/skill:do-poteto-mode`. The `/skill:do-poteto-mode` input hook also persists enabled.
- Stored as a custom `pstack-mode` entry on that conversation’s session jsonl. Last `{enabled}` wins. Missing means off.
- `session_start` re-reads the jsonl. `new_session` / `/new` starts off. Resume of an on conversation stays on.
- When on, a prompt needle prepends “Pstack Poteto Mode is on…”
- The TUI status reads `pstack: poteto mode` when on.
- Off aliases: `off`, `disable`, `stop`.
- No Cursor marketplace APIs. No `models.json` writer. No `hooks/` or `src/` tree.

## Update official skills

Official skills come from the Cursor pstack folder in [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack), not from `backnotprop/pstack` and not from skills.sh. From this package root:

```
npm run sync
```

Same command: `node scripts/pstack.mjs sync`. Dry-run: `npm run sync -- --dry-run`.

That pulls `pstack/skills/<name>` from `cursor/plugins` into the existing `skills/do-*` tree (YAML `name` gets the `do-` prefix). It does not create a second skill tree or install into agent skill directories. Diverged local omp forks stay unless you pass `--force`. This fork keeps `playbooks/shipping.md` deleted.

## Skills

Files under `skills/` are markdown prompts. They are not live omp functions or CLIs.

- omp, after marketplace install or `omp plugin link ./`: `/skill:do-<name>`
- Pi, after `pi install`: skills from `skills/`
- Claude Code, after plugin install: `/pstack:do-<name>`

Examples: `/skill:do-create-verification-skill` (Claude: `/pstack:do-create-verification-skill`), `/skill:do-swarm`, `/skill:do-principle-build-the-lever`. Feature Map is a section in `do-create-verification-skill`, not a runner. Do not treat Feature Map, swarm, or Build the Lever as functions or CLIs.

## License

MIT. omp is also MIT ([license](https://github.com/can1357/oh-my-pi/blob/main/LICENSE)).
