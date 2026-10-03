---
name: retention
description: Stage 8 — design for retention with the Hook Model (T2+), AARRR pirate metrics (T3+), HEART (T4), and pick the North Star Metric that feeds the discovery tree and the success rubric. Use after scope is locked at T2+; skipped at T1.
---

# Stage 8 — Retention & Engagement

**Skipped at T1** (a demo does not need a habit loop). **Light at T2** — the Hook Model only.
**T3+** adds AARRR and the North Star Metric; **T4** adds HEART (also at T3 when the team already has
product-analytics maturity).

Scaffold once: `scaffold retention`.

## 1. Hook Model (T2+)

Trigger → Action → Variable Reward → Investment.

- **Trigger**: the external one first, then the internal one it should become — the emotion or situation
  that makes someone think of this unprompted.
- **Action**: the simplest thing they do, in one step.
- **Variable reward**: what varies, and why it is worth returning for.
- **Investment**: what the user leaves behind (data, configuration, history, reputation) that makes the
  next visit better.

Then the honest check: **is this a habit product at all?** Plenty of good products are used monthly or
once a quarter. If usage is genuinely occasional, say so and design for return-from-absence instead of
engineering false engagement. Recording that is a better outcome than a fabricated loop.

## 2. AARRR (T3+)

Acquisition, Activation, Retention, Referral, Revenue — each defined *for this product*, with how it will
actually be measured. "Activation" is not a stage; it is a specific first moment of value, named.

## 3. HEART (T4, or T3 with analytics maturity)

Happiness, Engagement, Adoption, Retention, Task success — goal, signal and metric per row. Skip rows that
cannot be measured yet rather than inventing proxies.

## 4. North Star Metric (T3+)

One outcome metric that goes up only when customers actually got value. Not a vanity count.

- Name the input metrics that move it.
- Run the **gaming check**: how could this metric rise while customers are worse off? Name the guardrail.
- It becomes the top node of `discovery-tree.md` (Stage 5) and §7 of `master-prd.md`, and it is what the
  Stage 13 feedback loop measures against.

## 5. Close

Adversarial pass on the North Star Metric before it is locked into `master-prd.md` — it is the metric a
team optimises for months, so the alternative framing question is worth real thought. Then `stage 8 done`.

## Push-back checklist

- A Hook Model built on a trigger the user never actually feels is decoration.
- If retention design contradicts the validated pain (a weekly loop for a monthly problem), surface it.
- A North Star Metric that cannot be measured with what the project will actually build is not usable —
  pick one that can, or write down what must be instrumented.
