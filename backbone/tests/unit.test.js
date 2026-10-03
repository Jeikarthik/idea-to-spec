'use strict';

const test = require('node:test');
const assert = require('node:assert');

const markdown = require('../scripts/lib/markdown');
const stages = require('../scripts/lib/stages');
const stateLib = require('../scripts/lib/state');
const modulesLib = require('../scripts/lib/modules');
const gatesLib = require('../scripts/lib/gates');
const cvs = require('../scripts/lib/cvs');
const triage = require('../scripts/lib/triage');
const { feedbackStatus } = require('../scripts/lib/feedback');
const { PASS_CMD, FAIL_CMD } = require('./helpers');

/* ---------------------------------------------------------------- markdown */

test('findBlocks extracts tagged fenced blocks and their info string', () => {
  const md = '# t\n\n```backbone-gates WP-1\nnpm test\n```\n\ntext\n\n```backbone-gatesx\nnope\n```\n';
  const blocks = markdown.findBlocks(md, 'backbone-gates');
  assert.strictEqual(blocks.length, 1);
  assert.strictEqual(blocks[0].info, 'WP-1');
  assert.strictEqual(blocks[0].body, 'npm test');
});

test('replaceRegion rewrites between markers and returns null when markers are missing', () => {
  const md = 'a\n<!-- backbone:claims:start -->\nold\n<!-- backbone:claims:end -->\nb';
  assert.match(markdown.replaceRegion(md, 'claims', 'new'), /start -->\nnew\n<!-- backbone:claims:end/);
  assert.strictEqual(markdown.replaceRegion('no markers', 'claims', 'new'), null);
});

test('renderTable escapes pipes so a cell cannot break the table', () => {
  assert.match(markdown.renderTable(['a'], [['x | y']]), /x \\\| y/);
});

/* ------------------------------------------------------------ tier gating */

test('tier gating matches the spec: validation and viability are off at the low tiers', () => {
  const byId = (tier) => Object.fromEntries(stages.plan(tier).map((s) => [s.id, s.applicability]));
  const t1 = byId('T1');
  assert.strictEqual(t1[3], 'skip', 'Stage 3 validation does not run at T1');
  assert.strictEqual(t1[4], 'skip');
  assert.strictEqual(t1[5], 'skip');
  assert.strictEqual(t1[6], 'skip', 'Stage 6 viability is skipped entirely at T1');
  assert.strictEqual(t1[8], 'skip');
  assert.strictEqual(t1[13], 'skip');
  assert.strictEqual(t1[7], 'active', 'MoSCoW scope lock fires at every tier');
  assert.strictEqual(t1[12], 'active');

  const t2 = byId('T2');
  assert.strictEqual(t2[6], 'skip', 'no viability framework applies below T3');
  assert.strictEqual(t2[5], 'conditional');
  assert.strictEqual(t2[8], 'active');

  for (const tier of ['T3', 'T4']) {
    const t = byId(tier);
    assert.strictEqual(t[6], 'active');
    assert.strictEqual(t[5], 'active');
  }
});

test('frameworks are filtered by tier', () => {
  const names = (tier, id) => stages.plan(tier)[id].frameworks.map((f) => f.name);
  assert.ok(names('T1', 1).some((n) => n.startsWith('5W2H')));
  assert.ok(!names('T1', 1).some((n) => n.includes('JTBD')), 'JTBD is T2+');
  assert.ok(names('T2', 1).some((n) => n.includes('JTBD')));
  assert.ok(names('T3', 9).some((n) => n.includes('C4')), 'C4 applies at T3');
  assert.ok(!names('T1', 9).some((n) => n.includes('ADR')), 'ADRs are T2+');
  assert.ok(names('T1', 9).some((n) => n.includes('stubbed')), 'real-vs-stubbed is mandatory at T1');
  assert.ok(names('T4', 8).some((n) => n.includes('HEART')));
  assert.ok(!names('T3', 8).some((n) => n.includes('HEART')), 'HEART is T4 (or T3 by condition)');
});

test('documents follow the tier', () => {
  const files = (tier) => stages.documentsFor(tier).map((d) => d.file);
  assert.ok(files('T1').includes('work-packages.md'));
  assert.ok(!files('T1').includes('modules/<name>.md'));
  assert.ok(files('T3').includes('modules/<name>.md'));
  assert.ok(!files('T3').includes('work-packages.md'));
  assert.ok(!files('T2').includes('viability.md'));
  assert.ok(files('T4').includes('viability.md'));
});

test('handoff routes T1/T2 to Spec Kit and T3/T4 to BMAD or parallel subagents', () => {
  assert.strictEqual(stages.handoffTarget('T1'), 'spec-kit');
  assert.strictEqual(stages.handoffTarget('T2'), 'spec-kit');
  assert.strictEqual(stages.handoffTarget('T3'), 'bmad-or-parallel-subagents');
  assert.strictEqual(stages.handoffTarget('T4'), 'bmad-or-parallel-subagents');
});

/* -------------------------------------------------------------------- state */

test('createState marks skipped stages and requires a rationale', () => {
  const s = stateLib.createState({ project: 'p', tier: 'T1', mode: 'greenfield', reason: 'hours' });
  assert.strictEqual(s.stages[3].status, 'skipped');
  assert.strictEqual(s.stages[0].status, 'in-progress');
  assert.throws(() => stateLib.createState({ project: 'p', tier: 'T1', mode: 'greenfield', reason: '' }), /rationale/);
  assert.throws(() => stateLib.createState({ project: 'p', tier: 'T9', mode: 'greenfield', reason: 'x' }), /Invalid tier/);
});

test('state round-trips through markdown', () => {
  const s = stateLib.createState({ project: 'p', tier: 'T2', mode: 'bootstrap', reason: 'solo' });
  const parsed = stateLib.parseState(stateLib.renderState(s));
  assert.deepStrictEqual(parsed, s);
});

test('parseState rejects a malformed block instead of silently continuing', () => {
  assert.throws(() => stateLib.parseState('# no block'), /no ```backbone-state block/);
  assert.throws(() => stateLib.parseState('```backbone-state\n{oops\n```'), /not valid JSON/);
  assert.throws(() => stateLib.parseState('```backbone-state\n{"tier":"T9"}\n```'), /invalid/);
});

test('re-triage upward reopens stages, keeps finished work, and flags deepened stages', () => {
  const s = stateLib.createState({ project: 'p', tier: 'T1', mode: 'greenfield', reason: 'hackathon' });
  stateLib.setStageStatus(s, 1, 'done');
  stateLib.retier(s, 'T3', 'prototype got funded');
  assert.strictEqual(s.tier, 'T3');
  assert.strictEqual(s.stages[3].status, 'not-started', 'validation becomes applicable');
  assert.strictEqual(s.stages[6].status, 'not-started', 'viability becomes applicable');
  assert.strictEqual(s.stages[1].status, 'rework', 'Stage 1 was done at shallower depth');
  assert.strictEqual(s.stages[0].status, 'done');
  assert.strictEqual(s.tier_history.length, 2);
  assert.throws(() => stateLib.retier(s, 'T4', ''), /reason is required/);
});

test('re-triage downward keeps completed work and closes unstarted stages', () => {
  const s = stateLib.createState({ project: 'p', tier: 'T3', mode: 'greenfield', reason: 'team' });
  stateLib.setStageStatus(s, 6, 'done');
  stateLib.retier(s, 'T1', 'became a hackathon demo');
  assert.strictEqual(s.stages[6].status, 'done');
  assert.match(s.stages[6].notes, /Not applicable at T1/);
  assert.strictEqual(s.stages[3].status, 'skipped');
});

test('nextStage skips closed stages and holds Stage 13 until ship', () => {
  const s = stateLib.createState({ project: 'p', tier: 'T2', mode: 'greenfield', reason: 'solo' });
  for (const stage of s.stages) if (stage.applicability !== 'skip') stage.status = 'done';
  assert.strictEqual(stateLib.nextStage(s), null, 'Stage 13 is not offered before ship');
  s.stages[13].status = 'not-started';
  s.shipped_at = '2026-09-01';
  assert.strictEqual(stateLib.nextStage(s).id, 13);
});

/* ------------------------------------------------------------------ modules */

test('module map validation catches overlap, unknown deps, and cycles', () => {
  const ok = [
    { name: 'db', paths: ['src/db/**'], depends_on: [], interface_frozen: true },
    { name: 'api', paths: ['src/api/**'], depends_on: ['db'], interface_frozen: false },
  ];
  assert.deepStrictEqual(modulesLib.validateModules(ok).errors, []);
  assert.deepStrictEqual(modulesLib.validateModules(ok).order, ['db', 'api']);

  const overlap = [
    { name: 'a', paths: ['src/shared/**'], depends_on: [], interface_frozen: false },
    { name: 'b', paths: ['src/shared/util.ts'], depends_on: [], interface_frozen: false },
  ];
  assert.match(modulesLib.validateModules(overlap).errors.join(' '), /ownership overlap/);

  const unknown = [{ name: 'a', paths: ['src/a/**'], depends_on: ['ghost'], interface_frozen: false }];
  assert.match(modulesLib.validateModules(unknown).errors.join(' '), /unknown module/);

  const cycle = [
    { name: 'a', paths: ['src/a/**'], depends_on: ['b'], interface_frozen: false },
    { name: 'b', paths: ['src/b/**'], depends_on: ['a'], interface_frozen: false },
  ];
  assert.match(modulesLib.validateModules(cycle).errors.join(' '), /cycle/);
});

test('a module is blocked until its dependencies freeze their interfaces', () => {
  const mods = [
    { name: 'db', paths: ['src/db/**'], depends_on: [], interface_frozen: false },
    { name: 'api', paths: ['src/api/**'], depends_on: ['db'], interface_frozen: false },
  ];
  assert.deepStrictEqual(modulesLib.unfrozenDependencies(mods, 'api'), ['db']);
  mods[0].interface_frozen = true;
  assert.deepStrictEqual(modulesLib.unfrozenDependencies(mods, 'api'), []);
});

/* -------------------------------------------------------------------- gates */

test('gates parse into automated and manual, and run for real', () => {
  const md = ['```backbone-gates', '# comment', PASS_CMD, 'manual: a human checks the demo', '```'].join('\n');
  const [set] = gatesLib.extractGates(md);
  assert.deepStrictEqual(set.automated, [PASS_CMD]);
  assert.deepStrictEqual(set.manual, ['a human checks the demo']);

  assert.strictEqual(gatesLib.runGates([PASS_CMD], { cwd: process.cwd() }).passed, true);
  const failed = gatesLib.runGates([FAIL_CMD], { cwd: process.cwd() });
  assert.strictEqual(failed.passed, false);
  assert.match(gatesLib.summarizeResults(failed), /FAIL \(exit 1\)/);
  assert.match(failed.results[0].output, /gate failed/);
});

/* ---------------------------------------------------------------------- CVS */

function scores(overrides = {}) {
  const base = {};
  for (const p of cvs.PARAMETERS) base[p.key] = { score: 4, evidence: 'interviews', reasoning: 'because' };
  return { date: '2026-09-16', scored_by: ['a', 'b'], scores: { ...base, ...overrides } };
}

test('a complete, evidenced score passes and is weighted toward pain', () => {
  const result = cvs.evaluate(scores(), 'T3');
  assert.strictEqual(result.verdict, 'pass');
  assert.strictEqual(result.weightedScore, 4);

  const painHeavy = cvs.evaluate(scores({
    problem_frequency: { score: 5, evidence: 'behavioral', reasoning: 'r' },
    problem_severity: { score: 5, evidence: 'behavioral', reasoning: 'r' },
    market_growth: { score: 1, evidence: 'secondary', reasoning: 'r' },
    scalability: { score: 1, evidence: 'secondary', reasoning: 'r' },
  }), 'T3');
  const marketHeavy = cvs.evaluate(scores({
    problem_frequency: { score: 3, evidence: 'behavioral', reasoning: 'r' },
    problem_severity: { score: 3, evidence: 'behavioral', reasoning: 'r' },
    market_growth: { score: 5, evidence: 'secondary', reasoning: 'r' },
    scalability: { score: 5, evidence: 'secondary', reasoning: 'r' },
  }), 'T3');
  assert.ok(painHeavy.weightedScore > marketHeavy.weightedScore, 'pain outweighs market size at equal spread');
});

test('weak pain blocks even when the market scores are high', () => {
  const result = cvs.evaluate(scores({
    problem_frequency: { score: 2, evidence: 'interviews', reasoning: 'r' },
    affected_customer_count: { score: 5, evidence: 'secondary', reasoning: 'r' },
    market_growth: { score: 5, evidence: 'secondary', reasoning: 'r' },
    scalability: { score: 5, evidence: 'secondary', reasoning: 'r' },
  }), 'T3');
  assert.strictEqual(result.verdict, 'blocked');
  assert.match(result.blocking.join(' '), /PAIN_WEAK/);
  assert.match(result.blocking.join(' '), /INVERTED_PROFILE/);
});

test('pain resting on assumption or desk research blocks', () => {
  const result = cvs.evaluate(scores({ problem_severity: { score: 5, evidence: 'secondary', reasoning: 'r' } }), 'T2');
  assert.strictEqual(result.verdict, 'blocked');
  assert.match(result.blocking.join(' '), /PAIN_UNEVIDENCED/);
});

test('T3/T4 require group scoring; T2 does not', () => {
  const solo = { ...scores(), scored_by: ['just me'] };
  assert.strictEqual(cvs.evaluate(solo, 'T2').verdict, 'pass');
  const t3 = cvs.evaluate(solo, 'T3');
  assert.strictEqual(t3.verdict, 'blocked');
  assert.match(t3.blocking.join(' '), /GROUP_SCORING_REQUIRED/);
});

test('incomplete scores block rather than scoring what is there', () => {
  const missing = scores();
  delete missing.scores.willingness_to_pay;
  missing.scores.market_growth = { score: 9, evidence: 'interviews', reasoning: 'r' };
  const result = cvs.evaluate(missing, 'T2');
  assert.strictEqual(result.verdict, 'blocked');
  assert.strictEqual(result.blocking.filter((b) => b.startsWith('INCOMPLETE')).length, 2);
});

/* ------------------------------------------------------------------ triage */

test('triage classifies the four tiers', () => {
  assert.strictEqual(triage.classify({ timeframe: 'hours', team: 4, client: 'no', judged: 'yes' }).tier, 'T1');
  assert.strictEqual(triage.classify({ timeframe: 'days', team: 1, client: 'no', judged: 'no' }).tier, 'T1');
  assert.strictEqual(triage.classify({ timeframe: 'months', team: 1, client: 'no', judged: 'no' }).tier, 'T2');
  assert.strictEqual(triage.classify({ timeframe: 'weeks', team: 3, client: 'no', judged: 'no' }).tier, 'T3');
  assert.strictEqual(triage.classify({ timeframe: 'months', team: 3, client: 'yes', judged: 'no' }).tier, 'T4');
  assert.strictEqual(triage.classify({ timeframe: 'months', team: 1, client: 'yes', judged: 'no' }).tier, 'T4');
});

test('triage surfaces tensions instead of resolving them silently', () => {
  const short = triage.classify({ timeframe: 'days', team: 2, client: 'yes', judged: 'no' });
  assert.strictEqual(short.tier, 'T1');
  assert.match(short.tensions.join(' '), /throwaway prototype/);
  const judged = triage.classify({ timeframe: 'months', team: 1, client: 'no', judged: 'yes' });
  assert.match(judged.tensions.join(' '), /rubric/);
  assert.throws(() => triage.classify({ timeframe: 'fortnight', team: 1, client: 'no', judged: 'no' }), /timeframe/);
  assert.throws(() => triage.classify({ timeframe: 'weeks', team: 0, client: 'no', judged: 'no' }), /team/);
});

/* ---------------------------------------------------------------- feedback */

test('feedback cadence is measured from the later of ship date and last entry', () => {
  const state = { tier: 'T2', shipped_at: '2026-09-01', feedback_cadence_days: 7 };
  const now = new Date('2026-09-16T00:00:00Z');
  assert.strictEqual(feedbackStatus(state, null, now).due, true);
  const recent = feedbackStatus(state, '## 2026-09-14\n- Users reached: 3\n', now);
  assert.strictEqual(recent.due, false);
  assert.strictEqual(recent.anchorKind, 'last feedback entry');
  assert.strictEqual(feedbackStatus({ ...state, shipped_at: null }, null, now).applicable, false);
  assert.strictEqual(feedbackStatus({ ...state, tier: 'T1' }, null, now).applicable, false);
});
