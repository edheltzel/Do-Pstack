# pstack

pstack is an [omp (Oh My Pi)](https://github.com/can1357/oh-my-pi) plugin that puts sticky Poteto Mode and named model roles on an omp conversation.

Use this repo when you work in omp and want that workflow there. First run: [Getting started](docs/getting-started.md).

## Original plugin and this repo

The original pstack is Lauren Tan's ([@poteto](https://x.com/poteto)) Cursor plugin:

- Marketplace: https://cursor.com/marketplace/cursor/pstack
- Source: https://github.com/cursor/plugins/tree/main/pstack
- Cursor install: `/add-plugin pstack`

This repository is not that plugin. It is the omp port: one plugin this repo builds, running on omp as the harness (`omp.extensions` / `pi.extensions`). Do not install this tree with `/add-plugin pstack`; that command installs the Cursor original.

## Usage

### Poteto Mode

- `/poteto-mode` turns sticky Poteto Mode on for this conversation.
- `/poteto-mode off` turns it off.
- `/new` starts off.
- Resume an on conversation and it stays on.
- Mode is per conversation, not process-wide. If Poteto Mode was never turned on in this conversation, it is off.

The TUI can show a status chip. Other omp surfaces may not.

### Roles

`/setup-pstack` lists `modelRoles` and the `@role` names from `agents/*.md`. It does not write omp `config.yml`, `models.json`, or Cursor rules. (The Cursor original's `/setup-pstack` does write a Cursor rule. This plugin does not.)

## Install

From a clone of this repository, with omp already installed:

```bash
omp plugin install .
```

Then follow [Getting started](docs/getting-started.md) for the first on / sticky / roles / off pass.

## License

MIT. The omp harness ([Oh My Pi](https://github.com/can1357/oh-my-pi)) is MIT. Upstream Pi is MIT. See `LICENSE` and `NOTICE`.
