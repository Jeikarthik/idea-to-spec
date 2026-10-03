---
name: opportunity-prioritization
description: Stage 5 — build the Opportunity Solution Tree (T3+) and prioritize candidate solutions with Opportunity Score, ICE, RICE or Kano. Use when there is more than one candidate solution or feature, or when re-running discovery after shipping.
---

# Stage 5 — Opportunity Structuring & Prioritization

**T1:** does not run — MoSCoW in Stage 7 is the only prioritization a hackathon needs.
**T2:** conditional — only once there is genuinely more than one candidate solution or feature.
**T3/T4:** the Opportunity Solution Tree plus a numeric method.

Scaffold once (T3+, or at T2 when the condition holds): `scaffold discovery-tree`.

## 1. Opportunity Solution Tree (T3+)

Desired outcome → customer opportunities → candidate solutions → assumption tests. If an
`opportunity-solution-tree` skill is installed, invoke it; otherwise fill `discovery-tree.md`.

- The **outcome** at the top is ideally the North Star Metric from Stage 8. If Stage 8 has not run, use
  the outcome the validated pain implies, and revisit it once the metric exists.
- **Opportunities are customer needs in the customer's words**, taken from `validation.md` — not feature
  names with the word "opportunity" in front.
- Every candidate solution gets at least one assumption test with a pre-committed pass/fail line.
- This is a living file. Record what changed and why in its change history — it is the same file Stage 15
  re-runs after ship.

## 2. Prioritization

Pick the lightest method that resolves the decision. If a `prioritization-frameworks` skill is
installed, invoke it for the mechanics and record the inputs and result here.

| Method | Formula | When |
|---|---|---|
| Opportunity Score | Importance × (1 − Satisfaction) | Default at T2/T3; rooted in customer research |
| ICE | Impact × Confidence × Ease | Fast triage, T2+ |
| RICE | Reach × Impact × Confidence ÷ Effort | Larger backlogs, T3/T4 |
| Kano | Basic / performance / delighter | T4, or wherever UX differentiation is the question |

Record the **inputs**, not only the totals — a RICE score whose reach and confidence nobody can defend
is false precision. Where two candidates land within noise of each other, say so and decide on judgement,
explicitly.

## 3. Output

- The chosen next bet, and what is explicitly **not now**.
- Anything that this makes obviously out of scope feeds Stage 7's Won't list.
- `stage 5 done` (or `stage 5 skipped --note "single candidate solution; nothing to prioritize"` at T2).

## Push-back checklist

- Confidence scores above 80% without evidence are wishes; lower them or name the evidence.
- If every candidate scores similarly, the scoring is not doing work — decide on the opportunity instead.
- A tree with one opportunity and five solutions is solution-first thinking wearing a diagram.
