# Backbone for Codex, Cursor and other harnesses

Backbone is Claude Code-first: the skills, slash commands and hooks in this plugin are Claude Code
components. Everything underneath them, though, is a plain Node CLI with no dependencies, so the same
process works in any harness that can run a command and read markdown.

Copy this file into the project root (as `AGENTS.md` for Codex, or as a rule file for Cursor) and adjust
`BACKBONE` to where the plugin lives.

---

## Backbone process (agent instructions)

```
BACKBONE="node /path/to/backbone/scripts/backbone.js"
```

**Before planning or building anything in this project**, run `$BACKBONE status`.

- No `state.md` → the project has not been triaged. Ask the four intake questions (timeframe, team size,
  real external client, judged/pitched), run `$BACKBONE triage --timeframe … --team … --client … --judged …`,
  confirm the tier and every tension it reports with the user, then `$BACKBONE init`. If the repo already
  has code, first run `$BACKBONE scan --json` and reconstruct `architecture.md` from what is actually
  there — never invent validation history or non-negotiables; ask instead.
- Otherwise take the next stage from `status`, run it at the depth `$BACKBONE plan` states, and close it
  with `$BACKBONE stage <id> done`.

Read `backbone/master-prd.md` before writing code: it is binding. Read your module's PRD in
`backbone/modules/<name>.md` (or `backbone/work-packages.md`) for scope, interface contract, acceptance
criteria and gates.

**Rules that do not depend on the harness:**

- Real pain over theoretical soundness; evidence beats an elegant document.
- Nothing is locked into `master-prd.md` without a written adversarial pass (weakest assumption, most
  likely failure, an alternative framing, conflicts with earlier evidence) and explicit user sign-off,
  recorded in `backbone/decision-log.md` and cited as `Sign-off: DL-###`.
- Nothing is done until its verification gates pass: `$BACKBONE verify <module>` or
  `$BACKBONE verify --wp <id>`.
- One agent owns one module. Claim it with `$BACKBONE claim <module> --owner "session:<name>"`, edit only
  files inside its boundary, consume other modules through their interface contracts only, and release
  with `$BACKBONE release <module> --note "…"`.
- After shipping, run `$BACKBONE feedback-due` at the start of a session and hold the checkpoint when it
  says DUE.

**What you lose outside Claude Code:** the `SessionStart` resume/bootstrap prompt, automatic module
claiming on subagent start, and automatic gate enforcement on subagent stop. Those are hooks. In another
harness, run the equivalent commands yourself at the same moments — the CLI is the same, and the state
files are identical, so a project can move between harnesses mid-build.
