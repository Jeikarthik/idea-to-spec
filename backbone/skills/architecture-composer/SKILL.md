---
name: architecture-composer
description: Stage 9 — technical feasibility lenses, build vs buy vs partner, ADRs, C4, what must be real vs stubbed, and at T3+ the module boundary map, interface contracts and dependency graph that let several agents build in parallel. Use before work packages are generated.
---

# Stage 9 — Technical Feasibility & Architecture

Runs at every tier, scaled: informal feasibility plus a real-vs-stubbed list at T1; ADRs and C4-Context
at T2; the full set plus the module boundary map at T3+.

Scaffold once: `scaffold architecture`.

## 1. Feasibility lenses (all tiers)

Technical, resource, timeline, risk — each with the consequence, not just a verdict. At T1 this is four
sentences. The output that matters most at T1:

**What must be real vs. what can be stubbed.** Name every capability and decide deliberately. A demo with
a stubbed payment provider and a real core loop wins; the reverse loses. Write where the seam is, so the
stub is visible rather than accidentally load-bearing.

## 2. Build vs. Buy vs. Partner (T3+)

Per capability, with the reversal cost — the number that usually decides it.

## 3. ADRs (T2+)

One entry per decision that would be expensive to reverse: context, decision, consequences. Lightweight
prose at T2; formal and numbered at T4. Every ADR that becomes a non-negotiable also goes into
`master-prd.md` §3 behind an adversarial pass.

## 4. C4 (T2+)

Context only at T2 — who uses the system and what it talks to. Container and Component at T3+. Diagrams
are welcome but the words are what agents read.

## 5. Module boundary map (T3+) — the part that enables parallel agents

Fill the `backbone-modules` block in `architecture.md`:

```json
{
  "modules": [
    { "name": "db-schema", "purpose": "tables, migrations, seed data", "paths": ["migrations/**", "src/db/**"], "depends_on": [], "interface_frozen": false },
    { "name": "auth", "purpose": "sessions and permissions", "paths": ["src/auth/**"], "depends_on": ["db-schema"], "interface_frozen": false }
  ]
}
```

Rules the CLI enforces (`backbone.js modules`):

- **No two modules may own overlapping paths.** Two agents must never be assigned the same file. If a file
  is genuinely shared, it belongs to exactly one module and the others consume it through an interface.
- **`depends_on` must form a DAG** — a cycle means the boundaries are wrong, not that the tool is strict.
- Modules are sized so one agent can finish one: a few files, one coherent responsibility.

## 6. Interface contracts (T3+)

For each module: what it **exposes** (exact signatures, endpoints, events, inputs, outputs, errors), what
it **consumes**, and the invariants callers may rely on. An agent building a dependent module reads only
this — never another module's internals. That is what actually makes parallel work possible.

**Freezing:** set `"interface_frozen": true` only when the contract is stable enough for others to build
against, and log the freeze in `decision-log.md` (`Type: interface-freeze`) with *why it is shaped that
way*, so a later agent does not relitigate it. `backbone.js modules` prints the topological order — freeze
in that order; a module whose dependencies are unfrozen cannot be claimed, and the SubagentStart hook will
stop an agent that tries.

## 7. Close

Adversarial pass on the stack and boundary decisions (the alternative framing question is where a simpler
architecture usually appears), then:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" modules
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage 9 done
```

## Push-back checklist

- A module map that mirrors the org chart rather than the data flow will produce constant cross-edits.
- If every module depends on every other, the boundaries are notional — redraw them.
- An interface frozen before anyone has tried to build against it usually thaws immediately; freeze the
  smallest useful surface instead.
- At T1, architecture beyond "what's real, what's stubbed" is ceremony. Stop.
