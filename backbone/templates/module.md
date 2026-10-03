# Module PRD — {{MODULE}}

**Project:** {{PROJECT}} · **Tier:** {{TIER}} · **Last updated:** {{DATE}}

Self-contained: an agent building this module should never need to read another module's PRD.
`master-prd.md` (non-negotiables) binds this module too.

## Purpose

<!-- fill: one paragraph — what this module is responsible for, and what it is explicitly not. -->

## Boundary — files this module owns

<!-- fill: the same paths as in architecture.md's backbone-modules block. Never edit outside them. -->

## Scope slice (from the locked MoSCoW)

**Must**
- <!-- fill -->

**Should**
- <!-- fill -->

**Could**
- <!-- fill -->

**Won't**
- <!-- fill -->

## Interface contract

Copied verbatim from `architecture.md`. Do not change it here; an interface change is a decision
recorded in `decision-log.md` by the orchestrator.

- **Exposes:** <!-- exact signatures/endpoints/events, inputs, outputs, errors -->
- **Consumes (dependencies' contracts only, never their internals):** <!-- fill -->
- **Invariants callers may rely on:** <!-- fill -->

## Acceptance criteria

- AC-1 — Given <!-- context -->, When <!-- action -->, Then <!-- observable result -->. Verified by: G1
- AC-2 — Given …, When …, Then …. Verified by: G1

## Definition of Done

- Every acceptance criterion above is verified by a named gate below, and that gate passes.
- Engineering standards in `master-prd.md` §5 hold.
- Only files inside this module's boundary changed.
- Interface contract unchanged (or the change is logged and signed off).
- `.env.example` and migrations updated for anything this module added.

## Environment variables added

<!-- fill, or "none" — key names only, values go in .env -->

## Migration slice

<!-- fill, or "none" — ordered, commented, reversible where practical -->

## Verification gates

Run automatically when an agent working on this module finishes. Each non-comment line is a command
executed from the project root; `manual:` lines can only be confirmed by the user
(`backbone.js verify {{MODULE}} --confirm-manual`).

```backbone-gates
# G1
# npm test -- tests/{{MODULE}}
manual: <!-- what a human must verify, if anything -->
```
