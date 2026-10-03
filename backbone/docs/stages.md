# Stages

Sixteen stages, each gated by tier. `node scripts/backbone.js plan --tier T#` prints the live matrix —
which frameworks fire, at what depth, which are skipped and why. This page explains the shape.

## The flow

```
0 Triage ─▶ 1 Problem ─▶ 2 Prior art ─▶ 3 Validation ─▶ 4 Canvases ─▶ 5 Prioritize ─▶ 6 Viability
                                         (+ risks)
   ─▶ 7 Scope lock ─▶ 8 Retention ─▶ 9 Experience & Design ─▶ 10 Architecture ─▶ 11 Handoff
                                      (tokens, flows)          (+ security)
   ─▶ 12 Success rubric ─▶ 13 Release & Ops ─▶ 14 Packaging ─▶ ship ─▶ 15 Feedback loop ─┐
       (+ test strategy)                                                ▲                │
                                                                        └────────────────┘
```

`next` returns the first stage that is neither done nor skipped. Skipped-at-this-tier stages never
appear; a `conditional` stage runs when its condition holds and is otherwise closed with
`stage <id> skipped --note "<why>"` (a note is required — "not applicable" is a decision too).
Stage 15 is not offered until `ship` records a date.

## What each stage produces

| # | Stage | Writes | Depth (T1 → T4, abridged) |
|---|---|---|---|
| 0 | Intake & Triage | `state.md`, `decision-log.md` | Four questions → tier; bootstrap mode for existing code |
| 1 | Problem Identification | `problem.md`, `brief.md` | 5W2H from a real situation → + JTBD, HMW |
| 2 | Competitive Research | `problem.md` (prior art) | 2-minute "has this been built" → structured competitive analysis |
| 3 | Challenge & Validation | `validation.md`, `risks.md` (T3+) | — → Mom Test, RAT, CVS → + pre-mortem seeding the risk register |
| 4 | Problem & Solution Framing | `canvas.md` | — → Value Proposition + Lean Canvas |
| 5 | Opportunity Prioritization | `discovery-tree.md` | — → Opportunity Score/ICE → OST + RICE/Kano |
| 6 | Market & Viability | `viability.md` | — → market type, buyer map, unit economics → sourced TAM/SAM/SOM |
| 7 | Scope Lock | `master-prd.md` §2 | 5-minute Must/Won't → full MoSCoW |
| 8 | Retention & Engagement | `retention.md` | — → Hook Model → + AARRR, North Star → + HEART |
| 9 | **Experience & Design** | `design.md`, `master-prd.md` §8 | Preset palette + demo flow → tokens + dark mode + flows → + components, voice, i18n → + brand, WCAG AA plan |
| 10 | Technical Feasibility & Architecture | `architecture.md`, `security.md` (T2+) | Real-vs-stubbed → ADRs, C4, threat model → + module map, data classification, glossary → + compliance, run cost |
| 11 | Work Packages & Handoff | `master-prd.md`, `work-packages.md` or `modules/*.md`, migrations, `.env.example` | One work-package file → per-module PRDs for parallel agents |
| 12 | Success Rubric & Evals | acceptance criteria + gates, `test-strategy.md` (T2+) | Given/When/Then + DoD → + test strategy → + qualitative checklist |
| 13 | **Release & Operations** | `release.md` | Demo plan + backup → CI, rollback, errors → + rollout, North-Star observability, runbook → + SLOs, incidents, restore drill |
| 14 | Packaging | `packaging.md` | Judging-rubric pitch → positioning → GTM + stakeholder narrative |
| 15 | Feedback Loop | `feedback-log.md` | — → weekly real-user checkpoints, CVS re-score, discovery-tree re-run |

## Enforced closures

These stages refuse `stage <id> done` until their evidence exists. The refusal is the product working.

| Stage | Refuses while… |
|---|---|
| 3 | the Customer Validation Score is missing or BLOCKED (unless a signed-off `override` entry is passed) |
| 7 | the scope section of `master-prd.md` lacks a signed-off adversarial pass |
| 9 | `design.md` tokens are missing/invalid, a declared colour pair fails WCAG contrast, a tier-required token group is absent, or the User flows (T3+: Components) section is unfilled |
| 10 | at T2+, `security.md` is missing or its tier's sections (threat model, secrets, auth; + data classification at T3; + personal data and compliance at T4) are unfilled |
| 11 | any master-PRD section is unsigned, a work unit lacks gates or Given/When/Then, or `.env.example` holds a real-looking secret |
| 12 | any module PRD or work package lacks acceptance criteria, a Definition of Done, or gates |
| 13 | `release.md` is missing or a section required at this tier is unfilled |
| 15 | the project has not shipped |

"Not applicable — reason" counts as filled; a blank or a leftover `<!-- fill -->` does not.

## Built-in skepticism

- **Real pain over theoretical soundness.** In the Customer Validation Score, problem frequency and
  severity carry triple weight, market growth and scalability single weight, and a high market score
  beside weak or unevidenced pain is a *blocking* flag, not a pass.
- **Problem identification starts from a real situation**, not a market gap.
- **Every AI-generated plan gets an adversarial pass** before it enters `master-prd.md`: weakest
  assumption, most likely failure, at least one alternative framing, conflicts with earlier evidence —
  then explicit sign-off, logged in `decision-log.md`.
- **Push-back is a stage output.** Conflicts with earlier evidence are surfaced, not reconciled away.

## Re-triage

`retier --tier T# --reason "<what changed>"` — only on an explicit scope change (the hackathon prototype
got funded; a client appeared). Finished work is kept, stages done at a shallower depth become `rework`,
newly applicable stages reopen, and unstarted stages that no longer apply close.

## Upgrading from Backbone 1.0

1.0 had fourteen stages. A `state.md` written by 1.0 is migrated the first time it is read: stages are
matched by skill so their status and notes carry over to the new numbers, and Stages 9 and 13 are added
as `not-started`. Nothing is lost; the file is rewritten on the next change.
