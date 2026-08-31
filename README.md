# pstack

pstack is the omp (Oh My Pi) plugin that puts sticky Poteto Mode and named roles in omp. It is not the Cursor pstack plugin.

Use it when you already work in omp and want Poteto Mode to stay on for that session, plus roles you persist through omp itself.

## Why

omp sessions start without a working mode. pstack turns Poteto Mode on for one conversation and keeps it on until you turn it off or start a new one. It lists how plugin agents map to `@role` aliases without writing your omp config.

Any machine that runs omp can load it. It is not a Cursor-only plugin, not a host or IdP kit, and not a process-wide switch.

## Install

Clone this repository to any path. From that clone, load it as an omp plugin:

```sh
omp plugin install .
```

That is omp's local-folder install. There is no required plugin directory and no one-machine layout. `package.json` `omp.extensions` points at the one factory, `./extensions/pstack.ts`. Restart omp after a factory change.

First omp session: [Getting started](docs/getting-started.md).

Static evals (CI; no omp) live in [e2e/README.md](e2e/README.md).

## License

pstack is [MIT](LICENSE). Copyright the pstack contributors.

OMP (Oh My Pi) is MIT ([LICENSE](https://github.com/can1357/oh-my-pi/blob/main/LICENSE), [README](https://github.com/can1357/oh-my-pi/blob/main/README.md#license)). Upstream Pi is MIT ([LICENSE](https://github.com/badlogic/pi-mono/blob/main/LICENSE)). This plugin adapts those two projects; their licenses are preserved. OMP vendored crates stay on their own terms (`THIRD-PARTY-NOTICES.txt` in oh-my-pi).

See [NOTICE](NOTICE).
