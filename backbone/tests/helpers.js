'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const PLUGIN_ROOT = path.resolve(__dirname, '..');
const CLI = path.join(PLUGIN_ROOT, 'scripts', 'backbone.js');
const HOOK = (name) => path.join(PLUGIN_ROOT, 'hooks', 'scripts', `${name}.js`);

// The global stop switch lives under BACKBONE_HOME; point it at a throwaway dir so tests never touch ~/.claude.
const BACKBONE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'backbone-home-'));
process.on('exit', () => fs.rmSync(BACKBONE_HOME, { recursive: true, force: true }));

function tempProject(prefix = 'backbone-test-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  return fs.realpathSync(dir);
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Run the CLI against `project`; env is cleared of Backbone overrides unless given. */
function cli(project, args, env = {}) {
  const r = spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: project, BACKBONE_DOCS_DIR: undefined, BACKBONE_DISABLE: undefined, BACKBONE_HOME, ...env },
    windowsHide: true,
  });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '' };
}

/** Run a hook script with `input` piped as JSON on stdin; returns parsed stdout JSON when present. */
function hook(name, input, env = {}) {
  const r = spawnSync(process.execPath, [HOOK(name)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: { ...process.env, CLAUDE_PROJECT_DIR: input.cwd, BACKBONE_DISABLE: undefined, BACKBONE_HOME, ...env },
    windowsHide: true,
  });
  const out = (r.stdout || '').trim();
  let json = null;
  if (out.startsWith('{')) {
    try { json = JSON.parse(out); } catch { json = null; }
  }
  return { code: r.status, out, err: r.stderr || '', json, context: json && json.hookSpecificOutput ? json.hookSpecificOutput.additionalContext : null };
}

function initProject({ tier = 'T3', mode = 'greenfield', name = 'demo' } = {}) {
  const project = tempProject();
  const r = cli(project, ['init', '--tier', tier, '--mode', mode, '--project-name', name, '--reason', 'test fixture']);
  if (r.code) throw new Error(`init failed: ${r.err || r.out}`);
  return project;
}

function docs(project) {
  return path.join(project, 'backbone');
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, 'utf8');
}

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

/** A two-module architecture.md with the claim-table markers in place. */
function writeArchitecture(project, modules) {
  write(path.join(docs(project), 'architecture.md'), [
    '# Architecture',
    '',
    '```backbone-modules',
    JSON.stringify({ modules }, null, 2),
    '```',
    '',
    '<!-- backbone:claims:start -->',
    '<!-- backbone:claims:end -->',
    '',
  ].join('\n'));
}

function writeModulePrd(project, name, { gates = [], manual = [], extra = '' } = {}) {
  write(path.join(docs(project), 'modules', `${name}.md`), [
    `# Module PRD — ${name}`,
    '',
    '## Interface contract',
    '- Exposes: nothing yet',
    '',
    '## Acceptance criteria',
    '- AC-1 — Given a request, When it is handled, Then it returns 200. Verified by: G1',
    '',
    '## Definition of Done',
    '- AC-1 passes.',
    extra,
    '',
    '```backbone-gates',
    ...gates,
    ...manual.map((m) => `manual: ${m}`),
    '```',
    '',
  ].join('\n'));
}

const PASS_CMD = `"${process.execPath}" -e "process.exit(0)"`;
const FAIL_CMD = `"${process.execPath}" -e "console.error('gate failed: 1 test failing');process.exit(1)"`;

module.exports = {
  PLUGIN_ROOT, CLI, BACKBONE_HOME, cli, hook, tempProject, cleanup, initProject, docs, write, read,
  writeArchitecture, writeModulePrd, PASS_CMD, FAIL_CMD,
};
