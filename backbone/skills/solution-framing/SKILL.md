---
name: solution-framing
description: Stage 4 — frame problem and solution with a Value Proposition Canvas and a Lean Canvas (minimum sections at T2, full canvas at T3+), grounded in the validated pain. Use after validation passes at T2+; it does not run at T1.
---

# Stage 4 — Problem & Solution Framing

**Does not run at T1.** These canvases already exist as mature skills — wrap them, do not rebuild them.
Backbone's contribution is that every box must trace to evidence already recorded, and conflicts get
surfaced instead of smoothed over.

Scaffold once: `scaffold canvas`.

## Procedure

1. **Gather the inputs first**: the 5W2H and JTBD statement from `problem.md`, the validated pain and
   evidence grades from `validation.md`, the alternatives table from Stage 2.

2. **Value Proposition Canvas.** Customer profile (jobs, pains, gains) on one side; value map (products
   and services, pain relievers, gain creators) on the other. Then state the fit explicitly: which pains
   and gains are actually addressed, and which are deliberately left alone.

3. **Lean Canvas.** If a `lean-canvas` skill is installed, invoke it and pass the inputs above; use
   `lean-ux-canvas` instead when the solution is UX-led. Otherwise fill the canvas in `canvas.md` directly.
   - **T2:** Problem, Customer Segments, Unique Value Proposition, Solution — the minimum.
   - **T3+:** the full canvas, including channels, cost structure, revenue streams, unfair advantage.
   - Existing Alternatives comes from Stage 2's table, not from imagination.

4. **Ground every box.** For each, name the file and line of evidence behind it. Any box you cannot
   ground gets marked `UNGROUNDED` in the canvas — visibly. That is a to-do list, not a failure.

5. **Surface conflicts.** Read the canvas back against `validation.md`. The common one: a UVP that is not
   actually grounded in the validated pain point. Write every conflict in the "Conflicts surfaced"
   section, tell the user, and resolve it deliberately — by changing the canvas, or by recording why the
   conflict is acceptable. Never silently reconcile.

6. **Adversarial pass** (`backbone:adversarial-review`) if any part of this canvas will be locked into
   `master-prd.md` — the UVP and customer segment usually are.

7. `stage 4 done`.

## Push-back checklist

- A UVP that would read identically for three competitors is not a value proposition.
- "Everyone who …" is not a customer segment.
- Pain relievers that relieve pains nobody in `validation.md` described are solution-first thinking.
- If the canvas reads beautifully but the Customer Validation Score was borderline, say so: the canvas
  did not add evidence, only polish.
