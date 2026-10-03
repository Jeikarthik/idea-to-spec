---
name: viability
description: Stage 6 — market type, buyer/user/payer map, precise market definition, sourced TAM/SAM/SOM, segmentation, competitor and alternative table, unit economics, and light Bullseye channel prioritization. Use at T3/T4 only; skipped entirely at T1 and T2.
---

# Stage 6 — Market & Viability

**Skipped entirely at T1 and T2.** Nothing in this stage applies below T3 — running it early is exactly
the kind of ceremony Backbone exists to prevent.

At **T3** the market sizing is optional and lightweight; at **T4** the buyer map and sourced TAM/SAM/SOM
are mandatory.

Scaffold once: `scaffold viability`.

## Procedure

1. **Market type** — B2C, B2B, B2B2C, B2G, C2C, marketplace, platform. State what it implies for how this
   gets sold and who has to say yes.

2. **Buyer / user / influencer / decision-maker / payer** (mandatory at T4). Who uses it, who chooses it,
   who pays, who can veto. In B2B these are rarely the same person, and a product designed for the user
   while sold to the payer fails quietly. Where one person holds several roles, say so explicitly.

3. **Precise market definition** — geography + population + need + category. Never "everyone", never
   "small businesses". If the definition does not let you count the population, it is not precise enough.

4. **TAM / SAM / SOM.** Every number states, beside it: population source, pricing source, calculation
   method, and time period. An unsourced number is deleted, not annotated — and at T4 that is a blocking
   omission. Prefer bottom-up (population × price × adoption) over a top-down slice of an analyst report.
   Then name the assumption that would most change the result.

5. **Segmentation** — demographic, geographic, psychographic, behavioural, need-based — and which segment
   is the wedge, with the reason.

6. **Competitors and alternatives**, extending the Stage 2 table. "Do nothing" and the manual process are
   rows, not footnotes: most products lose to those two.

7. **Unit economics** — price point, variable cost, contribution margin, CAC basis, payback period,
   break-even volume. Where a number is a guess, label it a guess; a model built from unlabelled guesses
   is worse than no model.

8. **Bullseye channels (light)** — a handful of plausible channels, the cheapest test for each, and the
   inner-ring channel to test first.

9. **Adversarial pass** on anything that will be locked into `master-prd.md`, then `stage 6 done`.

## Push-back checklist

- A TAM computed from "1% of a large market" is a red flag, not a plan.
- If the payer differs from the user and nobody has spoken to the payer, that is a validation gap — send
  it back to Stage 3 rather than modelling around it.
- Unit economics that only work at volumes far beyond the SOM should be stated as such, now.
- If this stage's findings contradict the Customer Validation Score, surface the conflict; the score is
  re-scored with evidence, not quietly adjusted to match a market model.
