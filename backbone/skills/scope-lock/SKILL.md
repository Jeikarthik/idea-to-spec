---
name: scope-lock
description: Stage 7 — lock scope with MoSCoW (every tier), breaking ties numerically with RICE/ICE at T3+, and write the locked scope into master-prd.md behind an adversarial pass. Use when the candidate feature set must become a committed scope.
---

# Stage 7 — Scope Lock

Fires at **every tier**: a five-minute Must/Won't split at T1, a full requirements pass at T4. The output
is the locked scope section of `master-prd.md`, and everything downstream depends on it.

## Procedure

1. **Assemble the candidates**: the chosen bet from Stage 5 (if it ran), the Must-have implications of the
   validated pain, and anything the user has been assuming silently — ask for that explicitly.

2. **MoSCoW.**
   - **Must** — without it, the thing does not do its job. At T1 this is usually one path.
   - **Should** — painful to omit, survivable.
   - **Could** — nice, first to be cut.
   - **Won't (this cycle)** — the most valuable list in the document. Write it in full; it is what stops
     scope drift and what an agent later cites when someone asks for "just one more thing".

   Test every Must against the validated pain: if it does not serve the pain in `validation.md` (or, at
   T1, the demo in `packaging.md`), it is not a Must.

3. **Numeric tie-breaking (T3+, only when the backlog is large enough to need it).** RICE or ICE via
   `prioritization-frameworks` if installed. Record inputs, not just totals.

4. **Timebox check.** Against the timeframe from Stage 0, is the Must list actually buildable? If not, cut
   now rather than discovering it at the deadline. At T1 be brutal: a working demo of one path beats three
   half-paths, and judges score completeness.

5. **Write it into `master-prd.md` §2** (`scaffold master-prd` if it does not exist yet).

6. **Adversarial pass — required before locking.** Run `backbone:adversarial-review` on the scope: weakest
   assumption, most likely failure, at least one alternative framing (usually "cut it further"), conflicts
   with earlier evidence. Get explicit sign-off, log it, and cite it as `Sign-off: DL-###` in §2.

7. **Close:**

   ```
   node "${CLAUDE_PLUGIN_ROOT}/scripts/backbone.js" stage 7 done
   ```

   This refuses until §2 cites a complete, signed-off adversarial review. It is the mechanism that stops a
   scope from being locked just because it was generated confidently.

## After the lock

The locked scope is binding on every agent and module. Changing it later is a decision: re-run the
adversarial pass, log it, update §2. Do not let scope drift in through a module PRD.
