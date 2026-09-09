# Set up pstack

In this page you install the plugin, pick which models pstack uses, and run your first task. Setup is one command plus a short conversation.

## Install the plugin

This package is the plugin root for both hosts. Pick one.

### omp / Pi

From the package root:

```text
omp plugin link ./
```

Confirm with `omp plugin list`. Prove with `omp plugin doctor`.

The Cursor product used `/add-plugin pstack`. That is history, not how you install this package. omp marketplaces are catalogs you add (a git repo with `marketplace.json`); this package is local-link only on omp, not listed in an omp catalog.

### Claude Code

From the package root:

```text
claude plugin marketplace add /absolute/path/to/this-checkout
claude plugin install pstack@pstack
```

Or this session only: `claude --plugin-dir ./`. Validate with `claude plugin validate .`. Skills show as `/pstack:do-*`.

The Claude catalog is `.claude-plugin/marketplace.json`. Skills stay at the plugin root (`skills/do-*/SKILL.md`), not inside `.claude-plugin/`.

## Pick your models

Run:

```text
/skill:do-setup-pstack
```

On Claude Code the same skill is [`/pstack:do-setup-pstack`](../../skills/do-setup-pstack/SKILL.md).

[`/skill:do-setup-pstack`](../../skills/do-setup-pstack/SKILL.md) lists each plugin agent and the `@role` it uses. Routing lives in `/model` → Roles and each agent's `model: "@role"` line, or an override in `/agents`. The skill writes nothing. Re-run it to re-list.

Want a different concrete model for a role? Open `/model` → Roles and change that `@role`. Want one agent on a different role or a concrete selector? Open `/agents` and override that agent. New `task` calls pick it up.

N parallel models is not available from one agent definition. Diversity is prompt, path, or label unless you change that agent's `model` in `/agents`.

## Accept the verification offer, or don't

At the end of setup, `/skill:do-setup-pstack` looks for a way to prove app behavior in your project, either a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/skill:do-create-verification-skill`](../../skills/do-create-verification-skill/SKILL.md).

Say yes and it writes `.cursor/skills/verify-<app>/`, a project-local skill that teaches agents to drive your app the way a user does. It proves the skill works once before handing it over. Say no and setup moves on. You can run `/skill:do-create-verification-skill` yourself any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers when it earns its place.

## Run your first task

Pick something real but small, and describe it the way you'd describe it to a colleague:

```text
/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

On Claude Code, start with `/pstack:do-poteto-mode` instead of the omp factory `/poteto-mode`.

Watch the todo list. The first item is always "read the Principles section". The rest are the matched playbook's steps copied in, the Feature playbook for this prompt. If `/poteto-mode` skips a step, the step stays in the list with `skip: <reason>`, so you can see what it chose not to do.

From here you can type normal follow-ups. On omp, `/poteto-mode` is sticky. It stays on for the conversation until you opt out by saying so.

Next: [Route work through `/poteto-mode`](./02-poteto-mode.md).
