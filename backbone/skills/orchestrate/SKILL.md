---
name: orchestrate
description: Run the Backbone process for this project — decide which stage fires next, at what depth, and hand off to the right stage skill. Use when the user wants to plan, scope, validate, or build an idea and Backbone is already initialised, when they ask "what's next", or after a stage finishes.
---

# Backbone orchestrator

Backbone's job is the orchestration logic: which frameworks fire, how deep, in what order, for this
context — plus the locked engineering handoff and the post-ship feedback loop. It does not reimplement
Lean Canvas, JTBD, MoSCoW, RICE, Spec Kit or BMAD; it decides when they run and wraps them.

**CLI** (used by every Backbone skill):

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" <command>
```

## Procedure

1. **Read the state.**

   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" status
   ```

   - No `state.md` → Stage 0 has not run. Use `backbone:triage` (it decides greenfield vs. bootstrap).
   - `state.md` malformed → tell the user and repair the `backbone-state` block. Never re-init over it.

2. **Take the next stage** from `status` (or `next`). Do not skip an active stage, and do not run a
   stage the tier marks `skip` — that is the whole point of the depth tiers.
   - A `conditional` stage runs only if its condition holds. If it does not, close it explicitly:
     `stage <id> skipped --note "<why the condition does not hold>"`.
   - A stage marked `rework` was completed at a shallower tier before a re-triage; redo it at the new depth.

3. **Mark it in progress**, run the stage skill, then close it:

   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage <id> in-progress
   node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage <id> done
   ```

   Seven stages refuse to close until their evidence exists: 3 (validation score), 7 (signed-off scope),
   9 (valid, contrast-passing design tokens and user flows), 10 (security.md at T2+), 11 and 12
   (module/work-package gates), 13 (release plan for the tier). That refusal is the product working;
   fix the gap rather than working around it. Stage 9 is conditional: with no user-facing UI, close it
   as `skipped --note "<why>"`.

4. **Stage → skill map** (`plan` prints the full matrix for the current tier):

   | Stage | Skill |
   |---|---|
   | 0 Intake & Triage | `backbone:triage` |
   | 1 Problem Identification | `backbone:problem-framing` |
   | 2 Proactive/Competitive Research | `backbone:competitive-research` |
   | 3 Challenge & Validation | `backbone:validation-composer` |
   | 4 Problem & Solution Framing | `backbone:solution-framing` |
   | 5 Opportunity Structuring & Prioritization | `backbone:opportunity-prioritization` |
   | 6 Market & Viability | `backbone:viability` |
   | 7 Scope Lock | `backbone:scope-lock` |
   | 8 Retention & Engagement | `backbone:retention` |
   | 9 Experience & Design | `backbone:experience-design` |
   | 10 Technical Feasibility & Architecture | `backbone:architecture-composer` |
   | 11 Work Packages & Engineering Handoff | `backbone:handoff-generator` |
   | 12 Success Rubric & Evals | `backbone:success-rubric` |
   | 13 Release & Operations | `backbone:release-ops` |
   | 14 Packaging | `backbone:packaging` |
   | 15 Feedback Loop | `backbone:feedback-loop` |

5. **Between stages, check the documents**: `check` reports unsigned master-PRD sections, module map
   errors, missing gates, failing design tokens or contrast, missing security or release sections, and
   secrets that leaked into `.env.example`.

## Standing rules

- **Every stage answers three questions before running anything**: what depth tier is this, does this
  stage apply at this tier, and what is the *minimum* framework that gets a defensible answer — not the
  maximum that looks thorough.
- **Real pain over theoretical soundness.** A canvas that reads well is not evidence.
- **Nothing is locked into `master-prd.md`** without `backbone:adversarial-review` and explicit user
  sign-off recorded in `decision-log.md`.
- **Surface conflicts.** When a framework's output contradicts earlier evidence, say so plainly instead
  of reconciling it into a tidy document.
- **Re-triage on an explicit scope change only** (the hackathon prototype got funded, a client appeared):
  `retier --tier <T#> --reason "<what changed>"`.
- **Compose, don't rebuild.** Where a mature skill for a framework is installed, invoke it and feed it
  Backbone's inputs. The fallbacks in these skills exist so Backbone still works standalone.

## After the handoff

Stage 11 produces the locked artifacts and routes execution: Spec Kit at T1/T2, BMAD or parallel
subagents against the module PRDs at T3/T4. During parallel execution:

- `modules` — dependency order and which modules are ready to start.
- `status` — who owns what right now.
- `verify <module>` — run a module's gates; the only way it becomes `done`.
- Claims and gates are automatic for subagents: the `SubagentStart`/`SubagentStop` hooks claim the
  module named by the `[bb:<module>]` marker and run its gates when the agent finishes.
