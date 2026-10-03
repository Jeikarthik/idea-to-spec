---
name: experience-design
description: Stage 9 — lock the project's design system before anyone builds UI — a contrast-checked palette, typography, spacing, radius and motion as machine-readable design tokens, the critical user flows and screens, and at T3+ components and states, voice and tone, and localisation; at T4 brand compliance and a WCAG 2.2 AA plan. Use after scope (and retention) at any tier when the project has a user-facing UI; close it as skipped when it does not.
---

# Stage 9 — Experience & Design

**Conditional at every tier: it runs only when there is a user-facing UI.** A CLI, an API or a data
pipeline closes it straight away: `stage 9 skipped --note "no user-facing UI: <what it is instead>"`.

Why this is a stage and not a styling afterthought: at T3+ several agents build UI modules in parallel.
Without one locked source each invents its own blues, spacing and button styles, and the product looks
like four products. The `backbone-tokens` block in `design.md` is to the UI what the module map is to the
file tree — and it is enforced the same way.

Scaffold once: `scaffold design`. The starter palette in the template is a neutral placeholder that
passes contrast; **replace it with this project's palette** — never ship the placeholder.

## 1. Inputs — derive, do not decorate

Read before choosing anything: who the user is and the real situation (`problem.md`), the job and the
feeling the product must carry (`canvas.md`), the North Star and habit loop (`retention.md`, T2+), the
market and any client brand (`viability.md`, T3+). Write the **Rationale** first, then the palette — the
palette follows from the rationale, not from taste.

Where an installed skill covers it, compose: `design-system` or `frontend-design` for tokens and
components, `accessibility` for the audit plan. Feed them these inputs and write their result into
`design.md`; the built-in steps below are the fallback.

## 2. Tokens, by tier

| Tier | What goes in the `backbone-tokens` block |
|---|---|
| T1 | `color` (about six roles: bg, surface, text, muted, primary, on-primary) and `font`. A sensible preset beats an afternoon of picking. |
| T2 | + `type_scale`, `space`, `radius`, and a `color_dark` palette with the same roles. |
| T3 | + `motion` (durations, easing). |
| T4 | Same groups, reconciled with the client's brand guide; every deviation explained in Rationale. |

Colour **roles**, not colour names: `primary`, `danger`, `surface` — not `blue-500`. A role survives a
rebrand; a name does not.

**`contrast_pairs` is mandatory.** List every foreground/background pair the UI actually uses:
`["text", "bg"]` (body text, 4.5:1), `["primary", "bg", "ui"]` (icons, focus rings, meaningful borders,
3:1), `["heading", "bg", "large"]` (≥24px or ≥19px bold, 3:1). Each pair is checked in every palette that
defines both colours.

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" tokens          # errors, warnings, and the contrast table
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" tokens --css src/styles/tokens.css   # export once valid
```

A failing pair is fixed by changing the colour, not by dropping the pair.

## 3. User flows and screens (all tiers)

- **T1:** the one flow the demo walks through, step by step, plus what happens if it fails on stage.
- **T2+:** every critical flow — the happy path and the top one or two failure paths (empty, error, slow,
  offline) — and the screen inventory with each screen's key states.

These flows are what the acceptance criteria (Stage 12) and the end-to-end tests are written against, so
name them clearly.

## 4. T3+ — components, voice, localisation

- **Components and states:** every reusable component with its states (default, hover, focus, disabled,
  loading, error, empty). Focus is always visible.
- **Voice and tone:** three adjectives, words to use and avoid, the error-message pattern.
- **Localisation** (when Stage 6 shows more than one locale or market): locales, string externalisation,
  date/number/currency formats, RTL, text-expansion budget. Otherwise write "single locale: <which>".

## 5. T4 — brand and accessibility

- Reconcile with the client brand guide; record each deviation and who approved it.
- WCAG 2.2 AA audit plan: keyboard paths, screen-reader checks, who audits and when.
- Log the design sign-off in `decision-log.md`.

## 6. Lock it

1. Adversarial pass (`backbone:adversarial-review`) on the palette and flows — the alternative-framing
   question is where "this looks like every other SaaS" gets caught.
2. Write **§8 Design Non-Negotiables** into `master-prd.md` with its `Sign-off: DL-###`.
3. In `architecture.md` (Stage 10), mark UI modules `"ui": true` — their agents receive the tokens as
   binding rules — and give each a gate `backbone: tokens --audit <its paths>`.
4. Close:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage 9 done
```

`stage 9 done` refuses while the token block is missing or invalid, any declared pair fails contrast, a
group required at this tier is absent, or the User flows section (and at T3+ Components) is unfilled.

## Push-back checklist

- A palette chosen before the rationale is decoration. Ask what the product should feel like, for whom.
- Pure black on pure white, or brand colours that fail contrast, are common — fix the colour.
- Dark mode bolted on later always misses states; define `color_dark` with the same roles now (T2+).
- At T1, an hour on tokens is an hour not on the demo. Preset, contrast-check, move on.
- Tokens change only here, behind an adversarial pass — never quietly in a component.
