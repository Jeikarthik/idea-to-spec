# Parallel agents without collisions

At T3+, `architecture.md` carries a machine-readable module map, and every module has a self-contained
PRD ending in executable gates. That is what lets several agents build at once.

## The module map

```json
{ "modules": [
  { "name": "api",  "purpose": "endpoints", "paths": ["src/api/**"], "depends_on": ["db"], "interface_frozen": false },
  { "name": "web",  "purpose": "screens",   "paths": ["src/web/**"], "depends_on": ["api"], "ui": true, "interface_frozen": false }
] }
```

- **No two modules may own overlapping paths** — enforced by `backbone.js modules`.
- **`depends_on` must form a DAG**; the CLI prints the topological order, and a module cannot start until
  its dependencies' interfaces are frozen (log each freeze in `decision-log.md`).
- **`"ui": true`** marks a module that renders interface: its agent receives the design tokens from
  `design.md` as binding rules (see [design-system.md](design-system.md)).

## Claiming and verification are automatic

- Dispatch a subagent with `[bb:<module>]` in its description and prompt. The `SubagentStart` hook claims
  the module, injects its boundary, interface rules, gates — and for UI modules the design tokens — and
  refuses the claim if another agent holds it or its dependencies are not frozen.
- When that agent stops, the `SubagentStop` hook runs the module's gates, blocks the stop while they fail
  (with the failing output, up to `BACKBONE_GATE_MAX_BLOCKS`), and marks the module `done` only when they
  pass.
- For the main session or a second terminal, claim by hand with `/backbone-claim`.

## Verification gates

Each module PRD or work package ends with an executable block:

````markdown
```backbone-gates
npm test -- tests/auth
npm run lint -- src/auth
backbone: tokens --audit src/web
manual: a human completes a real login in the browser
```
````

- Plain lines are shell commands run from the project root; they must exit 0.
- `backbone: <command>` runs the Backbone CLI directly, without a shell, so it behaves the same on
  Windows, macOS and Linux.
- `manual:` gates can only be confirmed by a person: `/backbone-verify <module> --confirm-manual`.
- Every acceptance criterion (Given/When/Then) names the gate that verifies it. Nothing is marked done
  any other way — not by an agent asserting it, and not by hand.

> **Gate lines are executed as shell commands** by the CLI and the `SubagentStop` hook. Treat a module PRD
> like a build script: review gates in a repo you did not write. Set `BACKBONE_RUN_GATES=0` to disable
> automatic execution (modules then stay `in-progress` until someone runs `verify`).
