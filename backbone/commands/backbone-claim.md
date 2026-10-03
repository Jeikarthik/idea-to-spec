---
name: backbone-claim
description: Claim a module for this session so no other agent or session edits it — for work done in the main session rather than by a dispatched subagent.
argument-hint: "<module> [--owner <name>]"
---

# /backbone-claim

Arguments: `$ARGUMENTS`

Subagents claim modules automatically (the `SubagentStart` hook reads the `[bb:<module>]` marker). Use
this when the **main session** — or a second terminal, or a teammate's session — is going to work on a
module directly.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" claim <module> --owner "session:<short name>"
```

Use a name a human will recognise later (`session:terminal-2`, `session:alex`). Before claiming, check
`modules` for dependency readiness.

The claim is refused when:

- another owner already holds the module — do not force it; tell the user who holds it and since when;
- the module is already `done` — reopening is the user's decision, not yours;
- a dependency's interface is not frozen yet — the module is not ready to start.

While you hold the claim, edit only files inside that module's boundary, and use other modules through
their interface contracts in `architecture.md`.

Release it when you stop, with a note:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" release <module> --note "<where you got to>"
```

`done` is never set by hand — it comes only from `verify` passing the module's gates.
