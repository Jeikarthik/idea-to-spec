---
name: validation-composer
description: Stage 3 — challenge the idea before building it: Mom Test conversations, assumption mapping plus the riskiest-assumption test, opportunity hypotheses, the weighted Customer Validation Score, and (T3+) a pre-mortem and problem-solution fit check. Use after the problem is framed at T2+; it does not run at T1.
---

# Stage 3 — Challenge & Validation

**Does not run at T1.** At T2 it is self-scored; at T3/T4 it is group-scored and adds a pre-mortem and a
problem-solution fit check. This is where "a Lean Canvas that reads well is not evidence" is enforced.

Scaffold once: `scaffold validation`.

## 1. Mom Test conversations

Talk about their life, not your idea. Rules, in order of how often they are broken:

- Ask about **past behaviour**, never about the future ("would you use…" produces noise).
- Do not pitch. If they now know what you are building, the data is contaminated — note that.
- Chase the specific last occurrence: when, what did you do, what did it cost.
- Look for **commitment**: time, money, an introduction, a next meeting. Compliments are not data.

Record each conversation in `validation.md` including what it **disconfirmed**. A set of conversations
where nothing was disconfirmed usually means the questions were leading.

## 2. Assumption map + Riskiest Assumption Test

List the assumptions this idea rests on, then place each on impact-if-wrong against evidence-we-have.
The riskiest is the top-right: high impact, no evidence. If a `riskiest-assumption-test` or
`validation-canvas` skill is installed, invoke it here and feed it this map — it composes directly with
this stage.

Design the smallest test that could falsify the riskiest assumption, and **write its pass/fail line
before running it**. A test without a pre-committed threshold always passes.

## 3. Opportunity hypotheses (T2+)

Six testable "we believe …" statements — customer, problem, solution, value, market, revenue — each with
what would settle it. Vague statements ("we believe users want a better experience") are not hypotheses.

## 4. Pre-mortem (T3+)

It is twelve months from now and this failed. Everyone writes why, independently, before discussing.
Only mitigations that actually change the plan count; note them in `decision-log.md`.

## 5. Customer Validation Score

Ten parameters, 1–5, each with an evidence grade and written reasoning, in the `backbone-cvs` block of
`validation.md`:

`problem_frequency`, `problem_severity`, `affected_customer_count`, `dissatisfaction_with_alternatives`,
`willingness_to_adopt`, `willingness_to_pay`, `market_growth`, `scalability`, `competitive_advantage`,
`social_environmental_impact`.

Evidence grades: `assumed` → `secondary` → `anecdotal` (a real lived/observed instance) → `interviews`
(several non-leading conversations about past behaviour) → `behavioral` (usage, payment, pre-commitment).

Scoring is honest, not hopeful: score what the evidence supports today, not what you expect after launch.
At T3/T4 at least two people score (`scored_by`), and disagreements are discussed, not averaged away.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" cvs --write
```

Frequency and severity carry triple weight; market growth and scalability carry single weight. The score
is **blocked** — not merely low — when:

- `PAIN_WEAK` — frequency or severity scores 1–2.
- `PAIN_UNEVIDENCED` — frequency or severity rests on `assumed` or `secondary` evidence only.
- `INVERTED_PROFILE` — market/scale sub-scores average ≥4 while the pain is weak or unevidenced. A large
  TAM is not a substitute for a real problem.
- `GROUP_SCORING_REQUIRED` — fewer than two scorers at T3/T4.
- `INCOMPLETE` — a missing score, evidence grade, or reasoning.

Report blocking flags to the user in plain language. The honest options are: get the missing evidence,
change the idea, or record an explicit override. Do not re-score until the flags disappear.

## 6. Problem-Solution Fit check (T3+)

Does the proposed solution address the validated pain, for the validated segment, better than what they
do today? Where it does not, write that down — it is the most useful sentence in the file.

## 7. Close

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage 3 done
```

This refuses while the score is blocked. To proceed anyway, record an adversarial-review-grade override
in `decision-log.md` (`Type: override`, `Reason`, `Signed off by`) and pass `--override DL-###`. The
override is then visible forever in `state.md` and in `check` — which is the point.
