---
name: triage
description: Stage 0 — classify the project into a depth tier (T1 hackathon, T2 solo long-term, T3 small team, T4 client/industry) and set which stages run at what depth. Use at the start of any new idea, when dropped into an existing half-built project (bootstrap mode), or when the user says the project's scope has changed.
---

# Stage 0 — Intake & Triage

The part no existing tool does: deciding how much process this project actually deserves. Spec Kit
assumes you already know your scope; BMAD has one binary fork. Backbone has four tiers, threaded
through every later stage.

## Which mode

- **No `state.md` and no existing code** → greenfield intake (§1).
- **No `state.md` but the repo already has code** → bootstrap mode (§2).
- **`state.md` exists and the user says the scope changed** → re-triage (§3).
- **`state.md` exists and nothing changed** → do not re-run. Use `backbone:orchestrate`.

## 1. Greenfield intake

Ask four direct questions — nothing else at this point:

1. **Timeframe** — hours, days, weeks, or months+?
2. **Team size** — how many people are actually building?
3. **Is there a real external stakeholder or client?** Someone outside the team who will use, buy, or
   sign off on this. "Might sell it later" is not one.
4. **Is this being judged or pitched?** A hackathon, demo day, investor meeting, internal review.

Then classify:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" triage --timeframe <hours|days|weeks|months> --team <n> --client <yes|no> --judged <yes|no>
```

Show the user the proposed tier, the rationale, and **every tension it surfaces**. A tension is a
question for the user, not something to resolve quietly — e.g. a real client on a two-day build.
The user may override the tier; if they do, record their reason verbatim.

Then open the project and start from the real situation:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" init --tier <T#> --mode greenfield --project-name "<name>" --reason "<the classification rationale, including any override>"
```

This writes `state.md` (tier + per-stage plan) and `decision-log.md`, and prints the full stage plan for
the tier. Walk the user through what will and will not run — especially what is skipped. Then:
`stage 0 done`.

**The first substantive question is never "what market are you targeting".** It is *what actually
happened to you or someone you watched* that surfaced this. If the idea came from market-gap spotting
instead, say so and note that it now has to justify itself against a concrete anchor in Stage 1.

## 2. Bootstrap mode (existing or half-built project)

Scan what the repo legitimately shows:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" scan --json
```

That returns the file tree, package manifests and scripts, test layout, migration directories, git
history summary, `.env.example` **key names only**, and candidate module directories.

**Infer only what is actually visible:**

- A first-pass `architecture.md`: module boundaries as they already exist in the code, the stack in use,
  and — clearly marked — what is real vs. what is stubbed.
- First-pass module PRDs (T3+) or `work-packages.md` (T1/T2) reflecting what is built vs. unbuilt.
- Where you are guessing, write "inferred from <file/pattern> — confirm".

**Never fabricate what the code cannot show.** Validation history, market fit, the Customer Validation
Score, and why the project was built this way are not recoverable from source. Do not invent plausible
answers and do not silently leave `master-prd.md` half-empty — a missing master PRD is exactly what lets
two agents later disagree about a non-negotiable. Ask the user, directly and briefly:

1. What real situation started this project?
2. Who is it for, and what evidence do you have that they have this problem?
3. What is explicitly out of scope?
4. What must never break or change (auth model, data model, compliance, performance bars)?
5. What is the tech stack you are committed to, and what is still open?
6. How do you know a change is done here — tests, review, manual check?
7. Has anyone outside the team used it yet? What did they say?

Classify the tier from the same four intake questions, then:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" init --tier <T#> --mode bootstrap --project-name "<name>" --reason "<rationale>"
```

Then scaffold the documents that apply at the tier (`scaffold <document>`), fill them from the scan and
the answers, and run `backbone:adversarial-review` on the reconstructed non-negotiables before they are
locked into `master-prd.md`. Mark stages that genuinely happened before Backbone as `done` with a note
saying how they were reconstructed; leave the rest `not-started`. Never mark a stage `done` on a guess.

## 3. Re-triage (explicit scope change only)

Triage happens once. Re-run it only when the user says the project changed — a prototype got funded, a
client appeared, a team build became a solo one:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" retier --tier <T#> --reason "<what changed>"
```

Completed work is kept. Stages that were done at a shallower depth are flagged `rework` with the new
depth; newly applicable stages reopen; unstarted stages that no longer apply close. Walk the user
through that diff before continuing, and log the change in `decision-log.md` (`Type: tier-change`).

## Opting out

Backbone is on by default. If the user does not want it, switch it off immediately — never argue:
`/backbone-off` (this project), `/backbone-off --global` (every project), or `--days <n>` for a snooze
that ends by itself. `/backbone-on` reverses it. Documents are never deleted by switching off.
