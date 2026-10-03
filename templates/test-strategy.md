# Test Strategy — {{PROJECT}}

**Tier:** {{TIER}} · **Last updated:** {{DATE}}

Written in Stage 12 next to the acceptance criteria. The verification gates prove each module or work
package; this file says how the whole thing is tested so the gates add up to confidence, not just green
ticks. Light at T2 (critical paths + what is deliberately not tested); full at T3+.

## Test pyramid

| Layer | What it covers | Tooling | Rough share |
|---|---|---|---|
| Unit | <!-- fill --> | | |
| Integration / contract | <!-- fill: module interface contracts from architecture.md --> | | |
| End-to-end | <!-- fill: the critical paths below --> | | |
| Manual / exploratory | <!-- fill: what only a person can judge --> | | |

## Critical paths (end-to-end)

One per user flow in `design.md` (or per core job when there is no UI). Each names its gate.

| Path | Steps | Gate that runs it |
|---|---|---|
| <!-- fill --> | | |

## Test data

<!-- fill: fixtures/factories/seed scripts; never real personal data; how a fresh environment is seeded. -->

## Coverage and quality bar

<!-- fill: target (e.g. 80% lines on domain logic, not on generated code), flaky-test policy, what blocks
     a merge in CI. -->

## Non-functional tests (T3+)

<!-- fill: performance budget and how it is measured, accessibility checks (axe/Lighthouse), security
     tests from the abuse cases in security.md — or "not applicable at T2". -->

## Deliberately not tested

<!-- fill: what is out of scope and why — an honest list beats a silent gap. -->
