---
name: release-ops
description: Stage 13 — plan how the work ships and stays up — a demo plan with a recorded backup at T1; environments, CI that runs the verification gates, deploy and a tested rollback, and error tracking at T2; rollout strategy, North-Star observability, a runbook and a risk-register review at T3; SLOs, incidents and a backup/restore drill at T4. Use after the success rubric and before packaging or shipping.
---

# Stage 13 — Release & Operations

Runs at every tier. Shipping is where good builds die quietly: the demo laptop that will not start, the
deploy nobody can roll back, the outage nobody notices. This stage makes those decisions on purpose.

Scaffold once: `scaffold release`.

## T1 — the demo plan

Fill **Demo plan** in `release.md`: where it runs, the one command that starts it, the demo data, who
presses the buttons, and a **recorded backup** of the whole demo — Wi-Fi fails, APIs rate-limit, and the
judges still need to see it work. Rehearse it once against the clock.

## T2 — ship it safely

- **Environments:** local, preview/staging, production — what data each holds, who deploys.
- **CI/CD:** every push runs install, lint, tests **and the `backbone-gates`** (the same gates the
  SubagentStop hook runs); main builds and deploys. Name the CI system and its config file. If the project
  has no CI yet, write it now (GitHub Actions is the usual default).
- **Rollback:** the exact way back, and how long it takes. Test it once before launch — an untested
  rollback plan is a hope.
- **Observability:** error tracking at minimum, with someone who actually reads it.

## T3 — roll out and watch

- **Rollout strategy:** feature flags, canary, staged percentages or a beta cohort — and the metric that
  decides to widen or stop.
- **Observability tied to the North Star** (`retention.md`): logs, metrics and alerts on the North Star and
  its input metrics, so Stage 15 has real numbers to read.
- **Runbook:** symptom → first check → fix → who to escalate to, for the failures you can predict.
- **Risk register review:** walk `risks.md` (seeded by the Stage 3 pre-mortem). Close what is mitigated,
  add what the build revealed, and decide what blocks launch.

## T4 — operate it

- **SLOs** (availability, latency) and alert thresholds; on-call; the incident process and post-mortem
  template.
- **Change approval and compliance evidence** the client or regime requires (see `security.md`).
- **Backup/restore drill** (when there is a persistence layer): restore into a scratch environment, time
  it, record the date.

## Close

Adversarial pass on the rollback and rollout plan (weakest assumption: usually "we can roll back"), then:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage 13 done
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" ship        # when it is actually live
```

`stage 13 done` refuses while `release.md` is missing or a section required at this tier is unfilled:
Demo plan at T1; Environments, CI/CD, Rollback and Observability at T2+; Rollout strategy and Runbook at
T3+; SLOs and incidents at T4. `ship` warns if this stage is not closed.

## Push-back checklist

- "We'll add monitoring after launch" means the first outage is reported by a user.
- A rollback that needs a data migration reversed is not a rollback — plan forward-fixes instead.
- CI that does not run the gates lets "done" drift from "verified".
- At T1, a backup recording beats any amount of infrastructure.
