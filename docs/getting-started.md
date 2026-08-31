# Getting started

This tree is an omp **extension**. Load it with `omp -e ./extensions/pstack.ts`. Same map as the [README](../README.md).

That command is how `/poteto-mode` and `/skill:ps-…` are live. Skills come from this clone via `.omp/skills` → `../skills`. `--plugin-dir .` is optional, not the first command.

It is not an `omp plugin list` plugin. It is not `omp plugin install`. It is not `/add-plugin pstack` (that is Cursor). It is not the Cursor plugin and not an official Cursor port.

1. Install omp from https://omp.sh (`curl -fsSL https://omp.sh/install | sh`).
2. Clone this repository and start omp with the extension file. That is how `/poteto-mode` and `/skill:ps-…` are live:

```
git clone https://github.com/edheltzel/pstack.git
cd pstack
omp -e ./extensions/pstack.ts
```

`cd pstack && omp` without `-e` does not load this tree. There is no `omp plugin install` or `omp add` in this repo. Do not use `/add-plugin pstack`. `.omp-plugin/marketplace.json` is `source: ./` and does not put this on `omp plugin list`.

3. `/poteto-mode` — enable sticky Poteto Mode for this conversation. The slash command is unprefixed. Enable sends `/skill:ps-poteto-mode`. Aliases for off: `off`, `disable`, `stop`.
4. `session_start` re-reads the session jsonl. `new_session` / `/new` starts off. Resume an on conversation and it stays on. If Poteto Mode was never turned on in this conversation, it is off.

When on, a prompt needle prepends “Pstack Poteto Mode is on…”. The TUI status reads `pstack: poteto mode`.

Skills under `skills/` are markdown `/skill:ps-<name>` prompts, not functions. They list and inject on the `-e` command above. Examples: `/skill:ps-create-verification-skill`, `/skill:ps-swarm`, `/skill:ps-principle-build-the-lever`. Feature Map is a section in `ps-create-verification-skill`, not a runner.
