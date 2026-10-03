---
name: packaging
description: Stage 14 — package the work for its audience: reverse-engineer the judging rubric and build the pitch and demo at T1, a positioning and narrative pass at T2/T3, full GTM and stakeholder narrative at T4. Use before a demo, launch, or stakeholder review.
---

# Stage 14 — Packaging

Branches hard by tier. Scaffold once: `scaffold packaging`.

## T1 — Hackathon/buildathon

**Work backwards from the rubric.** Use the event's published criteria if there are any. Typical
weighting: Innovation 20–25%, Technical implementation 20–25%, Impact/usefulness 20–25%,
Demo/presentation 15–20%, Completeness 10–15%. For each criterion write what you will do to score on it
and where that shows in the demo — if a criterion has no demo moment, it scores zero however good the
code is.

**Pitch structure:**

1. **Hook** — the problem plus one real number, 20 seconds. Not a story about your weekend.
2. **Solution** — one sentence, what it does, not how it is built.
3. **Live demo** — the longest segment. Rehearse the exact click path.
4. **Tech + impact** — the interesting engineering decision, and who it helps.
5. **Close** — the ask.

**Demo discipline, non-negotiable:**

- Never open the code editor or terminal during the demo. It reads as stalling and burns the clock.
- Have a **recorded backup** of the full happy path. Record it while things work, not at 3am.
- List the known failure points (network, API rate limits, cold start) and the fallback for each.
- Rehearse once end-to-end with a timer. Most demos fail on time, not on features.

## T2/T3 — Positioning and narrative

Lighter. One positioning statement:

> For \<segment\> who \<need\>, this is a \<category\> that \<benefit\>, unlike \<alternative\>.

Then the differentiation a customer would actually notice (not internal architecture), the narrative for
a demo or landing page, and proof points that are real rather than aspirational. Everything traces back to
`canvas.md` and `validation.md` — packaging is where invented claims creep in, so check each one.

## T4 — GTM and stakeholder narrative

Per stakeholder: what they need to hear, their real objection, and the evidence that answers it. Plus
positioning, pricing and packaging rationale, the launch sequence with owners, and any compliance or legal
review required before launch. Sourced numbers only — this audience checks.

## Close

`stage 14 done`. If a claim in the pitch is not supported by anything in the documents, either get the
evidence or cut the claim; do not let the pitch quietly become the source of truth.
