'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const h = require('./helpers');

const SIGNED_REVIEW = [
  '## DL-001 — 2026-09-16 — Lock the scope',
  '- Type: adversarial-review',
  '- Stage: 7',
  '- Weakest assumption: that weekly use is real',
  '- Most likely failure: nobody returns after week one',
  '- Alternative framing: a one-off report instead of a product',
  '- Resolution: scope cut to the weekly path',
  '- Signed off by: the user, 2026-09-16',
  '',
].join('\n');

function masterPrd(sections) {
  return sections.map(([heading, body]) => `## ${heading}\n\n${body}\n`).join('\n');
}

test('init is idempotent-safe: a second init refuses instead of overwriting', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  assert.ok(fs.existsSync(path.join(h.docs(project), 'state.md')));
  assert.ok(fs.existsSync(path.join(h.docs(project), 'decision-log.md')));
  assert.match(h.read(path.join(h.docs(project), 'decision-log.md')), /Decision Log — demo/);
  const again = h.cli(project, ['init', '--tier', 'T3', '--mode', 'greenfield', '--project-name', 'demo', '--reason', 'x']);
  assert.strictEqual(again.code, 2);
  assert.match(again.err, /already exists/);
});

test('scaffold refuses documents that do not apply at the tier', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  assert.strictEqual(h.cli(project, ['scaffold', 'work-packages']).code, 0);
  const viability = h.cli(project, ['scaffold', 'viability']);
  assert.strictEqual(viability.code, 2);
  assert.match(viability.err, /does not apply at T2/);
  const module = h.cli(project, ['scaffold', 'module', '--name', 'auth']);
  assert.match(module.err, /does not apply at T2/);
  const again = h.cli(project, ['scaffold', 'work-packages']);
  assert.match(again.err, /already exists/);
  const prd = h.read(path.join(h.docs(project), 'work-packages.md'));
  assert.match(prd, /\*\*Tier:\*\* T2/);
  assert.ok(!prd.includes('{{'), 'template placeholders are substituted');
});

test('Stage 3 cannot close while the Customer Validation Score is blocked, unless overridden', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  const validation = path.join(h.docs(project), 'validation.md');

  const noFile = h.cli(project, ['stage', '3', 'done']);
  assert.strictEqual(noFile.code, 2);
  assert.match(noFile.err, /validation.md does not exist/);

  const scores = {};
  for (const key of ['problem_frequency', 'problem_severity', 'affected_customer_count', 'dissatisfaction_with_alternatives',
    'willingness_to_adopt', 'willingness_to_pay', 'market_growth', 'scalability', 'competitive_advantage', 'social_environmental_impact']) {
    scores[key] = { score: 4, evidence: 'interviews', reasoning: 'r' };
  }
  scores.problem_frequency = { score: 2, evidence: 'assumed', reasoning: 'a guess' };
  h.write(validation, [
    '# Validation', '',
    '```backbone-cvs',
    JSON.stringify({ date: '2026-09-16', scored_by: ['me'], scores }, null, 2),
    '```', '',
    '<!-- backbone:cvs-result:start -->',
    '<!-- backbone:cvs-result:end -->', '',
  ].join('\n'));

  const cvs = h.cli(project, ['cvs', '--write']);
  assert.strictEqual(cvs.code, 1);
  assert.match(cvs.out, /BLOCKED/);
  assert.match(h.read(validation), /PAIN_WEAK/);

  const blocked = h.cli(project, ['stage', '3', 'done']);
  assert.strictEqual(blocked.code, 2);
  assert.match(blocked.err, /PAIN_WEAK/);

  const badOverride = h.cli(project, ['stage', '3', 'done', '--override', 'DL-404']);
  assert.match(badOverride.err, /DL-404 not found/);

  fs.appendFileSync(path.join(h.docs(project), 'decision-log.md'), [
    '', '## DL-002 — 2026-09-16 — Proceed despite weak frequency evidence',
    '- Type: override', '- Stage: 3',
    '- Reason: two more interviews are booked; building the probe is cheaper than waiting',
    '- Signed off by: the user, 2026-09-16', '',
  ].join('\n'));
  const ok = h.cli(project, ['stage', '3', 'done', '--override', 'DL-002']);
  assert.strictEqual(ok.code, 0, ok.err);
  assert.match(h.read(path.join(h.docs(project), 'state.md')), /Override: DL-002/);
});

test('Stage 7 cannot close until the scope section cites a signed-off adversarial pass', (t) => {
  const project = h.initProject({ tier: 'T1' });
  t.after(() => h.cleanup(project));
  const prd = path.join(h.docs(project), 'master-prd.md');

  h.write(prd, masterPrd([['2. Locked Scope (MoSCoW)', '**Must**\n- the one demo path']]));
  const unsigned = h.cli(project, ['stage', '7', 'done']);
  assert.strictEqual(unsigned.code, 2);
  assert.match(unsigned.err, /no "Sign-off: DL-###" line/);

  h.write(prd, masterPrd([['2. Locked Scope (MoSCoW)', '**Must**\n- the one demo path\n\nSign-off: DL-001']]));
  const missingEntry = h.cli(project, ['stage', '7', 'done']);
  assert.match(missingEntry.err, /DL-001 not found/);

  const log = path.join(h.docs(project), 'decision-log.md');
  fs.appendFileSync(log, `\n${SIGNED_REVIEW}`);
  assert.strictEqual(h.cli(project, ['stage', '7', 'done']).code, 0);

  const unsignedLog = SIGNED_REVIEW.replace('- Signed off by: the user, 2026-09-16', '- Signed off by: TBD');
  h.write(log, unsignedLog);
  h.cli(project, ['stage', '7', 'in-progress']);
  assert.match(h.cli(project, ['stage', '7', 'done']).err, /no explicit "Signed off by"/);
});

test('claim/release enforce single ownership and frozen dependencies', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [
    { name: 'db', paths: ['src/db/**'], depends_on: [], interface_frozen: false },
    { name: 'api', paths: ['src/api/**'], depends_on: ['db'], interface_frozen: false },
  ]);

  assert.match(h.cli(project, ['claim', 'ghost', '--owner', 'session:a']).err, /not in the architecture.md module boundary map/);
  assert.match(h.cli(project, ['claim', 'api', '--owner', 'session:a']).err, /interfaces not frozen: db/);

  assert.strictEqual(h.cli(project, ['claim', 'db', '--owner', 'session:a']).code, 0);
  const conflict = h.cli(project, ['claim', 'db', '--owner', 'session:b']);
  assert.strictEqual(conflict.code, 2);
  assert.match(conflict.err, /claimed by session:a/);

  const arch = h.read(path.join(h.docs(project), 'architecture.md'));
  assert.match(arch, /\| db \| in-progress \| session:a \|/);

  assert.match(h.cli(project, ['release', 'db', '--status', 'done']).err, /marked done only by passing its verification gates/);
  assert.strictEqual(h.cli(project, ['release', 'db', '--note', 'handing over']).code, 0);
  assert.strictEqual(h.cli(project, ['claim', 'db', '--owner', 'session:b']).code, 0);
});

test('modules reports dependency order and readiness', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [
    { name: 'api', paths: ['src/api/**'], depends_on: ['db'], interface_frozen: false },
    { name: 'db', paths: ['src/db/**'], depends_on: [], interface_frozen: true },
  ]);
  const r = h.cli(project, ['modules']);
  assert.strictEqual(r.code, 0);
  assert.match(r.out, /1\. db — interface FROZEN; ready to start/);
  assert.match(r.out, /2\. api — interface not frozen; ready to start/);

  h.writeArchitecture(project, [{ name: 'a', paths: ['src/**'], depends_on: [], interface_frozen: false },
    { name: 'b', paths: ['src/b/**'], depends_on: [], interface_frozen: false }]);
  const bad = h.cli(project, ['modules']);
  assert.strictEqual(bad.code, 1);
  assert.match(bad.out, /ownership overlap/);
});

test('verify is the only way a module becomes done', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);

  h.writeModulePrd(project, 'auth', { gates: [h.FAIL_CMD] });
  h.cli(project, ['claim', 'auth', '--owner', 'session:a']);
  const failing = h.cli(project, ['verify', 'auth']);
  assert.strictEqual(failing.code, 1);
  assert.match(failing.out, /NOT DONE/);
  assert.match(h.read(path.join(h.docs(project), 'architecture.md')), /Automated gates failing/);

  h.writeModulePrd(project, 'auth', { gates: [h.PASS_CMD], manual: ['a human runs the login flow'] });
  const awaitingManual = h.cli(project, ['verify', 'auth']);
  assert.strictEqual(awaitingManual.code, 1);
  assert.match(awaitingManual.out, /MANUAL: a human runs the login flow/);
  assert.match(h.read(path.join(h.docs(project), 'architecture.md')), /Awaiting manual gate confirmation/);

  const confirmed = h.cli(project, ['verify', 'auth', '--confirm-manual']);
  assert.strictEqual(confirmed.code, 0);
  assert.match(h.read(path.join(h.docs(project), 'architecture.md')), /\| auth \| done \|/);

  h.writeModulePrd(project, 'auth', { gates: [] });
  assert.match(h.cli(project, ['verify', 'auth']).err, /defines no verification gates/);
});

test('work packages verify by id at T1/T2 and record status in state', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  h.write(path.join(h.docs(project), 'work-packages.md'), [
    '# Work Packages', '',
    '## WP-1', '- AC-1 — Given a user, When they log in, Then they see the dashboard.', '',
    '## Definition of Done', '- AC-1 passes.', '',
    '```backbone-gates WP-1', h.PASS_CMD, '```', '',
    '```backbone-gates WP-2', h.FAIL_CMD, '```', '',
  ].join('\n'));

  const one = h.cli(project, ['verify', '--wp', 'WP-1']);
  assert.strictEqual(one.code, 0);
  assert.match(h.read(path.join(h.docs(project), 'state.md')), /WP-1 \| done/);

  const all = h.cli(project, ['verify', '--wp', 'all']);
  assert.strictEqual(all.code, 1);
  assert.match(h.read(path.join(h.docs(project), 'state.md')), /WP-2 \| in-progress/);
  assert.match(h.cli(project, ['verify', '--wp', 'WP-9']).err, /No backbone-gates block/);
});

test('check catches an unsigned PRD section and a real secret in .env.example', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  h.write(path.join(h.docs(project), 'master-prd.md'), masterPrd([['1. Validated Opportunity Statement', 'Weekly invoice chasing.']]));
  fs.writeFileSync(path.join(project, '.env.example'), 'STRIPE_SECRET_KEY=sk_live_realvalue\nAPI_URL=\n', 'utf8');
  const r = h.cli(project, ['check']);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /no "Sign-off: DL-###" line/);
  assert.match(r.out, /STRIPE_SECRET_KEY looks like it holds a real secret/);

  fs.writeFileSync(path.join(project, '.env.example'), 'STRIPE_SECRET_KEY=\nAPI_URL=<your-api-url>\n', 'utf8');
  h.write(path.join(h.docs(project), 'master-prd.md'), masterPrd([['1. Validated Opportunity Statement', 'Weekly invoice chasing.\n\nSign-off: DL-001']]));
  fs.appendFileSync(path.join(h.docs(project), 'decision-log.md'), `\n${SIGNED_REVIEW}`);
  const clean = h.cli(project, ['check']);
  assert.strictEqual(clean.code, 0, clean.out);
  assert.match(clean.out, /PASS/);
});

test('an incomplete adversarial pass does not count as one', (t) => {
  const project = h.initProject({ tier: 'T1' });
  t.after(() => h.cleanup(project));
  h.write(path.join(h.docs(project), 'master-prd.md'), masterPrd([['2. Locked Scope (MoSCoW)', 'Must: one path\n\nSign-off: DL-001']]));
  h.write(path.join(h.docs(project), 'decision-log.md'), SIGNED_REVIEW.replace('- Alternative framing: a one-off report instead of a product\n', ''));
  assert.match(h.cli(project, ['stage', '7', 'done']).err, /missing "alternative framing"/);
});

test('ship, feedback cadence, and re-triage from the CLI', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  assert.match(h.cli(project, ['feedback-due']).out, /has not shipped/);
  assert.strictEqual(h.cli(project, ['ship', '--date', '2026-01-01']).code, 0);
  assert.match(h.cli(project, ['feedback-due']).out, /DUE/);
  assert.match(h.cli(project, ['ship', '--date', 'yesterday']).err, /YYYY-MM-DD/);

  const retier = h.cli(project, ['retier', '--tier', 'T4', '--reason', 'a client came in']);
  assert.strictEqual(retier.code, 0, retier.err);
  assert.match(retier.out, /Re-triaged T2 → T4/);
  assert.match(h.cli(project, ['status']).out, /T4 \(Client\/industry\)/);
  assert.match(h.cli(project, ['status']).out, /Stage 6 — Market & Viability|Market & Viability \(active\)/);
});

test('stage transitions are validated', (t) => {
  const project = h.initProject({ tier: 'T1' });
  t.after(() => h.cleanup(project));
  assert.match(h.cli(project, ['stage', '3', 'in-progress']).err, /does not apply at T1/);
  assert.match(h.cli(project, ['stage', '1', 'finished']).err, /Invalid stage status/);
  assert.match(h.cli(project, ['stage', '1', 'skipped']).err, /needs --note/);
  assert.strictEqual(h.cli(project, ['stage', '1', 'skipped', '--note', 'problem already framed in the brief']).code, 0);
  assert.match(h.cli(project, ['stage', '99', 'done']).err, /must be 0–15/);
  assert.match(h.cli(project, ['nonsense']).err, /Unknown command/);
});

test('commands that need state fail clearly without it', (t) => {
  const project = h.tempProject();
  t.after(() => h.cleanup(project));
  const r = h.cli(project, ['status']);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /No state.md .*Run Stage 0/s);
});
