# Walkthrough: one project through all sixteen stages

This follows a fictional two-person team from a half-formed idea to a shipped product and its first
feedback checkpoint. Every command output below is **real output from Backbone 1.1.0**: the project was
driven through the CLI and hooks by a script. Two things are changed for reading. Paths are shortened to
`backbone/…`, and the script's stand-in test command (`node -e "process.exit(0)"`) is shown as the
`npm test -- tests/<module>` a real project would use. Some long outputs are trimmed with `…`. The
conversation around it shows what you would type in Claude Code and what Claude does with Backbone's
guidance.

---

## The persona

| | |
|---|---|
| **Who** | **Priya Raman** (she/her), a front-end developer who waited tables through college, and **Arjun Mehta** (he/him), a backend developer. Evenings and weekends. |
| **The spark** | Priya's cousin runs a 40-seat walk-in restaurant. On Friday nights the host keeps a paper waitlist, tells everyone "about 20 minutes", and watches a third of the parties walk away. |
| **What they want** | Something real restaurants would use, built in about three months, with Claude subagents doing much of the build in parallel. |
| **What they do not want** | Weeks of process. They are builders. |

The product becomes **TableReady**: guests scan a QR code at the door, wait anywhere, and get a
"table ready" text.

### How much is automatic

| Automatic: Backbone and Claude do it | Manual: Priya and Arjun do it, on purpose |
|---|---|
| Picking the next stage, the frameworks, and the depth | Answering the four triage questions |
| Scaffolding every document from a template | Real evidence: talking to hosts and owners |
| Refusing to close a stage without its evidence | Signing off each adversarial review |
| Contrast-checking the palette, exporting CSS | Choosing what the product should feel like |
| Claiming modules, injecting rules, running gates | Confirming `manual:` gates with their own eyes |
| Nudging when a feedback checkpoint is due | Talking to real users after launch |

They never type `stage 7 done`. Claude runs the CLI. They talk, decide and sign.

---

## Session start: an empty folder

Priya creates `tableready/`, opens Claude Code there, and types nothing yet. The SessionStart hook has
already told Claude where things stand:

```text
[Backbone] No state.md at backbone/state.md and no existing code — this is a greenfield project.
When the user starts describing an idea or asks to plan or build, begin with the backbone:triage skill
(Stage 0 intake): classify the tier, then set which stages are active and at what depth.
Open with the real, lived situation that surfaced the idea — not "what market are you targeting".
Stop switch: if the user asks to stop, pause, mute or turn off Backbone, do it at once …
```

> **Priya:** I want to build a waitlist app for restaurants.
>
> **Claude:** Before features — what happened that made you want this? Walk me through the last time
> you saw the problem.

The first question is about something that actually happened, not about a market.

---

## Stage 0 — Intake & Triage

Claude asks the four triage questions: how long, how many people, is there a real client, is it being
judged or pitched. Priya answers: about three months, two people, no client yet, not judged.

```text
$ backbone triage --timeframe months --team 2 --client no --judged no
Proposed tier: T3 — Small team (Weeks–months; ceremony: Medium)
Rationale:
- Team of 2 over months: full validation set, module PRDs, shared docs.
Tensions: none
```

Claude explains what T3 means: validation is required, the design gets locked, the build splits into
modules that parallel agents can own, and there is a release plan with a runbook. Priya agrees, and
Claude initialises the project. `backbone/state.md` and `backbone/decision-log.md` now exist, and the
plan for T3 is printed.

**Manual:** four answers. **Automatic:** the tier, the active stages, the depth of each.

## Stage 1 — Problem Identification

Claude runs 5W2H anchored to Priya's real Friday night, then a JTBD statement (T2+). It writes
`problem.md`:

> **Real situation:** Friday 8pm, 40-seat family restaurant, paper waitlist, 6 of 14 walk-in parties
> walked away, observed over three Fridays.
> **JTBD:** When the dining room is full, I want to let guests wait anywhere and come back on time, so I
> can seat every party I would otherwise lose.

## Stage 2 — Competitive Research

Claude checks whether the idea itself already exists (buzzers, reservation suites, existing waitlist
apps) and builds a real competitor table. The finding that shapes everything: reservation apps don't
fit walk-in-only places, and buzzers get lost or walk off.

## Stage 3 — Challenge & Validation, where Backbone pushes back

Priya is keen to move on. Claude drafts a Customer Validation Score from what they know so far. Backbone
refuses to close the stage:

```text
$ backbone stage 3 done
Cannot mark Stage 3 done:
- PAIN_UNEVIDENCED: Problem frequency rests on "assumed" evidence — needs a real lived/observed instance or stronger.
- PAIN_UNEVIDENCED: Problem severity rests on "assumed" evidence — needs a real lived/observed instance or stronger.
- GROUP_SCORING_REQUIRED: T3 requires group scoring (at least two scorers); got 1.
- Resolve the flags, or record a signed-off decision-log entry with "Type: override" and pass --override DL-###.
```

This is the product working. Claude gives them a short Mom Test script: ask about last Friday, not
about the app. Priya and Arjun talk to six hosts and two owners that week, then score together:

```text
$ backbone cvs --write
**CVS result (2026-10-03):** PASS · weighted 3.53/5 · pain avg 4 · market/scale avg 3 · scored by Priya, Arjun

| Parameter | Weight | Score | Evidence |
|---|---|---|---|
| Problem frequency | 3 | 4 | interviews |
| Problem severity | 3 | 4 | interviews |
| Willingness to adopt | 2 | 4 | interviews |
| Market growth | 1 | 3 | secondary |
…
```

At T3 the pre-mortem runs too ("It's a year from now and TableReady failed. Why?"). Its answers seed
the risk register (`scaffold risks`): *hosts won't type phone numbers at peak*, *SMS arrives late*,
*owners won't pay*. Then the stage closes:

```text
$ backbone stage 3 done
Stage 3 (Challenge & Validation) → done.
Next: Stage 4 — Problem & Solution Framing → backbone:solution-framing
```

**Manual:** eight real conversations, joint scoring. **Automatic:** the weighting (pain counts three
times as much as market size), the blocking flags, the score history.

## Stages 4–6 — Canvases, prioritization, viability

- **Stage 4** fills a Value Proposition Canvas and a full Lean Canvas, with "Existing alternatives"
  taken from the Stage 2 table rather than made up.
- **Stage 5** builds an Opportunity Solution Tree. Outcome: *seat more walk-in parties at peak*.
  Candidate solutions (SMS paging, a guest-facing live queue, a host tablet app) are scored with
  Opportunity Score.
- **Stage 6** (T3+) defines the market precisely: independent walk-in restaurants in one metro, not
  "restaurants". It maps buyer (owner), user (host) and payer (owner), and works out unit economics,
  including what SMS costs per seated party.

## Stage 7 — Scope Lock

Claude proposes a MoSCoW split and tries to lock it. Backbone stops it:

```text
$ backbone stage 7 done
Cannot mark Stage 7 done:
- master-prd.md "2. Locked Scope (MoSCoW)" has no "Sign-off: DL-###" line — not stress-tested before locking
```

So the adversarial review runs, and it earns its keep:

> **Weakest assumption:** hosts will type guests' phone numbers at peak.
> **Most likely failure:** hosts go back to paper on the busiest night.
> **Alternative framing:** guests add themselves by scanning a QR code at the door.
> **Resolution:** QR self-join becomes a Must; manual entry stays as the fallback.

Priya and Arjun sign it (`DL-001`), the scope section cites it, and the stage closes. The **Won't** list
says *reservations, payments, POS integration*. That list is what stops the scope creeping later.

## Stage 8 — Retention & Engagement

Hook Model for the host, AARRR, and a North Star Metric: **walk-in parties seated per peak night**. It
becomes the top of the discovery tree, master PRD §7, and later the dashboard in Stage 13.

## Stage 9 — Experience & Design

This is where Priya's taste matters, and where Backbone stops parallel agents from inventing four
different apps. Claude scaffolds `design.md` and checks it straight away:

```text
$ backbone stage 9 done
Cannot mark Stage 9 done:
- design.md still uses the template's placeholder palette — derive this project's palette from the Rationale
- design.md "User flows" section is unfilled
- design.md "Components and states" section is unfilled
```

Claude asks about the feeling rather than the colours. Hosts glance at a tablet in a dim, loud room;
guests check a phone on the pavement. Priya writes the rationale: warm neutrals like the restaurant, a
hyperlegible body font readable at arm's length, and saffron from the restaurant's sign as the brand
colour. The first palette uses that saffron as-is:

```text
$ backbone tokens
FAIL — 2 error(s) at T3
- ERROR: contrast on-primary on primary (color) is 2:1 — needs 4.5:1 for text
- ERROR: contrast primary on bg (color) is 1.94:1 — needs 3:1 for ui

Contrast:
- ok   text on bg (color): 16.75:1 (needs 4.5:1, text)
- FAIL on-primary on primary (color): 2:1 (needs 4.5:1, text)
- ok   on-primary on primary (color_dark): 9.35:1 (needs 4.5:1, text)
- FAIL primary on bg (color): 1.94:1 (needs 3:1, ui)
…
```

Saffron looks right and isn't readable: white text on it fails, and as a button colour on cream it
barely shows. Priya keeps saffron for dark mode, where it passes at 9.35:1, and deepens the light-mode
primary to burnt orange `#B4530A`:

```text
$ backbone tokens
PASS — tokens are valid at T3
Contrast:
- ok   on-primary on primary (color): 5.02:1 (needs 4.5:1, text)
- ok   primary on bg (color): 4.87:1 (needs 3:1, ui)
- ok   success on bg (color): 6.33:1 (needs 4.5:1, text)
…
$ backbone tokens --css src/web/styles/tokens.css
Wrote src/web/styles/tokens.css
```

Claude fills in the rest of `design.md`:
- **User flows:** *guest joins the queue* and *host seats a party*, each with its failure path. If the
  SMS doesn't arrive, the status page shows "ready" in large type. If the tablet goes offline, a banner
  appears and the queue is kept locally.
- **Screens:** Join, Status, Host queue.
- **Components with states:** QueueRow, with a 40px queue number.
- **Voice and tone:** "Your table is ready", never "You have been called".
- **Localisation:** single locale.

After an adversarial pass, master PRD **§8 Design Non-Negotiables** is locked, and the stage closes.

**Manual:** the feeling and the brand call. **Automatic:** the contrast maths in light and dark, the
CSS export, the refusal while the palette is a placeholder or a pair fails.

## Stage 10 — Architecture, with security

Claude drafts ADRs (one Next.js app for host and guest views), a C4 view, what must be real versus what
can be stubbed, a domain glossary (*Party*, *Ready*), and the module map. `web` is marked `"ui": true`:

```text
$ backbone modules
Module map valid.
Dependency order (freeze interfaces in this order):
1. db — interface not frozen; ready to start
2. api — interface not frozen; waiting on: db
3. sms — interface not frozen; waiting on: db
4. web — interface not frozen; waiting on: api, sms
```

Arjun wants to move on. Backbone refuses:

```text
$ backbone stage 10 done
Cannot mark Stage 10 done:
- security.md does not exist (scaffold security) — the threat model is required from T2
```

The threat model takes twenty minutes and changes the build:
- Guests could join another restaurant's queue, so the queue id becomes a signed token in the QR.
- Phone numbers would leak into logs, so they're masked.
- Phone numbers are personal data, so they're deleted 24 hours after seating. That also goes into
  master PRD §6.

Then the stage closes.

## Stage 11 — Work packages and handoff

Claude writes a self-contained PRD per module, each ending in executable gates. The `web` module's
gates include a design audit and a check only a person can do:

````markdown
```backbone-gates
npm test -- tests/web
backbone: tokens --audit src/web
manual: a host seats a party on a real tablet in service lighting
```
````

Every master PRD section cites a signed adversarial review, `.env.example` holds key names only, and the
stage closes.

### The parallel build

Arjun asks Claude to build all four modules at once. Claude dispatches four subagents tagged
`[bb:db]`, `[bb:api]`, `[bb:sms]` and `[bb:web]`. The web agent starts before its dependencies have
frozen their interfaces, and the SubagentStart hook stops it:

```text
[Backbone] Module "web" cannot start: dependency interfaces are not frozen yet (api, sms). Do not write
code. Stop now and report that it is blocked on those interface freezes.
```

Arjun freezes the `db`, `api` and `sms` contracts (logged as `DL-003`). Those three agents build and
pass their gates:

```text
[Backbone] db: all verification gates PASS — module marked done.
[Backbone] api: all verification gates PASS — module marked done.
[Backbone] sms: all verification gates PASS — module marked done.
```

The web agent is dispatched again. This time it gets the module and its rules, including the design:

```text
[Backbone] You own module "web" — claimed for subagent:general-purpose:agent-web-2 in the claim/lock table.
Binding rules for this module:
2. Only create or edit files inside this module's boundary: src/web/**. …
5. Nothing is done until the verification gates pass. …
8. Design is locked in backbone/design.md (master-prd.md §8). Use only its tokens — via the exported CSS
   variables (var(--color-<name>), var(--space-<n>), …) — never raw hex colours or ad-hoc sizes:
   colours: bg, surface, text, muted, primary, on-primary, success, danger (light + dark); type: sm, base,
   lg, xl, queue; spacing: 1, 2, 3, 4, 6, 8; radius: sm, md, full.
```

It still hard-codes a green for the "ready" row. When it tries to finish, the SubagentStop hook sends
it back:

```text
[Backbone] Module "web" is not done: its verification gates fail (attempt 1/2).
- PASS: npm test -- tests/web
- FAIL (exit 1): backbone: tokens --audit src/web
FAIL — 1 colour literal(s) bypass the design tokens:
- src/web/QueueRow.css:2 #2ecc71
```

It switches to `var(--color-success)`, and the automated gates pass. The module still isn't done,
because one gate needs a person:

```text
[Backbone] web: automated gates PASS. Manual gates need the user: a host seats a party on a real tablet
in service lighting — then run "verify web --confirm-manual".
```

On Friday Priya takes a tablet to her cousin's restaurant and watches the host seat three parties with
it. Then:

```text
$ backbone verify web --confirm-manual
- PASS: backbone: tokens --audit src/web
- MANUAL: a host seats a party on a real tablet in service lighting
→ web: DONE
```

**Manual:** freezing interfaces, the in-person check. **Automatic:** claims, conflict refusals, rule
injection, gate runs, sending agents back, marking modules done.

## Stage 12 — Success rubric and test strategy

Every requirement has Given/When/Then criteria tied to a gate. `test-strategy.md` maps each user flow
from `design.md` to an end-to-end test, turns the abuse cases from `security.md` (joining another
restaurant's queue) into tests, and lists what is deliberately not tested.

## Stage 13 — Release & Operations

Claude scaffolds `release.md` and tries to close the stage. At T3 Backbone wants more than a deploy
button:

```text
$ backbone stage 13 done
Cannot mark Stage 13 done:
- release.md "Environments" section is unfilled
- release.md "CI/CD" section is unfilled
- release.md "Rollback" section is unfilled
- release.md "Observability" section is unfilled
- release.md "Rollout strategy" section is unfilled
- release.md "Runbook" section is unfilled
```

They fill it in:
- **Environments:** a preview environment per pull request, plus production.
- **CI/CD:** GitHub Actions runs every module's `backbone-gates`, the same gates the agents had to pass.
- **Rollout:** three pilot restaurants for two weekends behind a flag, widened when abandoned parties
  drop below 15%.
- **Rollback:** instant redeploy of the previous build; tested once before launch.
- **Observability:** a dashboard of the North Star, SMS delivery rate and time-to-seat.
- **Runbook:** for example, *texts not arriving → switch hosts to status-page mode*.

They also review the risk register, and the "SMS arrives late" risk now has a mitigation. The stage
closes.

## Stage 14 — Packaging, then ship

A positioning pass for the pilot restaurants: one page, the North Star in the headline, and a demo built
on the guest flow. Then (for this transcript the ship date is back-dated nine days, so the next section
can show a checkpoint falling due):

```text
$ backbone ship --date 2026-09-24
Recorded ship date 2026-09-24. Feedback checkpoints are now scheduled.
$ backbone check
PASS — no errors
```

If they had shipped without closing Stage 13, `ship` would have warned them.

## Stage 15 — Feedback Loop

At the next session, before Priya types anything:

```text
[Backbone] Feedback checkpoint DUE for "TableReady": 9 day(s) since the ship date (2026-09-24);
cadence is every 7 day(s).
Raise this with the user at a natural point early in the session and use the backbone:feedback-loop skill …
Do not fabricate user feedback. If no real users were reached, log that honestly in feedback-log.md.
```

```text
$ backbone status
TableReady — T3 (Small team), greenfield; shipped: 2026-09-24
 0. [done       ] Intake & Triage (active)
 …
 9. [done       ] Experience & Design (conditional)
10. [done       ] Technical Feasibility & Architecture (active)
 …
13. [done       ] Release & Operations (active)
14. [done       ] Packaging (active)
15. [not-started] Feedback Loop (conditional) — Shipped 2026-09-24; weekly checkpoints begin.

Next: Stage 15 — Feedback Loop → invoke backbone:feedback-loop

Module claims:
- db: done — All gates passed …
- api: done — All gates passed …
- sms: done — All gates passed …
- web: done — Gates passed …

Feedback loop: DUE — 9 day(s) since ship date (cadence 7).
```

They visit the pilot restaurants and log what hosts actually did. They re-score the CVS with real
behaviour: two owners paid. They read the North Star off the dashboard. Then they re-run the discovery
tree branch the feedback points at: hosts want to text a party "five more minutes". That's a scope
change, so it goes back through Stage 7 with its own adversarial pass. The loop stays open.

## The stop switch

During a menu-launch week Priya wants Claude to just help with code:

```text
$ backbone disable --days 3 --reason menu launch week
Backbone is OFF for <project> until 2026-10-06 (it switches itself back on after that day).
Hooks, module claims and automatic gate runs stop immediately; your documents are untouched.
```

The next session starts with no Backbone guidance at all, and `switch` says why:

```text
$ backbone switch
Backbone is off for this project until 2026-10-06 (snooze) — menu launch week.
```

Three days later it is back on its own. In Claude Code she would simply type `/backbone-off --days 3`
or say "pause Backbone for a few days".

---

## The same idea at other tiers

| | T1: a weekend hackathon | T2: Priya alone, evenings | T4: built for a restaurant group |
|---|---|---|---|
| Skipped | Validation, canvases, prioritization, viability, retention, feedback loop | Viability; prioritization only if there are rival solutions | Nothing |
| Design | Preset palette, contrast-checked, one demo flow | Full tokens with dark mode, flows, screens | + the group's brand guide reconciled, WCAG 2.2 AA audit plan |
| Security | Not required | Threat model, secrets, auth | + PII inventory, retention, compliance mapping (e.g. GDPR for EU sites) |
| Handoff | One `work-packages.md`, Spec Kit | One `work-packages.md`, Spec Kit | Module PRDs, BMAD or parallel subagents |
| Release | Demo plan + recorded backup video | CI running gates, rollback, error tracking | + SLOs, incident process, restore drill |
| Packaging | Pitch reverse-engineered from the judging rubric | Landing-page narrative | GTM and a stakeholder-specific narrative |

The engine is the same. Depth follows the context, and the checks that matter — real pain,
signed-off decisions, contrast, gates — hold at every tier where they apply.
