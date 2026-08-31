# Getting started

Same map as the [README](../README.md). This repo is an omp plugin that loads pstack skills from this tree. It is not the Cursor plugin and not an official Cursor port.

1. Install omp from https://omp.sh (`curl -fsSL https://omp.sh/install | sh`).
2. Clone this repository, then open omp in that directory so it loads `extensions/pstack.ts`:

```
git clone https://github.com/edheltzel/pstack.git
cd pstack
omp
```

There is no `omp plugin install` or `omp add` in this repo. Do not use `/add-plugin pstack` (that is Cursor). `.omp-plugin/marketplace.json` is `source: ./` with no CLI next to it.

3. `/setup-pstack` — lists `@role` maps. Does not write `config.yml` or `models.json`.
4. `/poteto-mode` — enable sticky Poteto Mode for this conversation. Enable sends `/skill:poteto-mode`. Aliases for off: `off`, `disable`, `stop`.
5. `session_start` re-reads the session jsonl. `new_session` / `/new` starts off. Resume an on conversation and it stays on. If Poteto Mode was never turned on in this conversation, it is off.

When on, a prompt needle prepends “Pstack Poteto Mode is on…”. The TUI status reads `pstack: poteto mode`.
