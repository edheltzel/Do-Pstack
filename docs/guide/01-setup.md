# Set up pstack

In this tutorial we'll install the plugin on omp, pick models, and run one small task.

## Prerequisites

- omp from https://omp.sh
- A project you can edit

We'll use omp for the rest of this guide. Pi and Claude Code load the same plugin. Their install commands are at the end.

## Step 1: Install the plugin

Run:

```text
omp plugin marketplace add edheltzel/Do-Pstack
omp plugin install pstack@pstack
```

You should see `pstack` in `omp plugin list`. Prove it with `omp plugin doctor`.

This checkout, from the package root:

```text
omp plugin link ./
```

Cursor used `/add-plugin pstack`. That is old. The catalog is `.claude-plugin/marketplace.json`.

## Step 2: Pick your models

Start omp in the project and run:

```text
/skill:do-setup-pstack
```

You should see each plugin agent and the `@role` it uses. Routing lives in `/model` Roles and each agent's `model: "@role"` line, or an override in `/agents`. The skill writes nothing. Run it again to re-list.

To change a concrete model for a role, open `/model` then Roles. To put one agent on a different role, open `/agents` and override that agent. New `task` calls pick it up.

One agent definition cannot run N models in parallel. Diversity is prompt, path, or a model override in `/agents`.

On Claude Code the same skill is [`/pstack:do-setup-pstack`](../../skills/do-setup-pstack/SKILL.md).

## Step 3: The verification offer

At the end of setup, `/skill:do-setup-pstack` looks for a way to prove app behavior: a `verify-*` skill or an existing harness. If it finds neither, it offers once to generate one with [`/skill:do-create-verification-skill`](../../skills/do-create-verification-skill/SKILL.md).

Say yes and it writes `.cursor/skills/verify-<app>/`, a project-local skill that teaches agents to drive your app the way a user does. It proves the skill once before handing it over. Say no and setup moves on. You can run `/skill:do-create-verification-skill` any time. [Verify and ship](./06-verify-and-ship.md#create-a-project-verification-skill) covers when that earns its place.

## Step 4: Run your first task

Pick something real but small. Describe it the way you'd describe it to a colleague:

```text
/poteto-mode add a --json flag to this command. text output stays byte-identical. verify both.
```

You should see a todo list. The first item is "read the Principles section." The rest are Feature playbook steps. If `/poteto-mode` skips a step, the step stays in the list with `skip: <reason>`.

Type normal follow-ups after that. On omp, `/poteto-mode` stays on for this conversation until you turn it off.

On Claude Code, start with `/pstack:do-poteto-mode` instead of the omp factory `/poteto-mode`.

## Other hosts

Pi:

```text
pi install git:github.com/edheltzel/Do-Pstack
```

This checkout: `pi install ./`. List with `pi list`.

Claude Code, from the package root:

```text
claude plugin marketplace add /absolute/path/to/this-checkout
claude plugin install pstack@pstack
```

This session only: `claude --plugin-dir ./`. Validate with `claude plugin validate .`. Skills show as `/pstack:do-*`.

The Claude catalog is `.claude-plugin/marketplace.json`. Skills stay at the plugin root (`skills/do-*/SKILL.md`), not inside `.claude-plugin/`.

## What you've learned

You installed pstack, listed model roles, and ran one `/poteto-mode` task.

Next: [Route work through `/poteto-mode`](./02-poteto-mode.md).
