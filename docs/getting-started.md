# Getting started

This package is an installable omp **plugin**. From the package root, one-time `omp plugin link ./`. Same map as the [README](../README.md).

Later sessions (any cwd): start `omp`, type `/` (`/skill:ps-…`, sticky `/poteto-mode`). Sibling `skills/` at the package root is what omp auto-discovers after link.

`omp -e ./extensions/pstack.ts` is a one-off test only. Keep `.omp/skills` → `../skills` so that one-off still injects.

It is not `/add-plugin pstack` (that is Cursor). It is not the Cursor plugin and not an official Cursor port.

1. Install omp from https://omp.sh (`curl -fsSL https://omp.sh/install | sh`).
2. Clone this repository and, from the package root, link once. Later sessions (any cwd): type `/` (`/skill:ps-…`, sticky `/poteto-mode`):

```
git clone https://github.com/edheltzel/pstack.git
cd pstack
omp plugin link ./
```

Confirm with `omp plugin list`. Later sessions (any cwd): start `omp` and type `/`.

For a one-off test only (does not persist the plugin):

```
omp -e ./extensions/pstack.ts
```

That one-off still injects `/skill:ps-…` because `.omp/skills` → `../skills`. Do not use `/add-plugin pstack`.

3. `/poteto-mode` — enable sticky Poteto Mode for this conversation. The slash command is unprefixed. Enable sends `/skill:ps-poteto-mode`. Aliases for off: `off`, `disable`, `stop`.
4. `session_start` re-reads the session jsonl. `new_session` / `/new` starts off. Resume an on conversation and it stays on. If Poteto Mode was never turned on in this conversation, it is off.

When on, a prompt needle prepends “Pstack Poteto Mode is on…”. The TUI status reads `pstack: poteto mode`.

Skills under `skills/` are markdown `/skill:ps-<name>` prompts, not functions. They list and inject after `omp plugin link ./`. Examples: `/skill:ps-create-verification-skill`, `/skill:ps-swarm`, `/skill:ps-principle-build-the-lever`. Feature Map is a section in `ps-create-verification-skill`, not a runner.

The original numbered product tutorial is [the pstack guide](./guide/README.md). This page stays the omp first-run.
