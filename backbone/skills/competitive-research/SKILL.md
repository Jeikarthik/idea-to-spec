---
name: competitive-research
description: Stage 2 — check prior art on the idea itself before building anything: a two-minute "has this been built" check at T1, a real competitor table at T2+, structured competitive analysis at T3+. Use after the problem is framed, or whenever someone asks whether this already exists.
---

# Stage 2 — Proactive/Competitive Research

Runs at **every tier**, at very different depths. It is proactive: run it on **the idea itself first**,
not only on downstream products. The cheapest possible outcome of Backbone is discovering in two minutes
that the exact thing already exists and is free.

## Depth by tier

| Tier | What happens |
|---|---|
| T1 | Two minutes: has this exact thing been built? If yes — does that change the demo? |
| T2 | Secondary research plus a real competitor table |
| T3/T4 | The table plus structured competitive analysis of the serious players |

## Procedure

1. **Search for the idea itself** — the problem phrased as someone suffering it would phrase it, plus
   the obvious product-category terms. Use the web tools available in this session. If none are
   available, say so plainly and mark the findings as unverified rather than reasoning from memory:
   a confident answer about what exists today is worse than an admitted gap.

2. **Record findings in the "Prior art and competitors" section of `problem.md`.** Always include:
   - **Do nothing** — what happens if the person just lives with it.
   - **The manual workaround** — the spreadsheet, the WhatsApp group, the intern. This is usually the
     real competitor.
   - Each real product: what it does well, where it fails *the person described in `problem.md`*, and
     the evidence for that (used it, read docs, read reviews — say which).

3. **T3+: structured competitive analysis.** If a `company-research` skill is installed, invoke it for
   each serious competitor and fold its output into the table. Otherwise cover, per competitor:
   positioning, pricing, target segment, funding/maturity signals, and the wedge they leave open.
   At T3+ this table also feeds `viability.md` in Stage 6 — do not duplicate the work there.

4. **State the conclusion explicitly.** One of:
   - This is already solved well → say it, and say what that means for the project.
   - It exists but fails this specific person → name the wedge.
   - It genuinely does not exist → say why you believe that, and what would falsify it.

5. **Close the stage:** `stage 2 done`.

## Push-back checklist

- "No competitors" almost always means the search was too narrow, or nobody wants this. Both are worth
  saying out loud.
- A competitor dismissed on brand impression rather than evidence is not a finding.
- If the prior art contradicts the problem statement in `problem.md`, surface the conflict now — do not
  let it survive into the canvas.
