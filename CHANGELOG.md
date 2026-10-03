# Changelog

All notable changes. Versions follow [Semantic Versioning](https://semver.org/): a new stage or a new
enforced check is a minor version; anything that breaks an existing `state.md`, document format or CLI
contract without a migration is a major version.

## 1.1.0 — 2026-10-03

### Added
- **Stage 9 — Experience & Design** (`experience-design` skill, `design.md` template). Design tokens in a
  machine-readable `backbone-tokens` block, required groups per tier, WCAG contrast checks on every
  declared colour pair, user flows and screens, components/voice/localisation at T3+, brand and WCAG 2.2
  AA plan at T4. Master PRD §8 Design Non-Negotiables.
- `tokens` command: validate + contrast table, `--css` export (light/dark custom properties), `--audit`
  to fail on colour literals that bypass the tokens.
- **Stage 13 — Release & Operations** (`release-ops` skill, `release.md` template): demo plan at T1;
  environments, CI/CD, rollback, observability at T2; rollout, runbook, risk review at T3; SLOs,
  incidents and restore drill at T4. `ship` warns when it is not closed.
- Security & privacy in Stage 10 (`security.md`): threat model from T2, data classification from T3,
  personal data and compliance mapping at T4; domain glossary (T3+) and run cost per ADR (T4).
- Test strategy in Stage 12 (`test-strategy.md`, T2+); risk register seeded by the Stage 3 pre-mortem
  (`risks.md`, T3+).
- Built-in gate form `backbone: <command>` that runs the CLI without a shell, so gates behave the same
  on every OS.
- `"ui": true` on a module: its agent is handed the design tokens as binding rules at SubagentStart.
- Stop switch: `/backbone-off` and `/backbone-on`, global (`--global`) and snooze (`--days`) scopes,
  `switch` to see what is keeping it off; the session honours "stop Backbone" in plain language.
- `docs/`, `examples/walkthrough.md`, CONTRIBUTING, CI on Windows/macOS/Linux.

### Changed
- Stages renumbered: Architecture 9→10, Handoff 10→11, Success Rubric 11→12, Packaging 12→14,
  Feedback Loop 13→15. Enforcement is now keyed by stage, not number.
- Seven stages now refuse to close without their evidence (was four).

### Migration
- A `state.md` written by 1.0 is upgraded on first read: stages are matched by skill, status and notes
  carry over, and the two new stages are added as `not-started`. No action needed.

## 1.0.0

Initial release: fourteen depth-tiered stages, triage and bootstrap mode, Customer Validation Score,
adversarial review, master PRD, module map with automatic claim/verify hooks, verification gates,
feedback loop.
