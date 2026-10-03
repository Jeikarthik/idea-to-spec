# Backbone

An adaptive orchestration plugin for coding agents. It takes an idea from "vague thought" to
"implementation-ready spec + locked engineering artifacts", scaling its depth to the context —
hackathon, solo long-term build, small-team build, or a real-world solution for a client.

**What it is not:** a reimplementation of Lean Canvas, JTBD, MoSCoW, the Hook Model, RICE, Spec Kit or
BMAD. Those are mature and already exist. Backbone's job is the orchestration logic — deciding *which*
of them fire, *how deep*, *in what order*, for a given context — plus the artifacts nobody currently
produces: a locked, parallel-safe engineering handoff, and a genuine feedback loop back into the process
after ship.

---

## Install

```
/plugin marketplace add /path/to/backbone      # or: /plugin marketplace add <you>/backbone
/plugin install backbone@backbone
```

Requires Node 18+ (already present wherever Claude Code runs). No dependencies.

## Start

Open a project and describe an idea, or run `/backbone-plan`. On a fresh session Backbone tells you
where the project stands:

- **No `state.md`, empty repo** → greenfield intake (`backbone:triage`).
- **No `state.md`, code already there** → bootstrap mode: it reads the repo, reconstructs what it can,
  and asks you directly for what source code cannot tell it.
- **`state.md` present** → it resumes at the next stage, with any live module claims.

## Turning it off

Backbone is on by default and does everything above without being asked. Stopping it is always
voluntary and always one step:

| You want | Do this |
|---|---|
| Off in this project | `/backbone-off` (or just tell Claude "stop Backbone") |
| Off everywhere on this machine | `/backbone-off --global` |
| A break that ends by itself | `/backbone-off --days 7` |
| Back on | `/backbone-on` (`--global` for the global switch) |
| Off for one shell or CI run | `BACKBONE_DISABLE=1` |

Switching off stops the session guidance, the feedback nudge, automatic claims and automatic gate runs
immediately. It never deletes anything; `backbone/` stays as it was, ready for when you switch back on.
`switch` shows which switch, if any, is keeping it off. To remove it completely, use `/plugin disable backbone`.

## Depth tiers

Triage happens once, from four questions: timeframe, team size, is there a real external
stakeholder, is this being judged or pitched.

| Tier | Timeframe | Typical output | Ceremony |
|---|---|---|---|
| **T1 — Hackathon/buildathon** | Hours | One-page opportunity statement, working demo, pitch | Near zero |
| **T2 — Solo long-term** | Weeks–months | Validated concept, locked scope, DB+env+guide | Light, self-paced |
| **T3 — Small team** | Weeks–months | Full validation set, module PRDs, shared docs | Medium |
| **T4 — Client/industry** | Months+ | Sourced market sizing, stakeholder-mapped, compliance-aware | Full |

Depth is threaded through *every* stage, including the execution handoff — not just the front-end
validation, which is where most tools quietly stop being adaptive. At T1, seven of the fourteen stages
do not run at all.

Re-triage only on an explicit scope change (`retier`): finished work is kept, stages that were done at a
shallower depth are flagged `rework`, and newly applicable stages reopen.

## Stages

`/backbone-plan` prints the live matrix for your tier — which frameworks fire, at what depth, and which
are deliberately skipped.

| # | Stage | Skill | T1 | T2 | T3 | T4 |
|---|---|---|---|---|---|---|
| 0 | Intake & Triage | `triage` | ● | ● | ● | ● |
| 1 | Problem Identification | `problem-framing` | ● | ● | ● | ● |
| 2 | Proactive/Competitive Research | `competitive-research` | ● | ● | ● | ● |
| 3 | Challenge & Validation | `validation-composer` | — | ● | ● | ● |
| 4 | Problem & Solution Framing | `solution-framing` | — | ● | ● | ● |
| 5 | Opportunity Structuring & Prioritization | `opportunity-prioritization` | — | ◐ | ● | ● |
| 6 | Market & Viability | `viability` | — | — | ● | ● |
| 7 | Scope Lock | `scope-lock` | ● | ● | ● | ● |
| 8 | Retention & Engagement | `retention` | — | ● | ● | ● |
| 9 | Technical Feasibility & Architecture | `architecture-composer` | ● | ● | ● | ● |
| 10 | Work Packages & Engineering Handoff | `handoff-generator` | ● | ● | ● | ● |
| 11 | Success Rubric & Evals | `success-rubric` | ● | ● | ● | ● |
| 12 | Packaging | `packaging` | ● | ● | ● | ● |
| 13 | Feedback Loop | `feedback-loop` | — | ◐ | ◐ | ◐ |

● active · ◐ conditional · — skipped at this tier

Plus one cross-cutting skill: **`adversarial-review`**, which runs at every tier before anything is
locked into the master PRD.

## Built-in skepticism

Backbone does not run frameworks passively and hand back whatever they produce.

- **Real pain over theoretical soundness.** A Lean Canvas that reads well is not evidence. In the
  Customer Validation Score, problem frequency and severity carry triple weight, market growth and
  scalability carry single weight, and a high market score beside weak or unevidenced pain is a
  *blocking* flag, not a pass.
- **Problem identification starts from a real situation**, not a market gap. The first question is what
  actually happened, not what market you are targeting.
- **Every AI-generated plan gets an adversarial pass** before it enters `master-prd.md`: weakest
  assumption, most likely failure, at least one alternative framing, and any conflict with earlier
  evidence — then explicit sign-off, logged. `check` fails if a section was locked without one.
- **Push-back is a stage output.** Where a framework's output conflicts with earlier evidence, Backbone
  surfaces the conflict instead of reconciling it into a tidy document.

## Documents

Three tiers of documentation, designed so several agents can work at once.

```
backbone/
├── state.md            tier + per-stage status (machine state in a backbone-state block)
├── brief.md            the one-page opportunity statement
├── problem.md          5W2H, JTBD, HMW, prior art
├── validation.md       Mom Test notes, hypotheses, Customer Validation Score (backbone-cvs block)
├── canvas.md           Value Proposition + Lean Canvas
├── discovery-tree.md   Opportunity Solution Tree — living, with change history
├── viability.md        market type, buyer map, sourced TAM/SAM/SOM, unit economics   (T3+)
├── retention.md        Hook Model, AARRR/HEART, North Star Metric
├── master-prd.md       THE NON-NEGOTIABLES — binding on every agent
├── architecture.md     ADRs, C4, real-vs-stubbed, module map, interface contracts, claim/lock table
├── modules/<name>.md   self-contained per-module PRDs                                 (T3+)
├── work-packages.md    single work-package file                                       (T1/T2)
├── migrations/         ordered, commented SQL                                  (if persistence)
├── prerequisites.md    credentials and setup                             (if external deps)
├── decision-log.md     chronological why-record: adversarial passes, interface freezes, overrides
├── packaging.md        pitch/rubric mapping (T1) or positioning (T2–4)
└── feedback-log.md     dated post-ship entries                                        (T2+)
```

`.env.example` is written at the project root. Set `BACKBONE_DOCS_DIR` to use a directory other than
`backbone/`.

## Parallel agents without collisions

At T3+, `architecture.md` carries a machine-readable module map:

```json
{ "modules": [
  { "name": "auth", "purpose": "sessions", "paths": ["src/auth/**"], "depends_on": ["db"], "interface_frozen": false }
] }
```

- **No two modules may own overlapping paths** — enforced by `backbone.js modules`.
- **`depends_on` must form a DAG**; the CLI prints the topological order, and a module cannot start until
  its dependencies' interfaces are frozen.
- **Claiming is automatic.** Dispatch a subagent with `[bb:auth]` in its description and prompt; the
  `SubagentStart` hook claims the module, injects its boundary and interface rules, and refuses the claim
  if another agent holds it or its dependencies are not frozen.
- **Verification is automatic.** When that agent stops, the `SubagentStop` hook runs the module's gates,
  blocks the stop while they fail (with the failing output, up to a retry limit), and marks the module
  `done` only when they pass.

For the main session or a second terminal, claim manually with `/backbone-claim`.

## Verification gates

Each module PRD or work package ends with an executable block:

````markdown
```backbone-gates
npm test -- tests/auth
npm run lint -- src/auth
manual: a human completes a real login in the browser
```
````

Every acceptance criterion (Given/When/Then) names the gate that verifies it. `manual:` gates can only be
confirmed by a person (`/backbone-verify <module> --confirm-manual`). Nothing is marked done any other
way — not by an agent asserting it, and not by hand.

> **These lines are executed as shell commands** from the project root, by the CLI and by the
> `SubagentStop` hook. Treat a module PRD like a build script: review gates in a repo you did not write.
> Set `BACKBONE_RUN_GATES=0` to disable automatic execution (modules then stay `in-progress` until
> someone runs `verify`).

## Commands

| Command | What it does |
|---|---|
| `/backbone-status` | Tier, stage statuses, next stage, live claims, feedback due |
| `/backbone-plan` | The stage/framework matrix for this tier (or any tier) |
| `/backbone-verify` | Run gates for a module or work package; check the whole project |
| `/backbone-claim` | Claim a module for this session (subagents claim automatically) |
| `/backbone-off` | Stop switch: off for this project, `--global` for every project, `--days <n>` to snooze |
| `/backbone-on` | Turn it back on (`--global` clears the global switch) |

## CLI

Everything the skills do deterministically is in one dependency-free CLI:

```
node "<plugin>/scripts/backbone.js" <command>

triage      classify a tier from timeframe/team/client/judged
init        create state.md and the decision log at a tier
retier      re-triage after an explicit scope change
plan        the stage/framework matrix for a tier
scaffold    create a document from its template (tier-checked)
status      full project state          next        the next stage to run
stage       set a stage's status (enforced for stages 3, 7, 10, 11)
ship        record the ship date        feedback-due  is a checkpoint due?
scan        what the repo legitimately shows (bootstrap mode)
modules     validate the module map; print dependency order and readiness
claim       claim a module              release     release a claim
verify      run verification gates      cvs         compute the Customer Validation Score
check       document lint: sign-offs, gates, module map, .env.example secrets
disable     stop switch: this project, --global for all, --days <n> to snooze (enable reverses it)
switch      is Backbone on or off here, and why
```

Environment: `BACKBONE_DOCS_DIR`, `BACKBONE_DISABLE=1`, `BACKBONE_HOME` (where the global switch lives; default `~/.claude/backbone`), `BACKBONE_RUN_GATES=0`,
`BACKBONE_GATE_TIMEOUT_SEC` (default 300), `BACKBONE_GATE_MAX_BLOCKS` (default 2).

## Compose, don't rebuild

Where these skills are installed, Backbone invokes them and feeds them its inputs; where they are not, it
falls back to a minimal built-in version so it still works standalone.

| Function | Skill/source it leans on |
|---|---|
| Lean Canvas / Lean UX Canvas | `lean-canvas`, `lean-ux-canvas` |
| Opportunity Solution Tree | `opportunity-solution-tree` |
| Prioritization (RICE/ICE/Kano/Opportunity Score) | `prioritization-frameworks` |
| Validation canvas + assumption testing | `validation-canvas`, `riskiest-assumption-test` |
| PRD development | `prd-development` |
| Company/competitor research | `company-research` |
| Execution, low ceremony | GitHub Spec Kit (`/specify → /plan → /tasks → /implement`) |
| Execution, full team simulation | BMAD-Method (Analyst/PM/Architect/SM/Dev/QA, story-sharding) |

What Backbone writes itself: the triage/bootstrap engine, the depth-tier gating logic, the three-tier
documentation generator, the module claim/lock hooks, the verification-gate wiring, and the feedback loop.

## Other harnesses

Claude Code first. The CLI underneath is harness-agnostic — see `adapters/AGENTS.md` for running the same
process from Codex or Cursor, and what you give up without hooks.

## Development

```
npm test        # 58 tests: tier gating, state, module map, claims, gates, CVS, CLI, hooks, stop switch
```

Before publishing: set your real name and repository in `.claude-plugin/plugin.json` and
`marketplace.json`, then `claude plugin validate .`. Push to GitHub so others can
`/plugin marketplace add <you>/backbone`, and submit through the plugin directory form on claude.com to
have it appear in `/plugin → Discover`.

## Using it on your own projects first

Backbone's own build order was MVP-first, and it is worth adopting the same discipline when you extend
it: prove each increment on a real project before adding the next.

1. Triage + bootstrap + Stage 1 + Stage 7 + Stage 10 + T1 packaging — a usable hackathon-day tool.
2. Stage 3 (validation) + Stage 4 (canvases) — extends to solo long-term builds.
3. Stage 5 (OST + prioritization) + Stage 6 (viability) + module split and claim/lock — small-team and
   client depth, and real parallel agents.
4. Stage 8 (retention) + Stage 13 (feedback loop) — closes the loop for anything that ships.

All four increments are implemented here. The sequencing is how to *test* it: run a hackathon project
through T1 before trusting it with a client build at T4.

## License

MIT
