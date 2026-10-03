---
name: backbone-on
description: Turn Backbone back on for this project (or clear the global switch with --global), and show whether anything else is still keeping it off.
argument-hint: "[--global]"
---

# /backbone-on

Arguments: `$ARGUMENTS`

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" enable $ARGUMENTS
```

If the output says Backbone is **still off** (the other switch is set, or `BACKBONE_DISABLE=1` is in the
environment), tell the user which one, and how to clear it.

Once it is on, resume where the project left off:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" status
```

If there is no `state.md` yet, start with `backbone:triage`. Otherwise continue from the next stage
with `backbone:orchestrate`.
