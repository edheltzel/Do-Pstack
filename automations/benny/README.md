# benny

benny gives you two automations for slack issue reports. one triages each report. the other reproduces confirmed bugs and may prepare a small draft fix.

the files in this directory are dormant setup and automation sources. they do not appear as slash skills. do not add them to `package.json` `omp.skills` or expect `/skill:ps-setup-benny`.

## HOST GAP

Cursor Automations is the original host: Slack-triggered, always-on runs created with Cursor's built-in `/automate` skill, edited in the Automations editor, bound to a source Slack channel, with live prompts that read committed files under `.cursor/automations/benny/`.

omp has no equivalent Slack-triggered automation host. omp can load this pack as files, copy it into a consuming repo, and run the operational `SKILL.md` files in a live `omp -e ./extensions/pstack.ts` session. omp also has session events, `/loop` heartbeats, extension timers, and hooks. none of those subscribe to a Slack channel and start an agent on a new top-level report.

on omp, paste a slack report (or point the agent at this pack) and follow [`FOR_AGENTS.md`](./FOR_AGENTS.md) plus the operational files. unattended Slack-triggered runs still need Cursor Automations or an operator-hosted Slack listener. this extension does not add a Slack poller to the one factory.

## set it up (Cursor Automations)

keep this path when the consuming repo still uses Cursor:

1. point cursor at [`FOR_AGENTS.md`](./FOR_AGENTS.md) and name the target repository.
2. let setup merge this whole directory into the target at `.cursor/automations/benny/`. it must preserve destination-only files and review conflicts instead of overwriting local edits.
3. let setup enable pstack in the target repository's `.cursor/settings.json` for shared dependencies:

```json
{
	"plugins": {
		"pstack": { "enabled": true }
	}
}
```

4. keep user-owned configuration outside the copied pack, for example in `.cursor/benny/`. adapt [`configuration.example.yaml`](./templates/configuration.example.yaml) and [`feature-map.example.md`](./skills/reproduce-and-fix-issues/references/feature-map.example.md).
5. commit `.cursor/settings.json`, `.cursor/automations/benny/`, and any secret-free configuration before enabling either automation.
6. review each new automation draft or update existing automations in their editors. then send a harmless test report and verify every source-channel post stays in the original thread.

## set it up (omp)

1. start omp with this tree: `omp -e ./extensions/pstack.ts`.
2. point the agent at [`FOR_AGENTS.md`](./FOR_AGENTS.md) and name the target repository.
3. merge this whole directory into the target at `.cursor/automations/benny/` (same destination as Cursor, so a later Cursor Automations host can pick it up) or keep using this in-repo pack.
4. preserve destination-only files and review conflicts. keep user-owned configuration outside the pack, for example `.cursor/benny/` or `.omp/benny/`.
5. shared pstack skills on omp are `/skill:ps-how`, `/skill:ps-why`, `/skill:ps-tdd`, `/skill:ps-unslop`, and the `ps-principle-*` skills. they load from this clone via `package.json` `omp.skills` / `.omp/skills`. do not register benny `SKILL.md` files as slash skills.
6. there is no `/automate` and no Automations editor. after the pack and secret-free config are committed, run `skills/triage-issue-reports/SKILL.md` and `skills/reproduce-and-fix-issues/SKILL.md` directly in an omp session when a report arrives.
