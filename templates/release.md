# Release & Operations — {{PROJECT}}

**Tier:** {{TIER}} · **Last updated:** {{DATE}}

Stage 13. How this gets in front of people and stays up. At T1 only **Demo plan** is required; from T2
environments, CI/CD, rollback and observability; from T3 rollout and runbook; at T4 SLOs and incidents.
Sections that do not apply at this tier can say "not applicable at {{TIER}}".

## Demo plan (T1)

<!-- fill: where it runs (URL / laptop), the one command that starts it, the recorded backup video and
     where it is, the demo data, and who presses the buttons. Not applicable above T1 unless there is a demo. -->

## Environments

| Environment | URL / location | Data | Who deploys | Purpose |
|---|---|---|---|---|
| <!-- fill: local, preview/staging, production --> | | | | |

## CI/CD

<!-- fill: the pipeline — on every push: install, lint, test, and the backbone-gates; on main: build and
     deploy to <where>. Name the CI system and the file (e.g. .github/workflows/ci.yml). -->

## Deploy

<!-- fill: how a release happens, step by step; migrations order; who approves (T4). -->

## Rollout strategy (T3+)

<!-- fill: feature flags / canary / staged percentages / beta cohort, and the metric that decides to widen
     or stop — or "not applicable at T2". -->

## Rollback

<!-- fill: the exact way back — redeploy previous build, flag off, migration down/forward-fix — and how long
     it takes. Test it once before launch. -->

## Observability

<!-- fill: error tracking (T2+); logs, metrics and alerts tied to the North Star Metric and its inputs
     (T3+). What a healthy day looks like in numbers. -->

## Runbook (T3+)

| Symptom | First check | Fix | Escalate to |
|---|---|---|---|
| <!-- fill, or "not applicable at T2" --> | | | |

## SLOs and incidents (T4)

<!-- fill: SLOs (availability, latency), alert thresholds, on-call, incident process and post-mortem
     template, backup/restore drill date — or "not applicable below T4". -->

## Launch checklist

- [ ] Gates green in CI on the release commit
- [ ] Rollback tested (T2+) / backup demo recorded (T1)
- [ ] Secrets set in the target environment; `.env.example` up to date
- [ ] Risk register reviewed (T3+) — `risks.md`
- [ ] Ship date recorded: `backbone.js ship`
