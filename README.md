# Backbone

An adaptive orchestration plugin for coding agents. It takes an idea from "vague thought" to
"implementation-ready spec + locked engineering artifacts + a shipped, observed product", scaling its
depth to the context — hackathon, solo long-term build, small-team build, or a real-world solution for a
client.

**What it is not:** a reimplementation of Lean Canvas, JTBD, MoSCoW, the Hook Model, RICE, Spec Kit or
BMAD. Those are mature and already exist. Backbone's job is the orchestration logic — deciding *which*
of them fire, *how deep*, *in what order*, for a given context — plus the artifacts nobody currently
produces: a locked design system and a locked, parallel-safe engineering handoff that several agents can
build against at once, and a genuine feedback loop back into the process after ship.

> **See it end to end:** [examples/walkthrough.md](examples/walkthrough.md) follows one project through
> all sixteen stages, with the real commands and what Backbone says back at each step.

---

## Install

```
/plugin marketplace add Jeikarthik/idea-to-spec
/plugin install backbone@backbone
```

Or from a local clone: `/plugin marketplace add /path/to/idea-to-spec`.
Requires Node 18+ (already present wherever Claude Code runs). No dependencies.

## Start

Open a project and describe an idea, or run `/backbone-plan`. You do not invoke stages one by one — on
every session start Backbone reads where the project stands and steers:

- **No `state.md`, empty repo** → greenfield intake (`backbone:triage`).
- **No `state.md`, code already there** → bootstrap mode: it reads the repo, reconstructs what it can,
  and asks you directly for what source code cannot tell it.
- **`state.md` present** → it resumes at the next stage, with any live module claims.

What stays with you, on purpose: answering intake questions, supplying real evidence (user
conversations, sourced numbers), signing off each locked decision, and confirming `manual:` gates.

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
immediately. It never deletes anything; `backbone/` stays as it was. `backbone.js switch` shows which
switch, if any, is keeping it off. To remove it completely, use `/plugin disable backbone`.

## Depth tiers

Triage happens once, from four questions: timeframe, team size, is there a real external
stakeholder, is this being judged or pitched.

| Tier | Timeframe | Typical output | Ceremony |
|---|---|---|---|
| **T1 — Hackathon/buildathon** | Hours | One-page opportunity statement, working demo, pitch | Near zero |
| **T2 — Solo long-term** | Weeks–months | Validated concept, locked scope and design, DB+env+guide, CI + rollback | Light, self-paced |
| **T3 — Small team** | Weeks–months | Full validation set, design system, module PRDs, parallel agents, runbook | Medium |
| **T4 — Client/industry** | Months+ | Sourced market sizing, stakeholder map, compliance mapping, SLOs | Full |

Depth is threaded through *every* stage, including design, the handoff and release — not just the
front-end validation. Re-triage only on an explicit scope change (`retier`): finished work is kept,
shallower stages are flagged `rework`, newly applicable stages reopen.

## Stages

| # | Stage | Skill | T1 | T2 | T3 | T4 |
|---|---|---|---|---|---|---|
| 0 | Intake & Triage | `triage` | ● | ● | ● | ● |
| 1 | Problem Identification | `problem-framing` | ● | ● | ● | ● |
| 2 | Proactive/Competitive Research | `competitive-research` | ● | ● | ● | ● |
| 3 | Challenge & Validation (+ risk register) | `validation-composer` | — | ● | ● | ● |
| 4 | Problem & Solution Framing | `solution-framing` | — | ● | ● | ● |
| 5 | Opportunity Structuring & Prioritization | `opportunity-prioritization` | — | ◐ | ● | ● |
| 6 | Market & Viability | `viability` | — | — | ● | ● |
| 7 | Scope Lock | `scope-lock` | ● | ● | ● | ● |
| 8 | Retention & Engagement | `retention` | — | ● | ● | ● |
| 9 | **Experience & Design** — tokens, contrast, flows | `experience-design` | ◐ | ◐ | ◐ | ◐ |
| 10 | Technical Feasibility & Architecture (+ security) | `architecture-composer` | ● | ● | ● | ● |
| 11 | Work Packages & Engineering Handoff | `handoff-generator` | ● | ● | ● | ● |
| 12 | Success Rubric & Evals (+ test strategy) | `success-rubric` | ● | ● | ● | ● |
| 13 | **Release & Operations** | `release-ops` | ● | ● | ● | ● |
| 14 | Packaging | `packaging` | ● | ● | ● | ● |
| 15 | Feedback Loop | `feedback-loop` | — | ◐ | ◐ | ◐ |

● active · ◐ conditional (Stage 9: only with a user-facing UI; Stage 15: after ship) · — skipped

Plus one cross-cutting skill, **`adversarial-review`**, which runs before anything is locked into the
master PRD. `/backbone-plan` prints the live matrix for your tier. Full detail: [docs/stages.md](docs/stages.md).

## What makes it different

- **Built-in skepticism.** Real pain outweighs a tidy canvas; a high market score beside weak pain is a
  *blocking* flag. Every AI-generated plan gets an adversarial pass and explicit sign-off before it is
  locked, and `check` fails a section locked without one.
- **A locked design system.** Stage 9 writes the palette, type, spacing and motion as machine-readable
  tokens, checks every colour pair against WCAG contrast, exports CSS variables, hands the tokens to every
  UI agent, and fails a module that hard-codes colours. → [docs/design-system.md](docs/design-system.md)
- **Parallel agents without collisions.** A module map with non-overlapping paths and a dependency DAG;
  subagents tagged `[bb:<module>]` are claimed and verified automatically by hooks.
  → [docs/parallel-agents.md](docs/parallel-agents.md)
- **Done means verified.** Every acceptance criterion names an executable gate; nothing is marked done
  by assertion. Seven stages refuse to close without their evidence.
- **It ships, then listens.** Stage 13 plans environments, CI, rollback and observability for the tier;
  Stage 15 brings real-user signal back into the discovery tree after launch.

## Commands

| Command | What it does |
|---|---|
| `/backbone-status` | Tier, stage statuses, next stage, live claims, feedback due |
| `/backbone-plan` | The stage/framework matrix for this tier (or any tier) |
| `/backbone-verify` | Run gates for a module or work package; check the whole project |
| `/backbone-claim` | Claim a module for this session (subagents claim automatically) |
| `/backbone-off` | Stop switch: this project, `--global` for every project, `--days <n>` to snooze |
| `/backbone-on` | Turn it back on (`--global` clears the global switch) |

Everything deterministic lives in one dependency-free CLI, `node "<plugin>/scripts/backbone.js" <command>`
— reference in [docs/cli.md](docs/cli.md). Documents it writes: [docs/documents.md](docs/documents.md).

## Compose, don't rebuild

Where these skills are installed, Backbone invokes them and feeds them its inputs; where they are not, it
falls back to a minimal built-in version so it still works standalone.

| Function | Skill/source it leans on |
|---|---|
| Lean Canvas / Lean UX Canvas | `lean-canvas`, `lean-ux-canvas` |
| Opportunity Solution Tree | `opportunity-solution-tree` |
| Prioritization (RICE/ICE/Kano/Opportunity Score) | `prioritization-frameworks` |
| Validation canvas + assumption testing | `validation-canvas`, `riskiest-assumption-test` |
| Design tokens, components, accessibility | `design-system`, `frontend-design`, `accessibility` |
| PRD development | `prd-development` |
| Company/competitor research | `company-research` |
| Execution, low ceremony | GitHub Spec Kit (`/specify → /plan → /tasks → /implement`) |
| Execution, full team simulation | BMAD-Method (Analyst/PM/Architect/SM/Dev/QA, story-sharding) |

## Other harnesses

Claude Code first. The CLI underneath is harness-agnostic — see [adapters/AGENTS.md](adapters/AGENTS.md)
for running the same process from Codex or Cursor, and what you give up without hooks.

## Development

```
npm test        # 70 tests: tier gating, state + migration, module map, claims, gates, CVS,
                # design tokens + contrast, security/release enforcement, CLI, hooks, stop switch
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to add a stage or a check, and [CHANGELOG.md](CHANGELOG.md)
for what changed. Before publishing: `claude plugin validate .`.

## License

MIT
