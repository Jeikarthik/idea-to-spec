# Documents

Three tiers of documentation, designed so several agents can work at once: project-wide context, the
binding non-negotiables, and self-contained per-module specs.

```
backbone/
├── state.md            tier + per-stage status (machine state in a backbone-state block)
├── brief.md            the one-page opportunity statement
├── problem.md          5W2H, JTBD, HMW, prior art
├── validation.md       Mom Test notes, hypotheses, Customer Validation Score (backbone-cvs block)  (T2+)
├── risks.md            living risk register, seeded by the pre-mortem                             (T3+)
├── canvas.md           Value Proposition + Lean Canvas                                            (T2+)
├── discovery-tree.md   Opportunity Solution Tree — living, with change history
├── viability.md        market type, buyer map, sourced TAM/SAM/SOM, unit economics                (T3+)
├── retention.md        Hook Model, AARRR/HEART, North Star Metric                                 (T2+)
├── design.md           design tokens (backbone-tokens block), contrast, flows, components   (if UI)
├── master-prd.md       THE NON-NEGOTIABLES — binding on every agent (§1–§8)
├── architecture.md     ADRs, C4, real-vs-stubbed, glossary, module map, interface contracts, claim table
├── security.md         threat model, secrets, auth; data classification, PII, compliance          (T2+)
├── modules/<name>.md   self-contained per-module PRDs                                             (T3+)
├── work-packages.md    single work-package file                                                   (T1/T2)
├── test-strategy.md    test pyramid, E2E critical paths, test data, coverage bar                  (T2+)
├── release.md          demo plan (T1) or environments, CI/CD, rollout, rollback, observability, runbook
├── migrations/         ordered, commented SQL                                            (if persistence)
├── prerequisites.md    credentials and setup                                       (if external deps)
├── decision-log.md     chronological why-record: adversarial passes, interface freezes, overrides
├── packaging.md        pitch/rubric mapping (T1) or positioning (T2–4)
└── feedback-log.md     dated post-ship entries                                                    (T2+)
```

`.env.example` is written at the project root. Set `BACKBONE_DOCS_DIR` to use a directory other than
`backbone/`.

## The master PRD

| § | Section | Locked in stage |
|---|---|---|
| 1 | Validated Opportunity Statement | 3 / 4 |
| 2 | Locked Scope (MoSCoW) | 7 |
| 3 | Tech Stack Decisions | 10 |
| 4 | Global Data Model / Schema | 10 / 11 |
| 5 | Engineering Standards | 11 |
| 6 | Global Non-Functional Constraints (auth, compliance, security, accessibility) | 10 |
| 7 | North Star Metric & Success Rubric | 8 / 12 |
| 8 | Design Non-Negotiables | 9 |

Every section cites `Sign-off: DL-###` — a signed-off adversarial review in `decision-log.md`. A section
that does not apply still says so, with its reason, and is still signed off.
