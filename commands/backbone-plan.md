---
name: backbone-plan
description: Print the stage plan for this project's tier — which stages fire, at what depth, which frameworks each one runs, and which documents belong at this tier.
argument-hint: "[--tier T1|T2|T3|T4]"
---

# /backbone-plan

Arguments: `$ARGUMENTS`

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" plan $ARGUMENTS
```

With no argument this uses the project's current tier; pass `--tier T#` to see what a different tier
would run — useful when the user is deciding whether a re-triage is warranted.

Summarise for the user rather than pasting the whole output: which stages are active, which are skipped
at this tier **and why that is deliberate**, and where they are now. The most useful part of this output
is usually what is *not* going to happen.
