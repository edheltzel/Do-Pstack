# The pstack guide

In this tutorial we'll run pstack on a real task. First-run is the [README](../../README.md). Install with omp `pstack@pstack`, `pi install git:github.com/edheltzel/Do-Pstack`, or Claude `claude plugin install pstack@pstack`. On-disk skills are `skills/do-*`. omp slash skills are `/skill:do-…`. Claude slash skills are `/pstack:do-*`. `/poteto-mode` stays unprefixed on omp.

Give a goal and a way to check it, in your own words. `/poteto-mode` picks the playbook, runs the other skills, and shows the evidence.

Read these pages in order the first time. After that, each page stands alone.

1. [Set up pstack](./01-setup.md). Install the plugin and pick your models.
2. [Route work through `/poteto-mode`](./02-poteto-mode.md). Give it a goal and watch it pick a playbook.
3. [Understand the code](./03-understand.md). `/how`, `/why`, `/teach`, and `/recall` before you edit.
4. [Design the change](./04-design.md). `/architect`, `/arena`, `/swarm`, and `/interrogate` before code locks a shape.
5. [Build and clean the change](./05-build-and-clean.md). The build playbooks, `/tdd`, `/unslop`, and `/no-comments`.
6. [Verify and ship](./06-verify-and-ship.md). Prove behavior on the real app, then open a focused PR.
7. [Run work while you sleep](./07-overnight.md). A finish condition, a decision log, and playbooks that scale past one agent.
8. [Steer with principle names](./08-principles.md). The 21 names that redirect an agent mid-task.
9. [Make it yours](./09-make-it-yours.md). Your own mode, plus how to test a skill change.
10. [Recipes and pitfalls](./10-recipes-and-pitfalls.md). Prompts to copy and mistakes to skip.

## If you only remember one thing

Type this in a repo you can edit:

```text
/poteto-mode the export writes duplicate rows when a retry lands mid-run. repro first, then fix and verify.
```

You should see a todo list. The first item is "read the Principles section." The rest are Bug fix steps. You do not name a playbook or list skills. "repro first" and a checkable outcome are enough.

Next: [Set up pstack](./01-setup.md).
