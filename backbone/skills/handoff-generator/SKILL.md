---
name: handoff-generator
description: Stage 11 — produce the locked engineering handoff: master-prd.md, architecture.md, per-module PRDs (T3+) or work-packages.md (T1/T2), SQL migrations, prerequisites and .env.example, each with verification gates — then route execution to Spec Kit (T1/T2) or BMAD/parallel subagents (T3/T4).
---

# Stage 11 — Work Packages & Engineering Handoff

Backbone's locked artifact contract. This is the output everything upstream was for: a spec an agent can
execute without re-deriving context, and without colliding with another agent.

## 1. The artifacts

| Artifact | Tiers | Command |
|---|---|---|
| `master-prd.md` — the non-negotiables | all | `scaffold master-prd` |
| `architecture.md` — decisions, boundaries, contracts, claim/lock table | all (multi-agent parts T3+) | `scaffold architecture` |
| `modules/<name>.md` — per-module PRDs | T3+ | `scaffold module --name <module>` |
| `work-packages.md` — single file, one agent | T1/T2 | `scaffold work-packages` |
| `migrations/NNNN_<name>.sql` | if there is a persistence layer | `scaffold migration --name <name>` |
| `prerequisites.md` + `.env.example` | if there is any external dependency | `scaffold prerequisites`, `scaffold env-example` |

Skip the migrations entirely when the project has no persistence layer, and the credentials list when it
has no external dependency. Do not generate empty ceremony.

## 2. master-prd.md — the non-negotiables

Locked scope (from Stage 7) and the validated opportunity statement; tech stack and why (from the ADRs);
global data model; engineering standards; global non-functional constraints; North Star Metric and
success rubric. Every section cites a signed-off adversarial pass (`Sign-off: DL-###`).

The engineering standards section is enforced, not advisory: SOLID as the default bar, clean separation of
concerns with explicit interfaces, migrations safe and reversible where practical, secrets only via
`.env`/secret management, and a testable acceptance criterion plus a named verification gate for every
requirement.

If a `prd-development` skill is installed, use it for the drafting and keep Backbone's section structure.

## 3. Module PRDs (T3+) — self-contained by construction

One per module from the boundary map. Each must stand alone: an agent building it should never need to
read another module's PRD. It carries that module's Must/Should/Could slice, its interface contract copied
from `architecture.md`, Given/When/Then acceptance criteria, its Definition of Done, its migration and
`.env` additions, and its verification gates.

## 4. Verification gates — the difference between a standard and a rule

Every module PRD (or work package) ends with an executable gate block:

````markdown
```backbone-gates
npm test -- tests/auth
npm run lint -- src/auth
manual: a human completes a real login in the browser
```
````

Each non-comment line runs from the project root and must exit 0. `manual:` lines can only be confirmed by
the user. These are not decoration: when a subagent finishes, the SubagentStop hook runs these commands,
blocks the stop while they fail, and marks the module done only when they pass. Every acceptance criterion
must name the gate that verifies it.

Write gates that actually fail when the work is wrong. A gate of `echo ok` is worse than no gate, because
it launders unverified work as done.

## 5. Check before handing off

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" check
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" modules
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage 11 done
```

`stage 11 done` refuses while a PRD section is unsigned, a module PRD lacks gates or Given/When/Then,
the module map overlaps, or `.env.example` holds something that looks like a real secret.

## 6. Route the execution (Section 8)

Backbone decides which pipeline fires and pre-fills its inputs. It does not reimplement either.

**T1/T2 → Spec Kit.**

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" scaffold speckit-constitution
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" scaffold speckit-spec
```

Fill both from the locked documents. If Spec Kit is installed in the project (a `.specify/` directory),
put the constitution where its config expects it — otherwise hand the files to the user and run
`/specify → /plan → /tasks → /implement` with the spec seed as input.

**T3/T4 → BMAD, or parallel subagents.**

- BMAD: `scaffold bmad-brief`, fill it, and write it where the installed BMAD version expects (check its
  `core-config.yaml` — commonly `docs/brief.md`, `docs/prd.md`, `docs/architecture.md`). Then run the
  Analyst → PM → Architect → SM → Dev → QA pipeline with story-sharding. `master-prd.md` stays binding.
- Parallel subagents: `scaffold dispatch --name <module>` per module, then dispatch one agent per module
  whose dependencies are frozen. The `[bb:<module>]` marker must appear in **both** the agent's
  description and its prompt — that is what claims the module. Then watch with `status`; conflicts,
  unfrozen dependencies and failing gates are handled by the hooks, not by trust.

Dispatch only what `modules` reports as ready. Everything else waits for an interface freeze.
