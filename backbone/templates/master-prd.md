# Master PRD — {{PROJECT}}

The non-negotiables. Binding on every agent and every module, whatever it is working on.

**Tier:** {{TIER}} · **Last updated:** {{DATE}}

> Nothing enters this file until it has survived an adversarial pass (`backbone:adversarial-review`)
> and the user has explicitly signed off. Every section cites the `decision-log.md` entry that records
> that pass as `Sign-off: DL-###`. A section that does not apply at this tier still says so explicitly,
> with its reason, and is still signed off — "not applicable" is a decision too.

## 1. Validated Opportunity Statement

<!-- fill: the real situation this came from, who has the problem, how often and how badly,
     the evidence it is real (not the market size), and what success looks like. -->

Evidence grade: <!-- fill: assumed | secondary | anecdotal | interviews | behavioral -->

Sign-off: DL-###

## 2. Locked Scope (MoSCoW)

**Must**
- <!-- fill -->

**Should**
- <!-- fill -->

**Could**
- <!-- fill -->

**Won't (this cycle)**
- <!-- fill: the explicit exclusions; this list is what stops scope drift later. -->

Sign-off: DL-###

## 3. Tech Stack Decisions

| Area | Choice | Why | ADR |
|---|---|---|---|
| <!-- fill --> | | | architecture.md#adr-001 |

Sign-off: DL-###

## 4. Global Data Model / Schema Decisions

<!-- fill: entities, ownership, keys, and the rules every module must honour.
     If the project has no persistence layer, write "No persistence layer" and why. -->

Sign-off: DL-###

## 5. Engineering Standards (enforced, not recommended)

- **SOLID** is the default code-quality bar for every module.
- **Clean separation of concerns**: small focused modules, explicit interfaces, no cross-module reach-through.
- **Migrations** are ordered, commented, and reversible where practical.
- **Secrets** live only in `.env`/proper secret management — never hardcoded, never committed. `.env.example` carries key names with empty or `<placeholder>` values.
- **Verification gates, not just a written standard**: every requirement carries a testable Given/When/Then acceptance criterion, every module PRD (or work package) states which gate verifies it, and nothing is marked done until that gate passes. Gates are executable lines in a ` ```backbone-gates ` block and are run automatically when an agent finishes.
- Project-specific additions: <!-- fill or write "none" -->

Sign-off: DL-###

## 6. Global Non-Functional Constraints

| Constraint | Bar | Notes |
|---|---|---|
| Auth model | <!-- fill --> | |
| Compliance posture | <!-- fill --> | |
| Performance | <!-- fill --> | |
| Security | <!-- fill --> | |
| Accessibility | <!-- fill --> | |

Sign-off: DL-###

## 7. North Star Metric & Success Rubric

**North Star Metric:** <!-- fill, or "not applicable at this tier — reason" -->

**Definition of Done (project level):** <!-- fill -->

**Success rubric:** <!-- fill: how this is judged — clarity, evidence, feasibility, failure modes at T3+; the judging rubric at T1. -->

Sign-off: DL-###
