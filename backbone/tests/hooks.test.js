'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const h = require('./helpers');

function claims(project) {
  return JSON.parse(h.read(path.join(h.docs(project), 'claims.json')));
}

function startInput(project, { agentId = 'agent_1', description = '', agentType = 'general-purpose' } = {}) {
  return {
    session_id: 's1', hook_event_name: 'SubagentStart', cwd: project,
    agent_id: agentId, agent_type: agentType, task_description: description,
  };
}

/* ------------------------------------------------------------ SessionStart */

test('SessionStart triggers greenfield intake on an empty project', (t) => {
  const project = h.tempProject();
  t.after(() => h.cleanup(project));
  const r = h.hook('session-start', { hook_event_name: 'SessionStart', source: 'startup', cwd: project });
  assert.strictEqual(r.code, 0);
  assert.match(r.context, /greenfield project/);
  assert.match(r.context, /backbone:triage/);
  assert.match(r.context, /real, lived situation|real situation that surfaced/i);
});

test('SessionStart triggers bootstrap mode when the repo already has code', (t) => {
  const project = h.tempProject();
  t.after(() => h.cleanup(project));
  fs.writeFileSync(path.join(project, 'package.json'), JSON.stringify({ name: 'half-built', scripts: { test: 'node --test' } }), 'utf8');
  h.write(path.join(project, 'src', 'index.js'), 'module.exports = 1;\n');
  h.write(path.join(project, 'src', 'auth', 'login.js'), 'module.exports = 2;\n');
  h.write(path.join(project, 'tests', 'login.test.js'), '// test\n');

  const r = h.hook('session-start', { hook_event_name: 'SessionStart', source: 'startup', cwd: project });
  assert.match(r.context, /BOOTSTRAP MODE/);
  assert.match(r.context, /package\.json/);
  assert.match(r.context, /never fabricates validation history/i);
});

test('SessionStart resumes from state and reports the next stage and live claims', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  h.cli(project, ['claim', 'auth', '--owner', 'session:other']);
  h.cli(project, ['stage', '0', 'done']);

  const r = h.hook('session-start', { hook_event_name: 'SessionStart', source: 'resume', cwd: project });
  assert.match(r.context, /Resuming "demo" — T3/);
  assert.match(r.context, /Next: Stage 1 — Problem Identification/);
  assert.match(r.context, /auth \(session:other/);
  assert.match(r.context, /adversarial-review/);
});

test('SessionStart reports a malformed state file instead of ignoring it', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  h.write(path.join(h.docs(project), 'state.md'), '# Backbone State\n\n```backbone-state\n{broken\n```\n');
  const r = h.hook('session-start', { hook_event_name: 'SessionStart', source: 'startup', cwd: project });
  assert.match(r.context, /malformed/);
  assert.match(r.context, /Do not overwrite it/);
});

test('SessionStart is silent when Backbone is disabled for the project', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  h.cli(project, ['disable']);
  assert.strictEqual(h.hook('session-start', { hook_event_name: 'SessionStart', source: 'startup', cwd: project }).out, '');
  h.cli(project, ['enable']);
  assert.notStrictEqual(h.hook('session-start', { hook_event_name: 'SessionStart', source: 'startup', cwd: project }).out, '');
});

test('SessionStart tells the session how to honour the stop switch', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  const r = h.hook('session-start', { hook_event_name: 'SessionStart', source: 'startup', cwd: project });
  assert.match(r.context, /Stop switch:/);
  assert.match(r.context, /disable --global/);
});

test('the global stop switch silences every project until it is cleared', (t) => {
  const a = h.initProject({ tier: 'T2' });
  const b = h.tempProject();
  t.after(() => { h.cleanup(a); h.cleanup(b); h.cli(a, ['enable', '--global']); });
  const start = (cwd) => h.hook('session-start', { hook_event_name: 'SessionStart', source: 'startup', cwd }).out;

  assert.strictEqual(h.cli(a, ['disable', '--global', '--reason', 'demo week']).code, 0);
  assert.ok(fs.existsSync(path.join(h.BACKBONE_HOME, 'disabled')));
  assert.strictEqual(start(a), '');
  assert.strictEqual(start(b), '');
  assert.match(h.cli(b, ['switch']).out, /off globally .* demo week/);

  // Clearing only the project switch does not override the global one — and says so.
  assert.match(h.cli(a, ['enable']).out, /Still off globally/);
  assert.strictEqual(start(a), '');

  assert.match(h.cli(a, ['enable', '--global']).out, /Backbone is ON/);
  assert.notStrictEqual(start(a), '');
  assert.deepStrictEqual(JSON.parse(h.cli(a, ['switch', '--json']).out), { enabled: true });
});

test('a snooze switches Backbone off and lapses by itself', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  const start = () => h.hook('session-start', { hook_event_name: 'SessionStart', source: 'startup', cwd: project }).out;

  const r = h.cli(project, ['disable', '--days', '3']);
  assert.strictEqual(r.code, 0);
  assert.match(r.out, /until \d{4}-\d{2}-\d{2}/);
  assert.strictEqual(start(), '');
  assert.match(h.cli(project, ['switch']).out, /off for this project until .*snooze/);

  // An expired snooze is ignored — Backbone is back on without anyone running enable.
  h.write(path.join(h.docs(project), '.backbone-disabled'), 'Backbone disabled (project).\nuntil: 2000-01-01\n');
  assert.notStrictEqual(start(), '');
  assert.match(h.cli(project, ['switch']).out, /Backbone is on/);

  assert.strictEqual(h.cli(project, ['disable', '--days', '0']).code, 2);
  assert.strictEqual(h.cli(project, ['disable', '--days', 'soon']).code, 2);
});

test('the stop switch also stops automatic module claims', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', purpose: 'sessions', paths: ['src/auth/**'], depends_on: [], interface_frozen: false }]);
  h.writeModulePrd(project, 'auth', { gates: [h.PASS_CMD] });
  h.cli(project, ['disable']);
  const r = h.hook('subagent-start', { hook_event_name: 'SubagentStart', cwd: project, agent_id: 'a1', task_description: 'build [bb:auth]', prompt: '[bb:auth]' });
  assert.strictEqual(r.out, '');
  assert.ok(!fs.existsSync(path.join(h.docs(project), 'claims.json')));
});

test('the feedback nudge fires only when a checkpoint is actually due', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  const input = { hook_event_name: 'SessionStart', source: 'startup', cwd: project };
  assert.strictEqual(h.hook('feedback-nudge', input).out, '', 'nothing before ship');

  h.cli(project, ['ship', '--date', '2026-01-01']);
  const due = h.hook('feedback-nudge', input);
  assert.match(due.context, /Feedback checkpoint DUE/);
  assert.match(due.context, /Do not fabricate user feedback/);

  const todayIso = new Date().toISOString().slice(0, 10);
  h.write(path.join(h.docs(project), 'feedback-log.md'), `# Feedback Log\n\n## ${todayIso}\n- Users reached: 2\n`);
  assert.strictEqual(h.hook('feedback-nudge', input).out, '', 'not due right after a logged touchpoint');
});

/* ----------------------------------------------------------- SubagentStart */

test('SubagentStart claims the marked module and hands the agent its boundary', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [
    { name: 'db', paths: ['src/db/**'], depends_on: [], interface_frozen: true },
    { name: 'api', paths: ['src/api/**'], depends_on: ['db'], interface_frozen: false },
  ]);
  h.writeModulePrd(project, 'api', { gates: [h.PASS_CMD] });

  const r = h.hook('subagent-start', startInput(project, { description: '[bb:api] build the api module' }));
  assert.match(r.context, /You own module "api"/);
  assert.match(r.context, /src\/api\/\*\*/);
  assert.match(r.context, /interface contracts/);
  assert.match(r.context, /\[bb:api\]/);
  assert.strictEqual(claims(project).modules.api.status, 'in-progress');
  assert.strictEqual(claims(project).agents.agent_1, 'api');
  assert.match(h.read(path.join(h.docs(project), 'architecture.md')), /\| api \| in-progress \| subagent:general-purpose:agent_1/);
});

test('SubagentStart refuses a module another agent already holds', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  h.writeModulePrd(project, 'auth', { gates: [h.PASS_CMD] });

  h.hook('subagent-start', startInput(project, { agentId: 'agent_1', description: '[bb:auth] build auth' }));
  const second = h.hook('subagent-start', startInput(project, { agentId: 'agent_2', description: '[bb:auth] build auth' }));
  assert.match(second.context, /CONFLICT/);
  assert.match(second.context, /Stop immediately/);
  assert.strictEqual(claims(project).agents.agent_2, undefined);
  assert.strictEqual(claims(project).modules.auth.owner, 'subagent:general-purpose:agent_1');
});

test('SubagentStart blocks a module whose dependencies are not frozen, and unknown modules', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [
    { name: 'db', paths: ['src/db/**'], depends_on: [], interface_frozen: false },
    { name: 'api', paths: ['src/api/**'], depends_on: ['db'], interface_frozen: false },
  ]);

  const blocked = h.hook('subagent-start', startInput(project, { description: '[bb:api] build api' }));
  assert.match(blocked.context, /interfaces are not frozen yet \(db\)/);
  assert.ok(!fs.existsSync(path.join(h.docs(project), 'claims.json')), 'a refused claim writes nothing');

  const unknown = h.hook('subagent-start', startInput(project, { agentId: 'agent_x', description: '[bb:ghost] build ghost' }));
  assert.match(unknown.context, /not in the module boundary map/);

  const several = h.hook('subagent-start', startInput(project, { agentId: 'agent_y', description: '[bb:api] and [bb:db]' }));
  assert.match(several.context, /One agent owns exactly one module/);
});

test('SubagentStart ignores agents with no module marker', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  const r = h.hook('subagent-start', startInput(project, { description: 'search the codebase for TODOs', agentType: 'Explore' }));
  assert.strictEqual(r.out, '');
  assert.ok(!fs.existsSync(path.join(h.docs(project), 'claims.json')));
});

test('SubagentStart finds the marker in the parent transcript when the input lacks it', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  h.writeModulePrd(project, 'auth', { gates: [h.PASS_CMD] });
  const transcript = path.join(project, 'transcript.jsonl');
  fs.writeFileSync(transcript, `${JSON.stringify({
    type: 'assistant',
    message: { content: [{ type: 'tool_use', id: 'toolu_1', name: 'Agent', input: { description: 'build auth', prompt: '[bb:auth]\nimplement it' } }] },
  })}\n`, 'utf8');

  const r = h.hook('subagent-start', { ...startInput(project, { description: 'build auth' }), transcript_path: transcript });
  assert.match(r.context, /You own module "auth"/);
  assert.strictEqual(claims(project).agents.agent_1, 'auth');
});

/* ------------------------------------------------------------ SubagentStop */

function stopInput(project, { agentId = 'agent_1', message = '[bb:auth] done' } = {}) {
  return {
    session_id: 's1', hook_event_name: 'SubagentStop', cwd: project,
    agent_id: agentId, agent_type: 'general-purpose', last_assistant_message: message,
  };
}

test('SubagentStop marks a module done only when its gates pass', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  h.writeModulePrd(project, 'auth', { gates: [h.PASS_CMD] });
  h.hook('subagent-start', startInput(project, { description: '[bb:auth] build auth' }));

  const r = h.hook('subagent-stop', stopInput(project));
  assert.strictEqual(r.json.decision, undefined, 'a passing agent is allowed to stop');
  assert.match(r.json.systemMessage, /all verification gates PASS/);
  assert.strictEqual(claims(project).modules.auth.status, 'done');
  assert.strictEqual(claims(project).modules.auth.owner, null);
  assert.strictEqual(claims(project).agents.agent_1, undefined);
});

test('SubagentStop blocks the stop while gates fail, then releases after the retry limit', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  h.writeModulePrd(project, 'auth', { gates: [h.FAIL_CMD] });
  h.hook('subagent-start', startInput(project, { description: '[bb:auth] build auth' }));

  const first = h.hook('subagent-stop', stopInput(project), { BACKBONE_GATE_MAX_BLOCKS: '1' });
  assert.strictEqual(first.json.decision, 'block');
  assert.match(first.json.reason, /verification gates fail/);
  assert.match(first.json.reason, /gate failed/);
  assert.strictEqual(claims(project).modules.auth.status, 'in-progress');

  const second = h.hook('subagent-stop', stopInput(project), { BACKBONE_GATE_MAX_BLOCKS: '1' });
  assert.strictEqual(second.json.decision, undefined, 'the agent is not blocked forever');
  assert.match(second.json.systemMessage, /still failing after the retry limit/);
  assert.strictEqual(claims(project).modules.auth.status, 'in-progress');
  assert.strictEqual(claims(project).modules.auth.owner, null);
});

test('SubagentStop leaves a module with manual gates awaiting the user', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  h.writeModulePrd(project, 'auth', { gates: [h.PASS_CMD], manual: ['a human completes a real login'] });
  h.hook('subagent-start', startInput(project, { description: '[bb:auth] build auth' }));

  const r = h.hook('subagent-stop', stopInput(project));
  assert.match(r.json.systemMessage, /Manual gates need the user/);
  assert.strictEqual(claims(project).modules.auth.status, 'in-progress');
  assert.match(claims(project).modules.auth.notes, /awaiting user confirmation/i);
});

test('SubagentStop reports a module PRD that defines no gates instead of marking it done', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  h.writeModulePrd(project, 'auth', { gates: [] });
  h.hook('subagent-start', startInput(project, { description: '[bb:auth] build auth' }));

  const r = h.hook('subagent-stop', stopInput(project));
  assert.match(r.json.systemMessage, /no verification gates defined/);
  assert.strictEqual(claims(project).modules.auth.status, 'in-progress');
});

test('SubagentStop ignores agents it never claimed a module for', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  h.writeModulePrd(project, 'auth', { gates: [h.FAIL_CMD] });
  const r = h.hook('subagent-stop', stopInput(project, { agentId: 'agent_unknown' }));
  assert.strictEqual(r.out, '', 'an unrelated subagent is never blocked by Backbone gates');
});

test('gate execution can be turned off without silently marking work done', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [{ name: 'auth', paths: ['src/auth/**'], depends_on: [], interface_frozen: true }]);
  h.writeModulePrd(project, 'auth', { gates: [h.PASS_CMD] });
  h.hook('subagent-start', startInput(project, { description: '[bb:auth] build auth' }));
  const r = h.hook('subagent-stop', stopInput(project), { BACKBONE_RUN_GATES: '0' });
  assert.match(r.json.systemMessage, /gate execution disabled/);
  assert.strictEqual(claims(project).modules.auth.status, 'in-progress');
});
