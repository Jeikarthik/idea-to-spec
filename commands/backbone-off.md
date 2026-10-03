---
name: backbone-off
description: Stop switch — turn Backbone off for this project (or every project with --global), optionally as a snooze that ends by itself after N days.
argument-hint: "[--global] [--days <n>] [--reason <text>]"
---

# /backbone-off

Arguments: `$ARGUMENTS`

Backbone is on by default. This is the voluntary way out — do it straight away, without trying to talk
the user out of it.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" disable $ARGUMENTS
```

- No arguments: off for **this project** until someone runs `/backbone-on`.
- `--global`: off for **every project** on this machine.
- `--days <n>`: a snooze — Backbone switches itself back on after that many days.
- `--reason "<text>"`: recorded in the flag file so the user remembers why later.

What stops immediately: the session-start guidance, the feedback nudge, automatic module claims, and
automatic gate runs. Nothing is deleted — `backbone/` documents, state and claims stay exactly as they are.

Then, for the rest of this session, stop applying the Backbone operating rules and work normally. Tell
the user in one line what was switched off, and that `/backbone-on` turns it back on.
