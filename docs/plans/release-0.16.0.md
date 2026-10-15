## Breaking: skill prefix is now `ps-`

Every pstack skill moved from `do-<name>` to `ps-<name>`. The `ps-` prefix is the product namespace, so pstack skills no longer share a prefix with personal `do-*` skill packs.

| Host | Old | New |
|---|---|---|
| omp / pi | `/skill:do-<name>` | `/skill:ps-<name>` |
| Claude Code | `/pstack:do-<name>` | `/pstack:ps-<name>` |
| On disk | `skills/do-<name>/` | `skills/ps-<name>/` |

Examples: `/skill:do-how` → `/skill:ps-how`, `/pstack:do-poteto-mode` → `/pstack:ps-poteto-mode`.

Unchanged: sticky `/poteto-mode` on omp.

No aliases. Update saved prompts, notes, and scripts that call `do-` names.

To upgrade: `omp plugin install pstack@pstack`, `pi install git:github.com/edheltzel/Do-Pstack`, or `claude plugin install pstack@pstack`.
