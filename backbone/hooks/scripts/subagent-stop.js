#!/usr/bin/env node
'use strict';

/**
 * SubagentStop: verification-gate enforcement and claim release. When a subagent that claimed a
 * module stops, its module's automated gates run. Failing gates block the stop (up to a retry limit)
 * so the subagent keeps working; passing gates mark the module done. Nothing is marked done otherwise.
 */

const fs = require('fs');
const { readStdinJson, readText, timestamp } = require('../../scripts/lib/io');
const { isDisabled } = require('../../scripts/lib/switch');
const { projectDir, docsDir, docPaths, modulePrdPath } = require('../../scripts/lib/paths');
const claimsLib = require('../../scripts/lib/claims');
const { extractGates, runGates, summarizeResults } = require('../../scripts/lib/gates');

function maxBlocks() {
  const n = Number(process.env.BACKBONE_GATE_MAX_BLOCKS);
  return Number.isInteger(n) && n >= 0 ? n : 2;
}

function main() {
  const input = readStdinJson();
  const project = projectDir({ input });
  const docs = docsDir(project);
  const p = docPaths(docs);
  if (isDisabled(p)) return;
  if (!input.agent_id || !fs.existsSync(p.claims)) return;

  const claims = claimsLib.loadClaims(docs);
  const name = claims.agents[input.agent_id];
  // Only subagents that SubagentStart actually mapped to a module are acted on.
  if (!name) return;

  const gates = extractGates(readText(modulePrdPath(docs, name)) || '');
  const automated = gates.flatMap((g) => g.automated);
  const manual = gates.flatMap((g) => g.manual);
  const now = new Date();

  if (!automated.length && !manual.length) {
    claimsLib.transact(docs, (c) => claimsLib.releaseModule(c, name, {
      status: 'in-progress', notes: 'Agent stopped; module PRD defines no verification gates — cannot be marked done.', now,
    }));
    process.stdout.write(JSON.stringify({ systemMessage: `[Backbone] ${name}: no verification gates defined in modules/${name}.md; claim released, module stays in-progress.` }));
    return;
  }

  const runEnabled = process.env.BACKBONE_RUN_GATES !== '0';
  const timeoutSec = Number(process.env.BACKBONE_GATE_TIMEOUT_SEC || 300);
  const run = automated.length && runEnabled
    ? runGates(automated, { cwd: project, timeoutSec })
    : { passed: automated.length === 0, results: [], skipped: automated.length > 0 };

  if (run.skipped) {
    claimsLib.transact(docs, (c) => claimsLib.releaseModule(c, name, {
      status: 'in-progress', notes: `Agent stopped ${timestamp(now)}; automated gates not run (BACKBONE_RUN_GATES=0). Run verify.`, now,
    }));
    process.stdout.write(JSON.stringify({ systemMessage: `[Backbone] ${name}: gate execution disabled; module stays in-progress until "verify ${name}" passes.` }));
    return;
  }

  if (run.passed) {
    const note = manual.length
      ? `Automated gates passed ${timestamp(now)}; awaiting user confirmation of manual gates: ${manual.join('; ')}`
      : `All gates passed ${timestamp(now)}.`;
    claimsLib.transact(docs, (c) => claimsLib.releaseModule(c, name, { status: manual.length ? 'in-progress' : 'done', notes: note, now }));
    process.stdout.write(JSON.stringify({
      systemMessage: manual.length
        ? `[Backbone] ${name}: automated gates PASS. Manual gates need the user: ${manual.join('; ')} — then run "verify ${name} --confirm-manual".`
        : `[Backbone] ${name}: all verification gates PASS — module marked done.`,
    }));
    return;
  }

  const summary = summarizeResults(run);
  const outcome = claimsLib.transact(docs, (c) => {
    const record = claimsLib.moduleRecord(c, name);
    const attempts = (record.gate_attempts || 0) + 1;
    if (attempts <= maxBlocks()) {
      c.modules[name] = { ...record, gate_attempts: attempts, updated: timestamp(now), notes: `Gates failing (attempt ${attempts}/${maxBlocks()}).` };
      return { block: true, attempts };
    }
    claimsLib.releaseModule(c, name, {
      status: 'in-progress', notes: `Gates still failing after ${attempts - 1} retry(ies); claim released ${timestamp(now)}.`, now,
    });
    return { block: false, attempts };
  });

  if (outcome.block) {
    process.stdout.write(JSON.stringify({
      decision: 'block',
      reason: `[Backbone] Module "${name}" is not done: its verification gates fail (attempt ${outcome.attempts}/${maxBlocks()}).\n${summary}\nFix the failures inside this module's boundary, re-run the gates yourself, then finish with [bb:${name}] and a gate-by-gate report.`,
    }));
    return;
  }
  process.stdout.write(JSON.stringify({
    systemMessage: `[Backbone] ${name}: gates still failing after the retry limit — claim released, module stays in-progress.\n${summary}`,
  }));
}

try {
  main();
} catch (err) {
  process.stderr.write(`[backbone] subagent-stop hook failed: ${err.stack || err.message}\n`);
}
