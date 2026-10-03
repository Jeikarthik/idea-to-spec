#!/usr/bin/env node
'use strict';

/**
 * SessionStart: resume from state.md when present; otherwise trigger Stage 0 —
 * bootstrap mode for an existing/half-built project, greenfield intake for a blank one.
 */

const path = require('path');
const { readStdinJson } = require('../../scripts/lib/io');
const { isDisabled } = require('../../scripts/lib/switch');
const { PLUGIN_ROOT, projectDir, docsDir, docPaths } = require('../../scripts/lib/paths');
const { readState, nextStage } = require('../../scripts/lib/state');
const { tierInfo } = require('../../scripts/lib/stages');
const { loadClaims } = require('../../scripts/lib/claims');
const { scanProject } = require('../../scripts/lib/detect');

function emit(context) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
  }));
}

const RULES = [
  'Backbone operating rules (binding for planning and build work in this project):',
  '- Real pain over theoretical soundness: evidence of a lived, frequently-experienced pain outweighs an elegant canvas or a large TAM.',
  '- Problem identification starts from the real situation that surfaced the idea, not a market gap.',
  '- Nothing is locked into master-prd.md until backbone:adversarial-review has run (weakest assumption, most likely failure, an alternative framing) and the user has explicitly signed off.',
  '- Where a framework output conflicts with earlier evidence, surface the conflict — never quietly reconcile it.',
  '- Depth follows the tier: run only the frameworks the tier activates, at the stated depth.',
  '- If the user explicitly says the project has changed scope, re-run backbone:triage (re-triage) before continuing.',
];

/** The voluntary stop switch. Backbone stays on unless the user asks for it to stop. */
function stopSwitch(cli) {
  return [
    'Stop switch: if the user asks to stop, pause, mute or turn off Backbone, do it at once without arguing — run',
    `${cli} disable (this project) or ${cli} disable --global (every project); add --days <n> for a snooze that ends by itself.`,
    'After that, drop the Backbone rules above for the rest of this session and work normally. "enable" (or /backbone-on) turns it back on.',
  ].join(' ');
}

function resumeContext(state, docs, p, cli) {
  const info = tierInfo(state.tier);
  const next = nextStage(state);
  const lines = [
    `[Backbone] Resuming "${state.project}" — ${state.tier} (${info.label}), ${state.mode} mode. Documents: ${docs}`,
    next
      ? `Next: Stage ${next.id} — ${next.name} [${next.status}] → use the backbone:${next.skill} skill. Depth: ${next.depth}`
      : 'All applicable stages are closed.',
  ];
  const rework = state.stages.filter((s) => s.status === 'rework');
  if (rework.length) lines.push(`Stages needing rework after re-triage: ${rework.map((s) => `${s.id} ${s.name}`).join('; ')}.`);
  const blocked = state.stages.filter((s) => s.status === 'blocked');
  if (blocked.length) lines.push(`Blocked stages: ${blocked.map((s) => `${s.id} ${s.name}${s.notes ? ` (${s.notes})` : ''}`).join('; ')}.`);
  try {
    const claims = loadClaims(docs);
    const active = Object.entries(claims.modules).filter(([, r]) => r.status === 'in-progress');
    if (active.length) {
      lines.push(`Modules in progress (do not edit their files without claiming): ${active.map(([n, r]) => `${n} (${r.owner || 'unowned'}${r.notes ? `; ${r.notes}` : ''})`).join('; ')}.`);
    }
  } catch (err) {
    lines.push(`claims.json is unreadable: ${err.message}`);
  }
  lines.push(
    'When the user works on this project\'s planning or build, continue from the next stage; never skip an active stage silently.',
    ...RULES,
    `CLI: ${cli} <command> (status, next, stage, claim, release, verify, cvs, check, retier, ship).`,
    stopSwitch(cli),
  );
  return lines.join('\n');
}

function missingStateContext(project, docs, p, cli) {
  const scan = scanProject(project, { docsDir: docs });
  if (scan.existing) {
    const signals = [
      scan.manifests.length && `manifests: ${scan.manifests.join(', ')}`,
      `${scan.sourceFiles} source file(s)`,
      `${scan.testFiles} test file(s)`,
      scan.git.repo && `${scan.git.commits} commit(s)`,
      scan.migrationDirs.length && `migrations: ${scan.migrationDirs.join(', ')}`,
    ].filter(Boolean).join('; ');
    return [
      `[Backbone] No state.md at ${p.state}, but this is an existing project (${signals}).`,
      'Stage 0 BOOTSTRAP MODE applies: before any other planning or implementation work in this project, use the backbone:triage skill in bootstrap mode.',
      'Bootstrap mode infers only what the repo legitimately shows (file tree, manifests, tests, git history → first-pass architecture.md and module PRDs of what is built vs. stubbed).',
      'It never fabricates validation history, market fit, the Customer Validation Score, or why the project was built this way — it asks the user a short, direct set of questions for the non-negotiables instead, and does not skip that step.',
      stopSwitch(cli),
      ...RULES,
    ].join('\n');
  }
  return [
    `[Backbone] No state.md at ${p.state} and no existing code — this is a greenfield project.`,
    'When the user starts describing an idea or asks to plan or build, begin with the backbone:triage skill (Stage 0 intake): classify the tier, then set which stages are active and at what depth.',
    'Open with the real, lived situation that surfaced the idea — not "what market are you targeting".',
    stopSwitch(cli),
    ...RULES,
  ].join('\n');
}

function main() {
  const input = readStdinJson();
  const project = projectDir({ input });
  const docs = docsDir(project);
  const p = docPaths(docs);
  if (isDisabled(p)) return;
  const cli = `node "${path.join(PLUGIN_ROOT, 'scripts', 'backbone.js')}"`;

  let state;
  try {
    state = readState(p.state);
  } catch (err) {
    emit(`[Backbone] ${p.state} exists but is malformed: ${err.message}\nTell the user, and repair the backbone-state block before doing any stage work. Do not overwrite it with a fresh init.`);
    return;
  }
  emit(state ? resumeContext(state, docs, p, cli) : missingStateContext(project, docs, p, cli));
}

try {
  main();
} catch (err) {
  process.stderr.write(`[backbone] session-start hook failed: ${err.stack || err.message}\n`);
}
