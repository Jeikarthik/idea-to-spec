# CLI reference

Everything the skills do deterministically is in one dependency-free CLI. Skills call it; it never
invents content.

```
node "<plugin>/scripts/backbone.js" <command> [args] [--project <dir>]
```

| Command | What it does |
|---|---|
| `triage --timeframe … --team <n> --client yes\|no --judged yes\|no` | Classify a tier from the four intake answers |
| `init --tier T# --mode greenfield\|bootstrap --project-name <name> --reason <text>` | Create `state.md` and the decision log |
| `retier --tier T# --reason <text>` | Re-triage after an explicit scope change |
| `plan [--tier T#]` | The stage/framework matrix for a tier |
| `scaffold <document> [--name <n>] [--force]` | Create a document from its template (tier-checked) |
| `status [--json]` / `next [--json]` | Full project state / the next stage to run |
| `stage <id> <status> [--note …] [--override DL-###]` | Set a stage's status (enforced closures — see [stages.md](stages.md)) |
| `ship [--date YYYY-MM-DD]` / `feedback-due` | Record the ship date / is a feedback checkpoint due? |
| `scan` | What the repo legitimately shows (bootstrap mode) |
| `modules` | Validate the module map; print dependency order and readiness |
| `claim <module> --owner <o>` / `release <module>` | Claim or release a module |
| `verify <module>` / `verify --wp <id\|all>` `[--confirm-manual]` | Run verification gates |
| `cvs [--write]` | Compute the Customer Validation Score |
| `check` | Document lint: sign-offs, gates, module map, design tokens, security, release, `.env.example` secrets |
| `tokens [--tier T#] [--json]` | Validate `design.md` tokens and print the WCAG contrast table |
| `tokens --css <file>` | Export tokens as CSS custom properties (light + dark) |
| `tokens --audit <path>…` | Fail on colour literals that bypass the tokens |
| `disable [--global] [--days <n>] [--reason …]` / `enable [--global]` / `switch` | The stop switch |

Documents `scaffold` knows: `brief, problem, validation, canvas, discovery-tree, viability, retention,
risks, design, security, test-strategy, release, packaging, feedback-log, decision-log, master-prd,
architecture, work-packages, module, prerequisites, env-example, migration, speckit-constitution,
speckit-spec, bmad-brief, dispatch`.

## Environment

| Variable | Effect |
|---|---|
| `BACKBONE_DOCS_DIR` | Documents directory inside the project (default `backbone/`) |
| `BACKBONE_DISABLE=1` | Turn Backbone off for this process |
| `BACKBONE_HOME` | Where the global stop switch lives (default `~/.claude/backbone`) |
| `BACKBONE_RUN_GATES=0` | Do not run gates automatically when a subagent stops |
| `BACKBONE_GATE_TIMEOUT_SEC` | Per-gate timeout (default 300) |
| `BACKBONE_GATE_MAX_BLOCKS` | How many times SubagentStop sends a failing agent back (default 2) |

Exit codes: `0` success, `1` a check or gate failed, `2` usage error or a refused stage closure.
