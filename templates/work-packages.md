# Work Packages — {{PROJECT}}

**Tier:** {{TIER}} · **Last updated:** {{DATE}}

One file, because at this tier one agent is working at a time. `master-prd.md` binds everything here.
Each package is independently verifiable: nothing is done until its gates pass
(`backbone.js verify --wp <id>`).

## WP-1 — <!-- title -->

**Scope slice (from the locked MoSCoW):** <!-- fill: which Must/Should items this covers -->

**Touches:** <!-- fill: files/directories -->

**Depends on:** <!-- fill: other packages, or "nothing" -->

**Acceptance criteria**

- AC-1 — Given <!-- context -->, When <!-- action -->, Then <!-- observable result -->.
- AC-2 — Given …, When …, Then ….

**Definition of Done**

- All acceptance criteria verified by the gates below.
- Engineering standards in `master-prd.md` §5 hold (SOLID, separation of concerns, no hardcoded secrets).
- Migrations (if any) are ordered, commented, and reversible where practical.
- `.env.example` updated for any new variable; no real values committed.

**Environment/migration slice:** <!-- fill, or "none" -->

**Verification gates** — each line is run as a command from the project root; `manual:` lines can only
be confirmed by the user.

```backbone-gates WP-1
# npm test -- tests/example
# npm run lint
manual: <!-- what a human must see with their own eyes, if anything -->
```
