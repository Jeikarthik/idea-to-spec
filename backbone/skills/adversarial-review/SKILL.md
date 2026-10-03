---
name: adversarial-review
description: Run the mandatory self-critique before anything is locked into master-prd.md — surface the weakest assumption, the most likely failure, at least one alternative framing, and any conflict with earlier evidence, then get explicit sign-off. Use before locking scope, tech stack, data model, constraints, or any AI-generated plan, canvas, or architecture choice.
---

# Adversarial pass (Section 2)

Nothing gets silently accepted just because it was generated correctly. Every AI-generated plan, canvas,
architecture choice or scope gets one explicit self-critique before it is accepted into `master-prd.md`,
and the user signs off on the result.

This fires at **every tier**, including T1. At T1 it is five minutes and may cover the whole master PRD
in one entry; at T4 it is one entry per locked section.

## Procedure

1. **State exactly what is being locked** — quote the artifact, do not paraphrase it.

2. **Produce the critique.** All four, in writing:

   - **Weakest assumption** — the single belief this rests on that is most likely to be wrong. Not a
     generic risk ("users might not adopt it"): the specific one ("we assume clinics re-bill weekly;
     both interviews described monthly batches").
   - **Most likely failure** — how this actually fails in practice, concretely enough to recognise it
     happening.
   - **At least one alternative framing** — a genuinely different way to see the problem or solution,
     argued well enough that it could win. A strawman does not count.
   - **Conflicts with earlier evidence** — read back through `problem.md`, `validation.md`, `canvas.md`,
     `viability.md` and `decision-log.md` and name every place this contradicts what is already recorded
     (for example, a Lean Canvas UVP that is not grounded in the validated pain from Stage 3). Say
     "none found" only after actually looking.

3. **Push back where the evidence is thin.** This is a stage output, not a courtesy. If the Customer
   Validation Score is strong on market size and scalability but weak on problem frequency, severity, or
   real evidence, that is a blocking flag — say so plainly rather than softening it.

4. **Resolve.** Either change the artifact, or state why it stands as written. Both are legitimate; a
   silent pass is not.

5. **Ask for explicit sign-off.** The user says yes to this specific content. Not implied by silence,
   not inferred from "sounds good" about something else.

6. **Record it** in `decision-log.md` with the next DL id:

   ```markdown
   ## DL-007 — 2026-09-16 — Lock the scope for the first cycle

   - Type: adversarial-review
   - Stage: 7
   - Subject: master-prd.md §2 Locked Scope
   - Weakest assumption: that clinics re-bill weekly
   - Most likely failure: the weekly digest lands in a monthly workflow and is ignored
   - Alternative framing: a monthly reconciliation report instead of a weekly digest
   - Conflicts with earlier evidence: validation.md interview 2 describes a monthly batch
   - Resolution: scope cut to a single batch view; cadence left configurable
   - Signed off by: the user, 2026-09-16
   ```

7. **Cite it in the locked section** of `master-prd.md` as `Sign-off: DL-007`.

`backbone.js check` fails when a master-PRD section has no `Sign-off:` line, when the referenced entry
does not exist, when it is not `Type: adversarial-review`, when any of the three critique fields is
missing, or when `Signed off by` is still a placeholder. Stages 7 and 10 will not close until it passes.

## Overrides

Proceeding past a blocking Customer Validation Score flag is itself a decision and needs its own entry
(`Type: override`, plus `Reason` and `Signed off by`), then
`stage 3 done --override DL-###`. Do not quietly re-score until the flags disappear.
