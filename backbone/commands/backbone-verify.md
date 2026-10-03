---
name: backbone-verify
description: Run the verification gates for a module or work package and update its status — the only way work is marked done. Pass a module name, a work-package id, or nothing to check the whole project.
argument-hint: "[<module> | --wp <id|all> | --confirm-manual]"
---

# /backbone-verify

Arguments: `$ARGUMENTS`

- A module name (T3+):

  ```
  node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" verify <module>
  ```

- A work package (T1/T2): `verify --wp <id>` or `verify --wp all`.
- Nothing: run `check` for the whole project (documents, signatures, module map, gates, `.env.example`),
  then `status`.

Report each gate as pass or fail with the failing output, and say plainly what the resulting status is.

**Manual gates.** A module or package with `manual:` gates stays `in-progress` until a human confirms
them. Ask the user directly whether they have verified each one, and only after they say yes:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" verify <module> --confirm-manual
```

Never pass `--confirm-manual` on your own judgement — the flag exists so that a person signs for what
only a person can see.

If a gate fails, fix the work rather than the gate. A gate edited to pass is the one failure mode this
whole mechanism exists to prevent; if a gate is genuinely wrong, say so explicitly and change it as a
spec correction, with the reason recorded.
