# Getting started

Same map as the [README](../README.md). This repo is not the Cursor plugin, not an official Cursor port, and not an `omp plugin list` plugin.

1. Install omp from https://omp.sh (`curl -fsSL https://omp.sh/install | sh`).
2. Clone this repository and start omp with the extension file. That is how `/poteto-mode` is live:

```
git clone https://github.com/edheltzel/pstack.git
cd pstack
omp -e ./extensions/pstack.ts
```

`cd pstack && omp` without `-e` does not load this tree. There is no `omp plugin install` or `omp add` in this repo. Do not use `/add-plugin pstack` (that is Cursor). `.omp-plugin/marketplace.json` is `source: ./` and does not put this on `omp plugin list`.

3. `/poteto-mode` — enable sticky Poteto Mode for this conversation. Enable sends `/skill:poteto-mode`. Aliases for off: `off`, `disable`, `stop`.
4. `session_start` re-reads the session jsonl. `new_session` / `/new` starts off. Resume an on conversation and it stays on. If Poteto Mode was never turned on in this conversation, it is off.

When on, a prompt needle prepends “Pstack Poteto Mode is on…”. The TUI status reads `pstack: poteto mode`.

Skills under `skills/` are markdown `/skill:` prompts, not functions. `/skill:create-verification-skill`, `/skill:swarm`, and `/skill:principle-build-the-lever` are prompts. Feature Map is a section in `create-verification-skill`, not a runner.
