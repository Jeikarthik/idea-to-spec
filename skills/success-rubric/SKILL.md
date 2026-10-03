---
name: success-rubric
description: Stage 12 — write Given/When/Then acceptance criteria and a Definition of Done for every requirement (all tiers), wire each criterion to the gate that verifies it, add a test strategy (T2+) and a qualitative checklist (T3+). Use alongside or right after the engineering handoff.
---

# Stage 12 — Success Rubric & Evals

Every tier. This is what makes "done" mean something: a criterion nobody can verify is an opinion.

## 1. Acceptance criteria (all tiers)

Given/When/Then, in each module PRD (T3+) or `work-packages.md` (T1/T2):

> AC-3 — **Given** a session that expired an hour ago, **When** the user opens any page,
> **Then** they are redirected to sign-in and returned to that page afterwards. Verified by: G1

Rules:

- One observable outcome per criterion. If it needs "and also", split it.
- Written from outside the implementation — no internal function names.
- Include the failure paths that matter, not only the happy path.
- Every criterion names its gate. An unverifiable criterion is a spec defect; fix it now, not at review.

## 2. Definition of Done (all tiers)

Per module or work package, and once at project level in `master-prd.md` §7. It always includes: all
acceptance criteria verified by their gates, the engineering standards in `master-prd.md` §5 upheld, only
files inside the module's boundary changed, interface contract unchanged (or the change logged and signed
off), and `.env.example`/migrations updated for anything added.

## 3. Wire the gates

Each criterion's gate must exist as an executable line in the `backbone-gates` block, or as a `manual:`
line when only a human can judge it. Run them before claiming anything is finished:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" verify <module>
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" verify --wp all
```

A module with manual gates stays `in-progress` until the user confirms them, and only then
`verify <module> --confirm-manual`. Never pass that flag on the agent's own judgement — it exists so a
human signs for what only a human can see.

## 4. Qualitative checklist (T3+)

Beyond the pass/fail gates, judge the artifacts themselves:

- **Clarity** — could an agent with no context build from this alone?
- **Evidence** — is each claim traceable to something recorded, or is it assertion?
- **Feasibility** — does the plan fit the timeframe and the team from Stage 0?
- **Failure modes** — are they named, with the behaviour on failure specified?

## 5. Test strategy (T2+) — `scaffold test-strategy`

The gates prove each unit; the strategy makes them add up. Light at T2, full at T3+:

- **Pyramid:** what is unit-tested, what is contract-tested against the interface contracts in
  `architecture.md`, what is end-to-end, and what only a person can judge.
- **Critical paths:** one end-to-end test per user flow in `design.md` (or per core job when there is no
  UI), each naming the gate that runs it — so the flows the design promised are the flows CI proves.
- **Test data** (never real personal data), the **coverage bar**, and the **abuse cases** from
  `security.md` as tests (T3+).
- **Deliberately not tested** — an honest list beats a silent gap.

`check` warns if Stage 12 closes at T2+ without `test-strategy.md`.

## 6. Close

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage 12 done
```

Refuses while any module PRD or work package lacks Given/When/Then criteria, a Definition of Done, or
gates.
