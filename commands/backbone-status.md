---
name: backbone-status
description: Show the Backbone state for this project — tier, per-stage status, the next stage, live module claims, and whether a feedback checkpoint is due.
---

# /backbone-status

Run:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" status
```

Then report to the user, briefly:

1. Project, tier and mode, and whether it has shipped.
2. The next stage and the skill that runs it. If everything applicable is closed, say so.
3. Any stage that is `blocked` or `rework`, with its note.
4. Modules currently claimed, and by whom — flag any claim whose owner is a subagent that is no longer
   running (`release <module> --note "<why>"` clears a stale claim).
5. Whether a feedback checkpoint is due.

If there is no `state.md`, do not improvise: this project has not been triaged. Offer
`backbone:triage` (bootstrap mode if the repo already has code).

$ARGUMENTS
