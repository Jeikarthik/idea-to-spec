# The design system (Stage 9)

When several agents build UI modules at once, each one invents its own blues, spacing and buttons unless
something stops it. Backbone treats design the way it treats file ownership: one locked, machine-readable
source, checked and enforced.

## The token block

`design.md` carries a ` ```backbone-tokens ` JSON block:

```json
{
  "color":      { "bg": "#FFFFFF", "surface": "#F5F6F8", "text": "#16181D", "muted": "#5A6170",
                  "primary": "#2E5BDA", "on-primary": "#FFFFFF", "danger": "#B42318" },
  "color_dark": { "bg": "#0F1115", "text": "#ECEEF2", "muted": "#A1A8B5", "primary": "#7C9CFF", "on-primary": "#0F1115" },
  "font":       { "body": "Inter, system-ui, sans-serif" },
  "type_scale": { "sm": "14px", "base": "16px", "xl": "22px" },
  "space":      { "1": "4px", "2": "8px", "4": "16px" },
  "radius":     { "md": "8px" },
  "motion":     { "fast": "120ms", "easing": "cubic-bezier(0.2, 0, 0, 1)" },
  "contrast_pairs": [["text", "bg"], ["muted", "bg"], ["on-primary", "primary"], ["primary", "bg", "ui"]]
}
```

| Tier | Required groups |
|---|---|
| T1 | `color`, `font` |
| T2 | + `type_scale`, `space`, `radius` (and `color_dark` is expected) |
| T3 / T4 | + `motion` |

Colours are named by **role** (`primary`, `danger`, `surface`), never by hue.

## Contrast is checked, not hoped for

`contrast_pairs` lists every foreground/background pair the UI uses. Each is checked with the WCAG 2.x
formula in every palette that defines both colours:

| Kind | Minimum | Use for |
|---|---|---|
| `text` (default) | 4.5:1 | body text |
| `large` | 3:1 | ≥24px, or ≥19px bold |
| `ui` | 3:1 | icons, focus rings, borders that carry meaning |

```
$ node scripts/backbone.js tokens
PASS — tokens are valid at T3
Contrast:
- ok   text on bg (color): 17.76:1 (needs 4.5:1, text)
- ok   muted on bg (color): 6.22:1 (needs 4.5:1, text)
- ok   primary on bg (color): 5.79:1 (needs 3:1, ui)
…
```

A failing pair blocks `stage 9 done` and `check`. Fix the colour, not the pair list.

## From tokens to code

- `tokens --css src/styles/tokens.css` writes CSS custom properties: light values on `:root`, dark values
  under `prefers-color-scheme: dark` and `[data-theme="dark"]`. Components use `var(--color-primary)`,
  `var(--space-4)`, `var(--radius-md)`.
- Modules marked `"ui": true` in the module map get the tokens injected as binding rules when their agent
  starts.
- The gate `backbone: tokens --audit src/web` fails a module that contains colour literals not in the
  palette (4- and 8-digit hex with alpha are always flagged). A deliberate exception carries a
  `token-ok` comment on the same line; the generated CSS file is skipped.

## Beyond tokens

`design.md` also holds the rationale (why this palette, for whom), layout, the critical **user flows**
with their failure paths (which Stage 12 turns into end-to-end tests), the screen list, and from T3 the
component inventory with states, voice and tone, and the localisation plan; at T4 brand compliance and the
WCAG 2.2 AA audit plan. The rules every UI module must obey are locked into `master-prd.md` §8 behind an
adversarial pass.

Where the `design-system`, `frontend-design` or `accessibility` skills are installed, Stage 9 composes
them and writes their result into `design.md`.
