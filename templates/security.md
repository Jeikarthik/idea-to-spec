# Security & Privacy — {{PROJECT}}

**Tier:** {{TIER}} · **Last updated:** {{DATE}}

Written in Stage 10 alongside `architecture.md`. Depth follows the tier: threat model, secrets and auth
from T2; data classification from T3; personal-data inventory and compliance mapping at T4. Anything
here that every module must obey also goes into `master-prd.md` §6 behind an adversarial pass.
A section that does not apply says so and why — "no personal data stored" is a decision, not a blank.

## Threat model

STRIDE-lite, one row per trust boundary (browser ↔ API, API ↔ database, API ↔ third party, admin ↔ app…).

| Boundary | Threat (Spoofing / Tampering / Repudiation / Info disclosure / DoS / Elevation) | Likelihood | Impact | Mitigation | Owner module |
|---|---|---|---|---|---|
| <!-- fill --> | | | | | |

Abuse cases worth a test: <!-- fill: e.g. "a user reads another user's records by changing an id" -->

## Secrets

<!-- fill: every secret, where it lives (env / secret manager), who can read it, rotation. Never in code,
     never in .env.example values. -->

## Authentication and authorization

<!-- fill: how users prove who they are (provider, session/token lifetime, MFA), and the permission model
     (roles, ownership checks, where they are enforced — server side, always). -->

## Dependencies and supply chain

<!-- fill: lockfile committed, dependency scanning (e.g. npm audit / Dependabot), pinned CI actions. -->

## Data classification (T3+)

| Data | Class (public / internal / confidential / restricted) | Stored where | Encrypted at rest | Who can access |
|---|---|---|---|---|
| <!-- fill, or "not applicable at T2" --> | | | | |

## Personal data / PII (T4; T3 when personal data is stored)

| Field | Why we need it | Lawful basis / consent | Retention | Deletion path |
|---|---|---|---|---|
| <!-- fill, or "no personal data stored — reason" --> | | | | |

## Compliance (T4)

| Regime (GDPR, HIPAA, SOC 2, PCI DSS, local law…) | Applies because | Obligations that shape the build | Evidence we keep |
|---|---|---|---|
| <!-- fill, or "none apply — reason" --> | | | |

## Logging and audit

<!-- fill: what is logged, what must never be logged (secrets, tokens, full card numbers, health data),
     audit trail for sensitive actions. -->
