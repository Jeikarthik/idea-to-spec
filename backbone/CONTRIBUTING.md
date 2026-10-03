# Contributing

Backbone is plain Node (18+) with no dependencies. `npm test` runs everything.

## Ground rules

- **Prove it on a real project first.** Run the change through a real T1 project before trusting it at
  T3/T4. The walkthrough in `examples/` is the shape to follow.
- **Orchestrate, don't reimplement.** If a mature framework or skill exists, compose it and add a
  minimal fallback; do not rebuild it.
- **Enforce what matters, recommend the rest.** A new hard check must protect something an agent would
  otherwise fake (evidence, sign-off, verification). Everything else is guidance in a skill.
- **Never fabricate.** No check or skill may produce validation evidence, user feedback or sign-offs.

## Layout

| Path | What lives there |
|---|---|
| `data/stages.json` | The single source of truth: stages, per-tier applicability and depth, frameworks, documents |
| `scripts/backbone.js` | The CLI |
| `scripts/lib/` | Pure libraries: state, stages, lint, gates, design tokens, claims, CVS, switch |
| `hooks/` | SessionStart, SubagentStart, SubagentStop |
| `skills/<name>/SKILL.md` | One skill per stage plus `orchestrate` and `adversarial-review` |
| `templates/` | Every document `scaffold` can create |
| `tests/` | `node:test` suites; `helpers.js` isolates every run in temp dirs |

## Adding a stage

1. Add it to `data/stages.json` at its position, with `key`, `skill`, `documents`, per-tier `tiers`, and
   `frameworks`. Ids are positions, so later stages shift.
2. Bump `STATE_VERSION` in `scripts/lib/state.js`. `migrateState` matches stages by **skill**, so old
   states upgrade without losing work — add a unit test that proves it.
3. Write `skills/<skill>/SKILL.md` and any template; register the template in `scripts/lib/templates.js`.
4. If the stage has an enforced closure, add it to `enforceClose` in `scripts/backbone.js` and to
   `checkProject` in `scripts/lib/lint.js` — **by stage key**, never by number.
5. Update stage numbers in skills, README and `docs/stages.md`; add a CHANGELOG entry.

## Tests

- Tests never touch the real home directory: `BACKBONE_HOME` points at a temp dir in `tests/helpers.js`.
- Prefer CLI-level tests (`h.cli`) and hook-level tests (`h.hook`) over unit tests for behaviour users
  see; unit-test the pure libraries.
- Gate commands in tests use `h.PASS_CMD` / `h.FAIL_CMD` so they run on every OS.

## Releasing

1. Update `version` in `package.json`, `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`.
2. Add the CHANGELOG entry.
3. `npm test` and `claude plugin validate .` must both pass; CI runs the tests on Windows, macOS and
   Linux.
4. Tag `vX.Y.Z` and push. Users update with `/plugin marketplace update`.
