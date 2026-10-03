# Decision Log — {{PROJECT}}

Chronological "why" record. Every lock into `master-prd.md`, every frozen interface, and every
override of a blocking validation flag has an entry here, so a later agent does not relitigate it.

Entry types: `adversarial-review` (required before anything is locked into `master-prd.md`),
`interface-freeze`, `override` (proceeding past a blocking Customer Validation Score flag),
`tier-change`, `decision` (everything else).

Ids are sequential: DL-001, DL-002, … Entries are appended below this line; the shape is:

```markdown
## DL-001 — {{DATE}} — <title>

- Type: adversarial-review
- Stage: <0-15>
- Subject: <what was reviewed: the scope lock, a canvas, an architecture choice, a plan>
- Weakest assumption: <the one most likely to be wrong>
- Most likely failure: <how this actually fails in practice>
- Alternative framing: <at least one genuinely different way to see this>
- Conflicts with earlier evidence: <name them, or "none found">
- Resolution: <what changed as a result, or why it stands unchanged>
- Signed off by: <who, and when — an unfilled value fails `backbone.js check`>
```

An `override` entry (proceeding past a blocking validation flag) needs `Type`, `Stage`, `Reason` and
`Signed off by`. An `interface-freeze` entry names the module, the frozen contract, and why it is shaped
that way, so a later agent does not relitigate it.

---
