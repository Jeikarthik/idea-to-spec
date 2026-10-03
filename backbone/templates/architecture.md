# Architecture & Interface Contract — {{PROJECT}}

**Tier:** {{TIER}} · **Last updated:** {{DATE}}

Decisions live here; non-negotiables live in `master-prd.md`. The module boundary map, interface
contracts, dependency graph and claim/lock table are what let several agents work at once without
colliding — they are required at T3+ and harmless at T1/T2.

## Feasibility

| Lens | Assessment | Consequence |
|---|---|---|
| Technical | <!-- fill --> | |
| Resource | <!-- fill --> | |
| Timeline | <!-- fill --> | |
| Risk | <!-- fill --> | |

## What must be real vs. what can be stubbed

| Capability | Real or stubbed | Why | Where the seam is |
|---|---|---|---|
| <!-- fill --> | | | |

## Build vs. Buy vs. Partner (T3+)

| Capability | Build/Buy/Partner | Why | Reversal cost |
|---|---|---|---|
| <!-- fill --> | | | |

## C4

**Context** (who uses the system and what it talks to): <!-- fill; Context-only is enough at T2 -->

**Container** (T3+): <!-- fill -->

**Component** (T3+): <!-- fill -->

## ADRs

### ADR-001 — <!-- title -->

- **Status:** proposed | accepted | superseded by ADR-###
- **Context:** <!-- what forces this decision -->
- **Decision:** <!-- what we are doing -->
- **Consequences:** <!-- what this costs us, what it rules out -->
- **Adversarial pass:** DL-###

## Module boundary map (T3+)

Machine-readable ownership. `paths` must not overlap between modules — two agents are never assigned
the same file. `interface_frozen` must be true before any module that depends on it starts.
Validate with `backbone.js modules`.

```backbone-modules
{
  "modules": [
    {
      "name": "example-module",
      "purpose": "one line",
      "paths": ["src/example/**"],
      "depends_on": [],
      "interface_frozen": false
    }
  ]
}
```

## Interface contracts

An agent building a dependent module reads only this section for its dependencies — never their internals.

### example-module

- **Exposes:** <!-- functions/endpoints/events with exact signatures, inputs, outputs, errors -->
- **Consumes:** <!-- what it needs from other modules -->
- **Invariants:** <!-- what callers may rely on -->
- **Frozen on:** <!-- date --> (freeze decision: DL-###)

## Dependency graph

Topological order — freeze interfaces in this order (`backbone.js modules` prints it):

<!-- fill: e.g. db-schema → auth → api → ui -->

## Claim/lock table

Maintained automatically by the `SubagentStart`/`SubagentStop` hooks and by
`backbone.js claim|release|verify`. Do not hand-edit: it is re-rendered from `claims.json`.
A module becomes `done` only when its verification gates pass.

<!-- backbone:claims:start -->
| Module | Status | Owning agent/session | Last updated | Notes |
|---|---|---|---|---|
<!-- backbone:claims:end -->
