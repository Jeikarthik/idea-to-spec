# Experience & Design — {{PROJECT}}

**Tier:** {{TIER}} · **Last updated:** {{DATE}}

The UI contract every module builds against. The `backbone-tokens` block below is machine-readable:
`backbone.js tokens` checks it (required groups for the tier, valid colours, WCAG contrast on every
declared pair), `tokens --css <file>` exports it as CSS custom properties, and the gate
`backbone: tokens --audit <paths>` fails a module that hard-codes colours instead of using tokens.

> The starter values below are a neutral placeholder that passes contrast — replace them with this
> project's palette. Derive it from the audience, the brand (if any), and the feeling the product should
> carry; say why in **Rationale**. Change tokens only here, through an adversarial pass, never in code.

## Rationale

<!-- fill: who this is for, the feeling it should carry, brand constraints, and why these colours/fonts.
     At T4, cite the client brand guide and every deviation from it. -->

## Design tokens

Pair kinds: `text` needs 4.5:1, `large` (≥24px, or ≥19px bold) and `ui` (icons, borders that carry
meaning, focus rings) need 3:1. List every foreground/background pair the UI actually uses.

```backbone-tokens
{
  "color": {
    "bg": "#FFFFFF",
    "surface": "#F5F6F8",
    "text": "#16181D",
    "muted": "#5A6170",
    "primary": "#2E5BDA",
    "on-primary": "#FFFFFF",
    "danger": "#B42318",
    "success": "#1E7B44",
    "border": "#D5D9E0"
  },
  "color_dark": {
    "bg": "#0F1115",
    "surface": "#181B21",
    "text": "#ECEEF2",
    "muted": "#A1A8B5",
    "primary": "#7C9CFF",
    "on-primary": "#0F1115",
    "danger": "#F97066",
    "success": "#4ACB86",
    "border": "#2C313A"
  },
  "font": {
    "body": "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
    "heading": "Inter, system-ui, -apple-system, Segoe UI, sans-serif",
    "mono": "JetBrains Mono, ui-monospace, Consolas, monospace"
  },
  "type_scale": { "xs": "12px", "sm": "14px", "base": "16px", "lg": "18px", "xl": "22px", "2xl": "28px", "3xl": "36px" },
  "space": { "1": "4px", "2": "8px", "3": "12px", "4": "16px", "6": "24px", "8": "32px", "12": "48px" },
  "radius": { "sm": "4px", "md": "8px", "lg": "12px", "full": "999px" },
  "motion": { "fast": "120ms", "base": "200ms", "slow": "320ms", "easing": "cubic-bezier(0.2, 0, 0, 1)" },
  "contrast_pairs": [
    ["text", "bg"],
    ["text", "surface"],
    ["muted", "bg"],
    ["muted", "surface"],
    ["on-primary", "primary"],
    ["primary", "bg", "ui"],
    ["danger", "bg"],
    ["success", "bg"]
  ]
}
```

## Layout

<!-- fill: grid/max width, breakpoints, density, how the layout behaves at phone width. -->

## User flows

The critical paths — the ones the acceptance criteria and E2E tests are written against. At T1, the one
flow the demo walks through is enough.

### Flow 1 — <!-- fill: name -->

1. <!-- fill: step — screen — what the user does — what they see -->

**Failure paths:** <!-- fill: the top 1–2 ways this goes wrong (empty, error, slow, offline) and what the user sees -->

## Screens

| Screen | Purpose | Reached from | Key states |
|---|---|---|---|
| <!-- fill --> | | | |

## Components and states (T3+)

| Component | States (default/hover/focus/disabled/loading/error/empty) | Notes |
|---|---|---|
| <!-- fill, or "not applicable at T1/T2" --> | | |

Rules every module follows: visible focus ring on every interactive element; loading, empty and error
states designed, not left to chance; hit targets ≥ 44px on touch.

## Voice and tone (T3+)

<!-- fill: how the product speaks — 3 adjectives, words to use, words to avoid, error-message pattern. -->

## Localisation (T3+, when more than one locale or market)

<!-- fill: locales, string externalisation, date/number/currency formats, RTL, text expansion budget —
     or "single locale: <which>" -->

## Accessibility (T4: audit plan)

<!-- fill: target (WCAG 2.2 AA unless stated), keyboard paths, screen-reader checks, who audits and when. -->

## Do / don't

- Do: use tokens (`var(--color-primary)`), never raw hex in components.
- Don't: <!-- fill: project-specific -->
