```
██████╗ ███████╗████████╗ █████╗  ██████╗██╗  ██╗
██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
██████╔╝███████╗   ██║   ███████║██║     █████╔╝
██╔═══╝ ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
██║     ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
╚═╝     ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
```

# Do Pstack

This is a native plugin for Oh-My-Pi but has support for Pi and Claude Code.

All skills follow the `do-*` namespace, from my [Do-Skills repo](https://github.com/edheltzel/Do-Skills). You might hate it 😬.

## What pstack is

pstack is a Cursor plugin by Lauren Tan ([@poteto](https://x.com/poteto)). See [Curor's repo](https://github.com/cursor/plugins/tree/main/pstack) for more info.

## Docs

- [The pstack guide](./docs/guide/README.md) — original numbered product tutorial (setup through recipes, plus images).

**pi** skill use `skills/do-*`. **omp** skills are `/skill:do-…`. **claude** skills are `/pstack:do-*`. `/poteto-mode` stays unprefixed on omp, becuase it is a native plugin.

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

This checkout: `omp plugin link ./`

### Pi

```
pi install git:github.com/edheltzel/Do-Pstack
```

This checkout: `pi install ./`

### Claude Code

```
claude plugin marketplace add /absolute/path/to/Do-Pstack
claude plugin install pstack@pstack
```

```
claude plugin marketplace add edheltzel/Do-Pstack
claude plugin install pstack@pstack
```

This session only: `claude --plugin-dir ./`

Claude slash skills are namespaced: `/pstack:do-how`, `/pstack:do-poteto-mode`. Validate the layout with `claude plugin validate .`. Sticky `/poteto-mode` is omp-only; on Claude run `/pstack:do-poteto-mode`.

## Usage

1. On omp: `/poteto-mode` — enable sticky Poteto Mode for this conversation. Optional task arguments are passed through; this also sends `/skill:do-poteto-mode`.
2. Do your thing as usual. Just with pstack's flow and skills

- `/poteto-mode` is persistent in omp with you execute `/new` or when you resume a conversation.

3. `/poteto-mode off` (aliases: `disable`, `stop`)

`/poteto-mode` is off by default

please note: omp's TUI shows `🍠 poteto: ✓ on` when enabled.

## Commands

| Command            | What it does                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| `/poteto-mode`     | omp factory: enable sticky Poteto Mode for this conversation. Also sends `/skill:do-poteto-mode`. |
| `/poteto-mode off` | Disable this omp conversation. Aliases: `disable`, `stop`.                                        |

That is the live omp extension command. It stays unprefixed. There is no worktree command. No `hooks/` tree. No `src/` tree. No Cursor marketplace APIs. Do not ship `commands/poteto-mode.md`.

## Poteto Mode (this extension)

- On omp, enable sends `/skill:do-poteto-mode`. The `/skill:do-poteto-mode` input hook also persists enabled.
- Stored as a custom `pstack-mode` entry on that conversation’s session jsonl. Last `{enabled}` wins. Missing means off.
- `session_start` re-reads the jsonl. `new_session` / `/new` starts off. Resume of an on conversation stays on.
- When on, a prompt needle prepends “Pstack Poteto Mode is on…”
- The TUI status reads `🍠 poteto: ✓ on` when on.
- Off aliases: `off`, `disable`, `stop`.

## Update official skills

Official skills come from the Cursor pstack folder in [cursor/plugins](https://github.com/cursor/plugins/tree/main/pstack):

```
npm run sync
```

Same command: `node scripts/pstack.mjs sync`.
Dry-run: `npm run sync -- --dry-run`.

That pulls `pstack/skills/<name>` from `cursor/plugins` into the existing `skills/do-*` tree (YAML `name` gets the `do-` prefix). It does not create a second skill tree or install into agent skill directories.

After a feature or this sync, bump versions the same way:

```
npm run bump -- patch
npm run bump -- minor
npm run bump -- major
```

That updates `package.json` (omp plugin + pi extension) and `.claude-plugin/plugin.json` together. Dry-run: `npm run bump -- patch --dry-run`. After those files are committed: `npm run bump -- --tag` (tags HEAD) then `npm run bump -- --release` (push tag + `gh release create --target <sha>`). Do not combine patch and --tag in one run.

## License

I just follow omp's license but i think I need to do that?
omp is also MIT ([license](https://github.com/can1357/oh-my-pi/blob/main/LICENSE)).
