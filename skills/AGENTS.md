# skills

## Purpose

pstack skill tree. Sibling `skills/` at the package root is what omp auto-discovers after `omp plugin link ./`. Do not add a second skills tree.

## Ownership

- `*/SKILL.md` plus that skill's references, playbooks, and scripts.

## Local Contracts

- Skill directories and YAML `name` use the `do-` prefix. After `omp plugin link ./`, the live slash is `/skill:do-<name>`.
- Every `SKILL.md` has YAML frontmatter with non-empty `name` and `description`.
- `python3 e2e/ci_static.py --frontmatter` is the gate.

## Work Guidance

Keep leaf skills operational. Do not add a per-skill AGENTS.md unless a skill becomes its own durable boundary.

## Verification

```bash
python3 e2e/ci_static.py --frontmatter
```

## Child DOX Index

None. One contract covers the tree.
