#!/usr/bin/env node
'use strict';

/**
 * Backbone CLI — the deterministic half of the orchestration: tier gating, state, claim/lock,
 * verification gates, Customer Validation Score, and document checks. Skills call this; it never
 * invents content.
 */

const fs = require('fs');
const path = require('path');
const paths = require('./lib/paths');
const stages = require('./lib/stages');
const stateLib = require('./lib/state');
const claimsLib = require('./lib/claims');
const modulesLib = require('./lib/modules');
const gatesLib = require('./lib/gates');
const cvsLib = require('./lib/cvs');
const lint = require('./lib/lint');
const templates = require('./lib/templates');
const triage = require('./lib/triage');
const detect = require('./lib/detect');
const { feedbackStatus } = require('./lib/feedback');
const switchLib = require('./lib/switch');
const designLib = require('./lib/design');
const { readText, writeFileAtomic, today, timestamp } = require('./lib/io');
const { replaceRegion } = require('./lib/markdown');

class UsageError extends Error {}

const USAGE = `Backbone CLI

Usage: node backbone.js <command> [args] [--project <dir>]

  triage --timeframe hours|days|weeks|months --team <n> --client yes|no --judged yes|no [--json]
  init --tier T1..T4 --mode greenfield|bootstrap --project-name <name> --reason <text>
  retier --tier T1..T4 --reason <text>
  plan [--tier T1..T4]
  scaffold <document> [--name <module|migration-name>] [--force]
        documents: ${Object.keys(templates.DOCUMENTS).join(', ')}
  status [--json]
  next [--json]
  stage <id> <status> [--note <text>] [--override DL-###]
        status: ${stateLib.STATUSES.join(' | ')}
  ship [--date YYYY-MM-DD]
  feedback-due [--json]
  scan [--json]
  modules
  claim <module> --owner <owner> [--force]
  release <module> [--status unclaimed|in-progress] [--note <text>]
  verify <module> [--confirm-manual]
  verify --wp <id|all> [--confirm-manual]
  cvs [--write]
  check
  tokens [--tier T1..T4] [--json]                      validate design.md tokens + WCAG contrast table
  tokens --css <file>                                  export tokens as CSS custom properties
  tokens --audit <path> [<path>...]                    fail on colour literals that bypass the tokens (use as a gate)
  disable [--global] [--days <n>] [--reason <text>]   stop switch (project, or every project)
  enable [--global]
  switch [--json]                                      is Backbone on or off here, and why`;

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) flags[key] = true;
      else { flags[key] = next; i++; }
    } else {
      positional.push(a);
    }
  }
  return { positional, flags };
}

function requireFlag(flags, name) {
  const v = flags[name];
  if (v === undefined || v === true || String(v).trim() === '') throw new UsageError(`--${name} is required.`);
  return String(v);
}

function context(flags) {
  const project = paths.projectDir({ override: typeof flags.project === 'string' ? flags.project : undefined });
  const docs = paths.docsDir(project);
  return { project, docs, p: paths.docPaths(docs) };
}

function loadStateOrFail(ctx) {
  const state = stateLib.readState(ctx.p.state);
  if (!state) throw new UsageError(`No state.md at ${ctx.p.state}. Run Stage 0 (backbone:triage) first.`);
  return state;
}

function print(obj, asJson, text) {
  process.stdout.write(`${asJson ? JSON.stringify(obj, null, 2) : text}\n`);
}

/* ------------------------------------------------------------------ commands */

function cmdTriage({ flags }) {
  const result = triage.classify({
    timeframe: requireFlag(flags, 'timeframe'),
    team: requireFlag(flags, 'team'),
    client: requireFlag(flags, 'client'),
    judged: requireFlag(flags, 'judged'),
  });
  const info = stages.tierInfo(result.tier);
  const text = [
    `Proposed tier: ${result.tier} — ${info.label} (${info.timeframe}; ceremony: ${info.ceremony})`,
    'Rationale:',
    ...result.rationale.map((r) => `- ${r}`),
    result.tensions.length ? 'Tensions to confirm with the user:' : 'Tensions: none',
    ...result.tensions.map((t) => `- ${t}`),
  ].join('\n');
  print(result, flags.json, text);
}

function cmdInit({ flags }) {
  const ctx = context(flags);
  if (fs.existsSync(ctx.p.state)) {
    throw new UsageError(`state.md already exists at ${ctx.p.state}. Use "retier" for a scope change.`);
  }
  const state = stateLib.createState({
    project: requireFlag(flags, 'project-name'),
    tier: requireFlag(flags, 'tier'),
    mode: requireFlag(flags, 'mode'),
    reason: requireFlag(flags, 'reason'),
  });
  fs.mkdirSync(ctx.docs, { recursive: true });
  stateLib.writeState(ctx.p.state, state);
  const gitignore = path.join(ctx.docs, '.gitignore');
  if (!fs.existsSync(gitignore)) fs.writeFileSync(gitignore, '.lock/\n*.tmp\n', 'utf8');
  if (!fs.existsSync(ctx.p.decisionLog)) {
    writeFileAtomic(ctx.p.decisionLog, templates.render('decision-log.md', { PROJECT: state.project, TIER: state.tier, DATE: today() }));
  }
  process.stdout.write(`Initialized Backbone at ${ctx.docs} — ${state.tier}, ${state.mode}.\n\n${stages.renderPlan(state.tier)}\n`);
}

function cmdRetier({ flags }) {
  const ctx = context(flags);
  const state = loadStateOrFail(ctx);
  const from = state.tier;
  stateLib.retier(state, requireFlag(flags, 'tier'), requireFlag(flags, 'reason'));
  stateLib.writeState(ctx.p.state, state);
  const changed = state.stages.filter((s) => ['rework', 'not-started'].includes(s.status) && s.notes);
  process.stdout.write(`Re-triaged ${from} → ${state.tier}.\n`);
  for (const s of changed) process.stdout.write(`- Stage ${s.id} ${s.name}: ${s.status} — ${s.notes}\n`);
}

function cmdPlan({ flags }) {
  let tier = flags.tier;
  if (!tier) tier = loadStateOrFail(context(flags)).tier;
  process.stdout.write(`${stages.renderPlan(String(tier))}\n`);
}

function cmdScaffold({ positional, flags }) {
  const ctx = context(flags);
  const state = loadStateOrFail(ctx);
  const [key] = positional;
  const doc = templates.DOCUMENTS[key];
  if (!doc) throw new UsageError(`Unknown document "${key}". Known: ${Object.keys(templates.DOCUMENTS).join(', ')}.`);
  const name = typeof flags.name === 'string' ? flags.name : null;
  if (doc.needsName && !name) throw new UsageError(`"${key}" requires --name.`);
  if (name && !/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new UsageError('--name must be kebab-case.');
  if (!doc.tiers.includes(state.tier) && !flags.force) {
    throw new UsageError(`"${key}" does not apply at ${state.tier} (applies at ${doc.tiers.join(', ')}). Use --force only with a reason recorded in decision-log.md.`);
  }
  const dest = doc.dest(ctx, name);
  if (fs.existsSync(dest) && !flags.force) throw new UsageError(`${dest} already exists. Edit it, or pass --force to overwrite.`);
  const content = templates.render(doc.template, {
    PROJECT: state.project, TIER: state.tier, DATE: today(), MODULE: name || '', NAME: name || '',
  });
  writeFileAtomic(dest, content);
  process.stdout.write(`Created ${dest}\n`);
}

function claimsSummary(ctx) {
  const claims = claimsLib.loadClaims(ctx.docs);
  let modules = [];
  try {
    modules = claimsLib.readModules(ctx.docs);
  } catch { /* reported by check */ }
  const names = [...new Set([...modules.map((m) => m.name), ...Object.keys(claims.modules)])];
  return names.map((name) => ({ module: name, ...claimsLib.moduleRecord(claims, name) }));
}

function cmdStatus({ flags }) {
  const ctx = context(flags);
  const state = loadStateOrFail(ctx);
  const next = stateLib.nextStage(state);
  const claims = claimsSummary(ctx);
  const feedback = feedbackStatus(state, readText(ctx.p.feedbackLog));
  const info = stages.tierInfo(state.tier);
  const lines = [
    `${state.project} — ${state.tier} (${info.label}), ${state.mode}; shipped: ${state.shipped_at || 'no'}`,
    '',
    ...state.stages.map((s) => `${String(s.id).padStart(2)}. [${s.status.padEnd(11)}] ${s.name} (${s.applicability})${s.notes ? ` — ${s.notes}` : ''}`),
    '',
    next ? `Next: Stage ${next.id} — ${next.name} → invoke backbone:${next.skill}` : 'Next: all applicable stages are closed.',
  ];
  if (claims.length) {
    lines.push('', 'Module claims:');
    for (const c of claims) lines.push(`- ${c.module}: ${c.status}${c.owner ? ` (${c.owner})` : ''}${c.notes ? ` — ${c.notes}` : ''}`);
  }
  if (feedback.applicable) {
    lines.push('', `Feedback loop: ${feedback.due ? 'DUE' : 'not due'} — ${feedback.daysSince} day(s) since ${feedback.anchorKind} (cadence ${feedback.cadence}).`);
  }
  print({ state, next, claims, feedback }, flags.json, lines.join('\n'));
}

function cmdNext({ flags }) {
  const state = loadStateOrFail(context(flags));
  const next = stateLib.nextStage(state);
  const out = next ? { id: next.id, name: next.name, skill: `backbone:${next.skill}`, applicability: next.applicability, depth: next.depth, status: next.status } : null;
  print(out, flags.json, out ? `Stage ${out.id} — ${out.name} [${out.status}] → ${out.skill}\nDepth: ${out.depth}` : 'All applicable stages are closed.');
}

/** Stage closures that Backbone enforces rather than recommends. Returns a note suffix or throws. */
function enforceClose(ctx, state, id, flags) {
  const entries = lint.parseDecisionLog(readText(ctx.p.decisionLog) || '');
  const fail = (msgs) => {
    throw new UsageError(`Cannot mark Stage ${id} done:\n${msgs.map((m) => `- ${m}`).join('\n')}`);
  };
  const key = stages.stageById(id).key;
  if (key === 'challenge-validation') {
    const { error, result } = lint.evaluateCvs(ctx.docs, state.tier);
    if (error) fail([error]);
    if (result.verdict !== 'pass') {
      if (!flags.override) fail([...result.blocking, 'Resolve the flags, or record a signed-off decision-log entry with "Type: override" and pass --override DL-###.']);
      const err = lint.checkDecisionRef(entries, String(flags.override), 'override');
      if (err) fail([err]);
      return `Override: ${flags.override}`;
    }
  }
  if (key === 'scope-lock') {
    const errs = lint.checkMasterPrd(ctx.docs, entries, { onlyHeading: /scope/i });
    if (errs.length) fail(errs);
  }
  if (key === 'experience-design') {
    const { errors } = lint.checkDesign(ctx.docs, state.tier);
    if (errors.length) fail([...errors, `No user-facing UI? Close it with: stage ${id} skipped --note "<why there is no UI>"`]);
  }
  if (key === 'technical-feasibility-architecture') {
    const errs = lint.checkSecurity(ctx.docs, state.tier);
    if (errs.length) fail(errs);
  }
  if (key === 'work-packages-handoff') {
    const errs = [...lint.checkMasterPrd(ctx.docs, entries), ...lint.checkWorkUnits(ctx.docs, state.tier).errors, ...lint.checkEnvExample(ctx.project)];
    if (errs.length) fail(errs);
  }
  if (key === 'success-rubric-evals') {
    const errs = lint.checkWorkUnits(ctx.docs, state.tier).errors;
    if (errs.length) fail(errs);
  }
  if (key === 'release-operations') {
    const errs = lint.checkRelease(ctx.docs, state.tier);
    if (errs.length) fail(errs);
  }
  if (key === 'feedback-loop' && !state.shipped_at) fail(['Project has not shipped; the feedback loop starts after ship.']);
  return '';
}

function cmdStage({ positional, flags }) {
  const ctx = context(flags);
  const [idRaw, status] = positional;
  const id = Number(idRaw);
  const last = stages.stageCount() - 1;
  if (!Number.isInteger(id) || id < 0 || id > last) throw new UsageError(`stage <id> must be 0–${last}.`);
  if (!status) throw new UsageError('stage <id> <status> requires a status.');
  stateLib.assertStatus(status);
  const state = loadStateOrFail(ctx);
  const stage = state.stages[id];
  if (stage.applicability === 'skip' && !['skipped', 'done'].includes(status)) {
    throw new UsageError(`Stage ${id} (${stage.name}) does not apply at ${state.tier}.`);
  }
  let note = typeof flags.note === 'string' ? flags.note : undefined;
  if (status === 'done') {
    const suffix = enforceClose(ctx, state, id, flags);
    if (suffix) note = note ? `${note} ${suffix}` : suffix;
  }
  if (status === 'skipped' && stage.applicability !== 'skip' && !note) {
    throw new UsageError(`Stage ${id} is ${stage.applicability} at ${state.tier}; skipping it needs --note with the reason.`);
  }
  stateLib.setStageStatus(state, id, status, note);
  stateLib.writeState(ctx.p.state, state);
  const next = stateLib.nextStage(state);
  process.stdout.write(`Stage ${id} (${stage.name}) → ${status}.\n${next ? `Next: Stage ${next.id} — ${next.name} → backbone:${next.skill}` : 'All applicable stages are closed.'}\n`);
}

function cmdShip({ flags }) {
  const ctx = context(flags);
  const state = loadStateOrFail(ctx);
  const date = typeof flags.date === 'string' ? flags.date : today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new UsageError('--date must be YYYY-MM-DD.');
  state.shipped_at = date;
  const feedback = state.stages[stages.idOf('feedback-loop')];
  if (state.tier !== 'T1' && feedback.status === 'not-started') {
    feedback.notes = `Shipped ${date}; weekly checkpoints begin.`;
  }
  stateLib.writeState(ctx.p.state, state);
  const release = state.stages[stages.idOf('release-operations')];
  const warn = ['done', 'skipped'].includes(release.status)
    ? ''
    : `\nWarning: Stage ${release.id} (${release.name}) is ${release.status} — shipping without a rollback plan or demo backup is a choice worth logging in decision-log.md.`;
  process.stdout.write(`Recorded ship date ${date}.${state.tier === 'T1' ? ' (Feedback loop does not apply at T1.)' : ' Feedback checkpoints are now scheduled.'}${warn}\n`);
}

function cmdFeedbackDue({ flags }) {
  const ctx = context(flags);
  const status = feedbackStatus(loadStateOrFail(ctx), readText(ctx.p.feedbackLog));
  const text = !status.applicable
    ? `Not applicable: ${status.reason}`
    : `${status.due ? 'DUE' : 'Not due'}: ${status.daysSince} day(s) since ${status.anchorKind} (${status.anchor}); cadence ${status.cadence} day(s).`;
  print(status, flags.json, text);
}

function cmdScan({ flags }) {
  const ctx = context(flags);
  const result = detect.scanProject(ctx.project, { full: true, docsDir: ctx.docs });
  print(result, flags.json, JSON.stringify(result, null, 2));
}

function cmdModules({ flags }) {
  const ctx = context(flags);
  const md = readText(ctx.p.architecture);
  if (md === null) throw new UsageError('architecture.md does not exist.');
  const modules = modulesLib.parseModules(md);
  if (!modules) throw new UsageError('architecture.md has no ```backbone-modules block.');
  const { errors, order } = modulesLib.validateModules(modules);
  if (errors.length) {
    process.stdout.write(`Module map INVALID:\n${errors.map((e) => `- ${e}`).join('\n')}\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write('Module map valid.\nDependency order (freeze interfaces in this order):\n');
  order.forEach((name, i) => {
    const m = modules.find((x) => x.name === name);
    const blocked = modulesLib.unfrozenDependencies(modules, name);
    process.stdout.write(`${i + 1}. ${name} — interface ${m.interface_frozen ? 'FROZEN' : 'not frozen'}; ${blocked.length ? `waiting on: ${blocked.join(', ')}` : 'ready to start'}\n`);
  });
}

function requireModule(ctx, name) {
  if (!name) throw new UsageError('A module name is required.');
  const modules = claimsLib.readModules(ctx.docs);
  const mod = modules.find((m) => m.name === name);
  if (!mod) throw new UsageError(`Module "${name}" is not in the architecture.md module boundary map.`);
  return { modules, mod };
}

function cmdClaim({ positional, flags }) {
  const ctx = context(flags);
  const [name] = positional;
  const { modules } = requireModule(ctx, name);
  const owner = requireFlag(flags, 'owner');
  const unfrozen = modulesLib.unfrozenDependencies(modules, name);
  if (unfrozen.length && !flags.force) {
    throw new UsageError(`Cannot claim ${name}: dependency interfaces not frozen: ${unfrozen.join(', ')}.`);
  }
  const result = claimsLib.transact(ctx.docs, (claims) => claimsLib.claimModule(claims, name, owner, { force: Boolean(flags.force) }));
  if (!result.ok) {
    throw new UsageError(result.reason === 'done'
      ? `${name} is already done. Use --force only if the user explicitly reopened it.`
      : `${name} is claimed by ${result.record.owner} (since ${result.record.updated}).`);
  }
  process.stdout.write(`Claimed ${name} for ${owner}.\n`);
}

function cmdRelease({ positional, flags }) {
  const ctx = context(flags);
  const [name] = positional;
  requireModule(ctx, name);
  const status = typeof flags.status === 'string' ? flags.status : 'unclaimed';
  if (status === 'done') throw new UsageError('A module is marked done only by passing its verification gates (verify).');
  const note = typeof flags.note === 'string' ? flags.note : `Released ${timestamp()}.`;
  claimsLib.transact(ctx.docs, (claims) => claimsLib.releaseModule(claims, name, { status, notes: note }));
  process.stdout.write(`Released ${name} → ${status}.\n`);
}

function reportGates(label, gateSet, run) {
  const lines = [`Gates for ${label}:`];
  if (run) lines.push(gatesLib.summarizeResults(run));
  for (const m of gateSet.manual) lines.push(`- MANUAL: ${m}`);
  return lines.join('\n');
}

function cmdVerify({ positional, flags }) {
  const ctx = context(flags);
  const state = loadStateOrFail(ctx);
  const confirmManual = Boolean(flags['confirm-manual']);
  const timeoutSec = Number(process.env.BACKBONE_GATE_TIMEOUT_SEC || 300);

  if (flags.wp) {
    const md = readText(ctx.p.workPackages);
    if (md === null) throw new UsageError('work-packages.md does not exist.');
    const all = gatesLib.extractGates(md).filter((g) => g.id);
    const wanted = flags.wp === true || flags.wp === 'all' ? all : all.filter((g) => g.id === flags.wp);
    if (!wanted.length) throw new UsageError(`No backbone-gates block for work package "${flags.wp}".`);
    let allPassed = true;
    for (const g of wanted) {
      const run = g.automated.length ? gatesLib.runGates(g.automated, { cwd: ctx.project, timeoutSec }) : { passed: true, results: [] };
      const done = run.passed && (!g.manual.length || confirmManual);
      allPassed = allPassed && done;
      const notes = !run.passed ? 'Automated gates failing.' : done ? 'All gates passed.' : `Awaiting manual gate confirmation: ${g.manual.join('; ')}`;
      state.work_packages[g.id] = { status: done ? 'done' : 'in-progress', updated: today(), notes };
      process.stdout.write(`${reportGates(g.id, g, run)}\n→ ${g.id}: ${done ? 'DONE' : 'NOT DONE'} (${notes})\n\n`);
    }
    stateLib.writeState(ctx.p.state, state);
    if (!allPassed) process.exitCode = 1;
    return;
  }

  const [name] = positional;
  requireModule(ctx, name);
  const md = readText(paths.modulePrdPath(ctx.docs, name));
  if (md === null) throw new UsageError(`modules/${name}.md does not exist.`);
  const blocks = gatesLib.extractGates(md);
  const gateSet = { automated: blocks.flatMap((b) => b.automated), manual: blocks.flatMap((b) => b.manual) };
  if (!gateSet.automated.length && !gateSet.manual.length) {
    throw new UsageError(`modules/${name}.md defines no verification gates; it cannot be marked done.`);
  }
  const run = gateSet.automated.length ? gatesLib.runGates(gateSet.automated, { cwd: ctx.project, timeoutSec }) : { passed: true, results: [] };
  const done = run.passed && (!gateSet.manual.length || confirmManual);
  claimsLib.transact(ctx.docs, (claims) => {
    const current = claimsLib.moduleRecord(claims, name);
    if (done) {
      claimsLib.releaseModule(claims, name, { status: 'done', notes: `Gates passed ${timestamp()}.` });
    } else {
      claims.modules[name] = {
        ...current,
        status: current.status === 'unclaimed' ? 'unclaimed' : 'in-progress',
        updated: timestamp(),
        notes: run.passed ? `Awaiting manual gate confirmation: ${gateSet.manual.join('; ')}` : 'Automated gates failing.',
      };
    }
  });
  process.stdout.write(`${reportGates(name, gateSet, run)}\n→ ${name}: ${done ? 'DONE' : 'NOT DONE'}\n`);
  if (!done) process.exitCode = 1;
}

function cmdCvs({ flags }) {
  const ctx = context(flags);
  const state = loadStateOrFail(ctx);
  const { error, result } = lint.evaluateCvs(ctx.docs, state.tier);
  if (error) throw new UsageError(error);
  const rendered = cvsLib.renderResult(result, today());
  if (flags.write) {
    const md = readText(ctx.p.validation);
    const updated = replaceRegion(md, 'cvs-result', rendered);
    if (updated === null) throw new UsageError('validation.md is missing <!-- backbone:cvs-result:start/end --> markers.');
    writeFileAtomic(ctx.p.validation, updated);
  }
  process.stdout.write(`${rendered}\n`);
  if (result.verdict !== 'pass') process.exitCode = 1;
}

function cmdCheck({ flags }) {
  const ctx = context(flags);
  const state = loadStateOrFail(ctx);
  const { errors, warnings } = lint.checkProject({ project: ctx.project, docs: ctx.docs, state });
  const out = [
    errors.length ? `FAIL — ${errors.length} error(s)` : 'PASS — no errors',
    ...errors.map((e) => `- ERROR: ${e}`),
    ...warnings.map((w) => `- WARN: ${w}`),
  ];
  process.stdout.write(`${out.join('\n')}\n`);
  if (errors.length) process.exitCode = 1;
}

function loadTokens(ctx) {
  const file = path.join(ctx.docs, 'design.md');
  const md = readText(file);
  if (md === null) throw new UsageError(`No design.md at ${file}. Run "scaffold design" first (Stage 9).`);
  const tokens = designLib.parseTokens(md);
  if (!tokens) throw new UsageError('design.md has no ```backbone-tokens block.');
  return tokens;
}

/** tokens: validate + contrast table; --css <file>: export; --audit <paths…>: find colours that bypass the tokens. */
function cmdTokens({ positional, flags }) {
  const ctx = context(flags);
  const tokens = loadTokens(ctx);
  if (flags.audit !== undefined) {
    const targets = [...(typeof flags.audit === 'string' ? [flags.audit] : []), ...positional];
    if (!targets.length) throw new UsageError('tokens --audit needs at least one path, e.g. tokens --audit src/ui');
    const findings = designLib.auditColors(targets, tokens, { cwd: ctx.project });
    if (!findings.length) {
      process.stdout.write(`PASS — no colour literals outside the design tokens in ${targets.join(', ')}.\n`);
      return;
    }
    process.stdout.write([
      `FAIL — ${findings.length} colour literal(s) bypass the design tokens:`,
      ...findings.map((f) => `- ${f.file}:${f.line} ${f.value}`),
      'Use the token (var(--color-…)) instead, add the colour to design.md through Stage 9, or mark a deliberate exception with a "token-ok" comment.',
    ].join('\n') + '\n');
    process.exitCode = 1;
    return;
  }
  const state = stateLib.readState(ctx.p.state);
  const tier = typeof flags.tier === 'string' ? flags.tier : state ? state.tier : 'T2';
  const { errors, warnings, contrast } = designLib.validateTokens(tokens, tier);
  if (typeof flags.css === 'string') {
    if (errors.length) throw new UsageError(`Refusing to export invalid tokens:\n${errors.map((e) => `- ${e}`).join('\n')}`);
    const dest = path.resolve(ctx.project, flags.css);
    writeFileAtomic(dest, designLib.toCss(tokens));
    process.stdout.write(`Wrote ${dest}\n`);
    return;
  }
  const lines = [
    errors.length ? `FAIL — ${errors.length} error(s) at ${tier}` : `PASS — tokens are valid at ${tier}`,
    ...errors.map((e) => `- ERROR: ${e}`),
    ...warnings.map((w) => `- WARN: ${w}`),
  ];
  if (contrast.length) {
    lines.push('', 'Contrast:', ...contrast.map((r) => `- ${r.passed ? 'ok  ' : 'FAIL'} ${r.fg} on ${r.bg} (${r.palette}): ${r.ratio}:1 (needs ${r.min}:1, ${r.kind})`));
  }
  print({ tier, errors, warnings, contrast }, flags.json, lines.join('\n'));
  if (errors.length) process.exitCode = 1;
}

function cmdDisable({ flags }) {
  const ctx = context(flags);
  const global = flags.global === true;
  let days;
  if (flags.days !== undefined) {
    days = Number(flags.days);
    if (!Number.isInteger(days) || days < 1) throw new UsageError('--days must be a whole number of days, 1 or more.');
  }
  const reason = typeof flags.reason === 'string' ? flags.reason : undefined;
  const file = global ? switchLib.globalFlagPath() : ctx.p.disabled;
  const flag = switchLib.writeFlag(file, { scope: global ? 'global' : 'project', days, reason });
  const target = global ? 'every project on this machine' : ctx.project;
  process.stdout.write([
    `Backbone is OFF for ${target}${flag.until ? ` until ${flag.until} (it switches itself back on after that day)` : ''}.`,
    'Hooks, module claims and automatic gate runs stop immediately; your documents are untouched.',
    `Turn it back on with: enable${global ? ' --global' : ''}`,
  ].join('\n') + '\n');
}

function cmdEnable({ flags }) {
  const ctx = context(flags);
  const global = flags.global === true;
  fs.rmSync(global ? switchLib.globalFlagPath() : ctx.p.disabled, { force: true });
  const off = switchLib.disabledReason(ctx.p);
  process.stdout.write(`Backbone ${global ? 'global switch' : 'project switch'} cleared.\n` +
    (off ? `Still ${switchLib.describe(off)} — clear that one too to turn it back on here.\n` : `Backbone is ON for ${ctx.project}.\n`));
}

function cmdSwitch({ flags }) {
  const ctx = context(flags);
  const off = switchLib.disabledReason(ctx.p);
  print({ enabled: !off, ...(off || {}) }, flags.json, `Backbone is ${switchLib.describe(off)}.`);
}

const COMMANDS = {
  triage: cmdTriage, init: cmdInit, retier: cmdRetier, plan: cmdPlan, scaffold: cmdScaffold,
  status: cmdStatus, next: cmdNext,
  stage: cmdStage, ship: cmdShip, 'feedback-due': cmdFeedbackDue, scan: cmdScan, modules: cmdModules,
  claim: cmdClaim, release: cmdRelease, verify: cmdVerify, cvs: cmdCvs, check: cmdCheck,
  tokens: cmdTokens, disable: cmdDisable, enable: cmdEnable, switch: cmdSwitch,
};

function main(argv) {
  const [command, ...rest] = argv;
  if (!command || command === 'help' || command === '--help') {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  const fn = COMMANDS[command];
  if (!fn) throw new UsageError(`Unknown command "${command}".\n\n${USAGE}`);
  fn(parseArgs(rest));
}

if (require.main === module) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    process.stderr.write(`${err instanceof UsageError ? '' : 'Error: '}${err.message}\n`);
    process.exitCode = err instanceof UsageError ? 2 : 1;
  }
}

module.exports = { main, parseArgs };
