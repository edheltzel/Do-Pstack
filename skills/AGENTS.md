# skills

## Purpose

pstack skill tree loaded via `package.json` `omp.skills`.

## Ownership

- `*/SKILL.md` plus that skill's references, playbooks, and scripts.

## Local Contracts

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
