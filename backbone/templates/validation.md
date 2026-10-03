# Validation — {{PROJECT}}

**Tier:** {{TIER}} · **Last updated:** {{DATE}}

T2+ only. Evidence of real, lived, frequent pain outweighs an elegant canvas or a large market.

## Mom Test notes

Ask about their past behaviour, not your idea. No pitching, no leading, no hypotheticals.

### Conversation — <!-- date, who, how they were found -->

- What they were doing when the problem last happened: <!-- fill -->
- What it cost them: <!-- fill -->
- What they did instead (workaround, spend, or nothing): <!-- fill -->
- Commitment given (time, money, introduction, next meeting) — or none: <!-- fill -->
- Quotes (verbatim): <!-- fill -->
- What this disconfirms: <!-- fill -->

## Assumption map + Riskiest Assumption Test (RAT)

| Assumption | Impact if wrong | Evidence today | Riskiest? | Test | Result |
|---|---|---|---|---|---|
| <!-- fill --> | | | | | |

**Riskiest assumption:** <!-- fill -->
**Test designed:** <!-- the smallest test that could falsify it, and its pass/fail line in advance -->
**Outcome:** <!-- fill -->

## Opportunity Hypotheses

Each is a testable "we believe …" statement with the evidence that would settle it.

- **Customer:** We believe <!-- fill -->.
- **Problem:** We believe <!-- fill -->.
- **Solution:** We believe <!-- fill -->.
- **Value:** We believe <!-- fill -->.
- **Market:** We believe <!-- fill -->.
- **Revenue:** We believe <!-- fill -->.

## Pre-mortem (T3+)

It is 12 months from now and this failed. Why?

1. <!-- fill -->
2. <!-- fill -->

Mitigations that change the plan: <!-- fill -->

## Problem-Solution Fit check (T3+)

<!-- fill: does the proposed solution address the validated pain, for the validated segment,
     better than their current alternative? Where it does not, say so. -->

## Customer Validation Score

Ten parameters, 1–5 each, with an evidence grade and written reasoning per sub-score.
Evidence grades: `assumed`, `secondary`, `anecdotal`, `interviews`, `behavioral`.
Frequency, severity and real evidence gate hardest: a high market-growth/scalability score never
compensates for weak or unevidenced pain. Self-scored at T2; group-scored (two or more scorers) at T3/T4.

Compute with `backbone.js cvs --write`.

```backbone-cvs
{
  "date": "{{DATE}}",
  "scored_by": ["<!-- who scored -->"],
  "scores": {
    "problem_frequency": { "score": 0, "evidence": "assumed", "reasoning": "" },
    "problem_severity": { "score": 0, "evidence": "assumed", "reasoning": "" },
    "affected_customer_count": { "score": 0, "evidence": "assumed", "reasoning": "" },
    "dissatisfaction_with_alternatives": { "score": 0, "evidence": "assumed", "reasoning": "" },
    "willingness_to_adopt": { "score": 0, "evidence": "assumed", "reasoning": "" },
    "willingness_to_pay": { "score": 0, "evidence": "assumed", "reasoning": "" },
    "market_growth": { "score": 0, "evidence": "assumed", "reasoning": "" },
    "scalability": { "score": 0, "evidence": "assumed", "reasoning": "" },
    "competitive_advantage": { "score": 0, "evidence": "assumed", "reasoning": "" },
    "social_environmental_impact": { "score": 0, "evidence": "assumed", "reasoning": "" }
  }
}
```

<!-- backbone:cvs-result:start -->
<!-- backbone:cvs-result:end -->

### Score history

| Date | Weighted | Verdict | What changed |
|---|---|---|---|
| | | | |
