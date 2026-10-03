---
name: problem-framing
description: Stage 1 — capture the problem from the real lived situation using 5W2H (all tiers), a JTBD core job statement and HMW reframing (T2+). Use when starting Backbone's problem identification, or when the problem statement is still fuzzy.
---

# Stage 1 — Problem Identification

The entry point at every tier. It starts from a real situation, not a market gap.

**Depth:** 5W2H at all tiers · JTBD core job statement at T2+ · HMW reframing at T2+ when the problem is
still fuzzy. Check the current tier with `backbone.js status`.

## Procedure

1. **Scaffold the file** (once):

   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" scaffold problem
   ```

2. **Anchor to the real situation — ask this first, always.**

   > What actually happened? Walk me through the last time you or someone you watched hit this.
   > Where were you, what were you trying to do, what went wrong, and what did it cost?

   Write it down concretely: the person, the moment, the cost. If the answer is abstract ("the market
   lacks a tool for X"), say so explicitly and push: whose experience is this? Abstract
   opportunity-spotting has to justify itself against a concrete anchor — not the other way around.
   Record the honest answer either way, including "no lived instance yet"; that becomes a blocking
   weakness at Stage 3, and hiding it now only wastes the later work.

3. **5W2H** — fill every row of the table in `problem.md`. "How much" takes units: minutes per week,
   currency per month, number of incidents. A vague answer here produces a vague scope later.

4. **JTBD core job statement (T2+):**

   > When \<situation\>, I want to \<motivation\>, so I can \<expected outcome\>.

   Keep it about the job, not your product. Note the related jobs and the emotional/social dimension.
   If a mature `jobs-to-be-done` skill is installed, invoke it and feed it the 5W2H content.

5. **HMW reframing (T2+, only when the problem is still fuzzy).** Write two or three "How might we …"
   variants at different altitudes, then pick one and say why. If the problem is already sharp, skip
   this and note that you did — not every project needs reframing.

6. **Write `brief.md`** (`scaffold brief`) — the one-page compressed opportunity statement. At T1 this is
   the main deliverable of the front half: someone reading only this page can repeat the problem, who has
   it, and why it is worth building.

7. **Close the stage:**

   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage 1 done
   ```

## Push-back checklist

Before closing, say out loud which of these is true — do not let them pass silently:

- The "problem" is a solution in disguise ("they need a dashboard") rather than a job.
- The cost in the 5W2H table is unquantified, so nobody can tell whether this is worth building.
- The person described is a composite or an imagined persona, not someone real.
- The frequency described is aspirational ("they'd use it daily") rather than observed.
