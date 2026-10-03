# Subagent dispatch prompts — {{PROJECT}}

One prompt per module, for parallel execution against the module PRDs. The `[bb:<module>]` marker is
what the `SubagentStart` hook uses to claim the module in the claim/lock table — put it in **both**
the agent's short description and the first line of its prompt, and dispatch one module per agent.

Only dispatch a module whose dependencies' interfaces are frozen (`backbone.js modules` prints the
order and what is ready).

---

## {{MODULE}}

**Agent description (3–5 words):** `[bb:{{MODULE}}] build {{MODULE}} module`

**Prompt:**

```
[bb:{{MODULE}}]

You are implementing exactly one module of {{PROJECT}}: {{MODULE}}.

1. Read backbone/modules/{{MODULE}}.md first — it is self-contained and is your spec.
2. Read backbone/master-prd.md — its non-negotiables bind you (engineering standards, secrets policy,
   data model, non-functional bars).
3. You may only create or edit files inside this module's boundary, listed in its PRD. Every other
   path belongs to another agent working in parallel.
4. For anything you depend on, use only the interface contracts in backbone/architecture.md — never
   another module's internals. Do not change your own interface contract; if it must change, stop and
   report why.
5. Nothing is done until the module's verification gates pass. They run automatically when you finish;
   if they fail you will be sent back with the output.
6. Finish with [bb:{{MODULE}}] and a gate-by-gate report: each acceptance criterion, the gate that
   verifies it, and the evidence it passed.
```
