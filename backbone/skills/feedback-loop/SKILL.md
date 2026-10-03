---
name: feedback-loop
description: Stage 13 — the post-ship checkpoint: collect real reactions from actual users, re-score the Customer Validation Score with real data, and re-run the relevant discovery-tree branch to choose the next iteration. Use after shipping at T2+, on the weekly cadence, or when the session reports a feedback checkpoint is due.
---

# Stage 13 — Feedback Loop

**T2+, after ship.** A scheduled checkpoint, not a one-time stage. The point is not automating validation
— that is impossible — it is making sure the process does not quietly skip *collecting* real signal once
deadline pressure hits.

Record the ship date once: `backbone.js ship --date YYYY-MM-DD`. After that the session tells you when a
checkpoint is due (default: weekly). Check any time:

```
node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" feedback-due
```

## The checkpoint

1. **Get real reactions from actual users.** Same Mom Test discipline as Stage 3: what did they *do*, not
   what do they think of it. Watch a session if you can; a recorded session beats a survey.

   If nobody was reached this cycle, write exactly that in `feedback-log.md`. An honest "0 users reached,
   here is why" is useful data about the process; an invented summary is corrosive, and an agent must
   never write feedback that no user gave.

2. **Read the North Star Metric** (Stage 8) and its input metrics. Note the number, the period, and
   anything that makes it unreliable.

3. **Re-score the Customer Validation Score with real data.** Post-ship, evidence grades should be moving
   from `interviews` toward `behavioral` — actual usage, payment, retention. If the weighted score dropped,
   say so plainly; that is the loop doing its job.

   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" cvs --write
   ```

   Append the new reading to the score-history table with what changed and why.

4. **Re-run the relevant branch of the Opportunity Solution Tree.** An OST is not a one-time diagram.
   Update `discovery-tree.md`: add opportunities the feedback revealed, prune the ones it killed,
   re-prioritise the candidates, and record the change with its reason in the change history.

   At T2 there may be no tree yet (Stage 5 is T3+). Create a light one now from what the feedback showed
   — the loop needs somewhere to put what it learns — and note in `decision-log.md` why it was created
   below its usual tier.

5. **Decide the next iteration** and write it in `feedback-log.md` under today's `## YYYY-MM-DD` heading.
   If the decision changes the locked scope, that is a Stage 7 change: adversarial pass, sign-off,
   updated `master-prd.md`. If it changes the tier (a side project acquiring a paying client), re-triage.

6. **Leave the loop open.** Stage 13 does not close permanently — set it back to `in-progress` after each
   checkpoint, or `done` only when the project genuinely stops.

## Push-back checklist

- Compliments are not retention; usage is.
- A metric that improved while the validated pain did not is worth investigating before celebrating.
- If three checkpoints in a row reached zero users, the problem is the process, not the product. Say so.
