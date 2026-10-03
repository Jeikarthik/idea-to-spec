'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const h = require('./helpers');
const design = require('../scripts/lib/design');
const { runGates } = require('../scripts/lib/gates');

const TOKENS = {
  color: { bg: '#FFFFFF', text: '#111111', muted: '#595959', primary: '#1F4FD1', 'on-primary': '#FFFFFF' },
  color_dark: { bg: '#101010', text: '#F2F2F2', muted: '#A6A6A6', primary: '#8AA8FF', 'on-primary': '#101010' },
  font: { body: 'system-ui, sans-serif' },
  type_scale: { base: '16px' },
  space: { 1: '4px' },
  radius: { md: '8px' },
  motion: { fast: '120ms' },
  contrast_pairs: [['text', 'bg'], ['muted', 'bg'], ['on-primary', 'primary'], ['primary', 'bg', 'ui']],
};

function designMd(tokens = TOKENS, { flows = true, components = true } = {}) {
  return [
    '# Experience & Design',
    '',
    '## Design tokens',
    '',
    '```backbone-tokens',
    JSON.stringify(tokens, null, 2),
    '```',
    '',
    '## User flows',
    '',
    flows ? '1. Open the app — Home — sees today\'s list.' : '<!-- fill -->',
    '',
    '## Components and states (T3+)',
    '',
    components ? '| Button | default/hover/focus/disabled/loading | |' : '<!-- fill -->',
    '',
  ].join('\n');
}

/* ------------------------------------------------------------------ design lib */

test('contrast ratios match WCAG reference values', () => {
  assert.strictEqual(Math.round(design.contrastRatio('#000000', '#FFFFFF') * 100) / 100, 21);
  assert.strictEqual(Math.round(design.contrastRatio('#FFF', '#FFFFFF') * 100) / 100, 1);
  const grey = design.contrastRatio('#767676', '#FFFFFF');
  assert.ok(grey >= 4.5 && grey < 4.6, `#767676 on white is the classic AA edge (${grey})`);
  assert.ok(design.contrastRatio('#777777', '#FFFFFF') < 4.5, '#777 just fails AA for text');
});

test('validateTokens enforces groups by tier, valid colours, pairs and contrast', () => {
  assert.deepStrictEqual(design.validateTokens(TOKENS, 'T3').errors, []);

  const t1Only = { color: TOKENS.color, font: TOKENS.font, contrast_pairs: [['text', 'bg']] };
  assert.deepStrictEqual(design.validateTokens(t1Only, 'T1').errors, [], 'colour + font is enough at T1');
  assert.ok(design.validateTokens(t1Only, 'T2').errors.some((e) => /"type_scale"/.test(e)), 'T2 needs a type scale');
  assert.ok(design.validateTokens(t1Only, 'T2').warnings.some((w) => /color_dark/.test(w)), 'T2 expects dark mode');

  const bad = { ...TOKENS, color: { ...TOKENS.color, muted: 'grey' } };
  assert.ok(design.validateTokens(bad, 'T2').errors.some((e) => /muted: "grey" is not a #rgb/.test(e)));

  const unknownPair = { ...TOKENS, contrast_pairs: [['text', 'paper']] };
  assert.ok(design.validateTokens(unknownPair, 'T2').errors.some((e) => /"paper" is not a colour/.test(e)));

  const noPairs = { ...TOKENS, contrast_pairs: [] };
  assert.ok(design.validateTokens(noPairs, 'T2').errors.some((e) => /no "contrast_pairs"/.test(e)));

  const lowContrast = { ...TOKENS, color: { ...TOKENS.color, muted: '#AAAAAA' } };
  const r = design.validateTokens(lowContrast, 'T2');
  assert.ok(r.errors.some((e) => /contrast muted on bg \(color\) is 2\.\d+:1 — needs 4\.5:1/.test(e)), r.errors.join('\n'));

  // A UI pair only needs 3:1.
  const uiPair = { ...TOKENS, color: { ...TOKENS.color, primary: '#6B8CFF' }, contrast_pairs: [['primary', 'bg', 'ui']] };
  assert.deepStrictEqual(design.validateTokens(uiPair, 'T2').errors, []);
});

test('toCss exports light tokens on :root and dark tokens for both dark-mode selectors', () => {
  const css = design.toCss(TOKENS);
  assert.match(css, /:root \{\n {2}--color-bg: #FFFFFF;/);
  assert.match(css, /--text-base: 16px;/);
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{\n {2}:root:not\(\[data-theme="light"\]\) \{/);
  assert.match(css, /:root\[data-theme="dark"\] \{\n {2}--color-bg: #101010;/);
});

test('auditColors finds colour literals that bypass the tokens', (t) => {
  const project = h.tempProject();
  t.after(() => h.cleanup(project));
  h.write(path.join(project, 'src/ui/button.css'), '.b { color: #1f4fd1; background: #FFF; border: 1px solid #ccc; }\n');
  h.write(path.join(project, 'src/ui/card.tsx'), 'const c = "#ff0000"; // token-ok: brand partner logo\nconst d = "#00ff0080";\n');
  h.write(path.join(project, 'src/ui/tokens.css'), design.toCss({ ...TOKENS, color: { ...TOKENS.color, extra: '#123456' } }));
  h.write(path.join(project, 'src/ui/node_modules/x.css'), '.x { color: #abcdef; }\n');
  const findings = design.auditColors(['src/ui'], TOKENS, { cwd: project });
  assert.deepStrictEqual(findings.map((f) => `${f.file}:${f.line} ${f.value}`).sort(), [
    'src/ui/button.css:1 #ccc',
    'src/ui/card.tsx:2 #00ff0080',
  ]);
});

/* ------------------------------------------------------------------ CLI + enforcement */

test('Stage 9 cannot close without valid tokens and flows; it can be skipped when there is no UI', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  const dmd = path.join(h.docs(project), 'design.md');

  let r = h.cli(project, ['stage', '9', 'done']);
  assert.strictEqual(r.code, 2);
  assert.match(r.err, /design\.md does not exist/);
  assert.match(r.err, /stage 9 skipped --note/);

  h.cli(project, ['scaffold', 'design']);
  assert.match(h.cli(project, ['stage', '9', 'done']).err, /still uses the template's placeholder palette/, 'the starter palette is not a design');

  h.write(dmd, designMd({ ...TOKENS, color: { ...TOKENS.color, muted: '#BBBBBB' } }));
  r = h.cli(project, ['stage', '9', 'done']);
  assert.match(r.err, /contrast muted on bg/);

  h.write(dmd, designMd(TOKENS, { flows: false }));
  assert.match(h.cli(project, ['stage', '9', 'done']).err, /"User flows" section is unfilled/);

  h.write(dmd, designMd(TOKENS, { components: false }));
  assert.match(h.cli(project, ['stage', '9', 'done']).err, /"Components and states" section is unfilled/, 'components are T3+');

  h.write(dmd, designMd());
  assert.strictEqual(h.cli(project, ['stage', '9', 'done']).code, 0);
  assert.strictEqual(h.cli(project, ['check']).out.includes('design.md'), false, 'check is clean for a valid design');

  const cli = h.initProject({ tier: 'T2', name: 'a-cli' });
  t.after(() => h.cleanup(cli));
  assert.match(h.cli(cli, ['stage', '9', 'skipped']).err, /needs --note/);
  assert.strictEqual(h.cli(cli, ['stage', '9', 'skipped', '--note', 'no user-facing UI: a command-line tool']).code, 0);
});

test('tokens command: validation table, CSS export, and the audit used as a gate', (t) => {
  const project = h.initProject({ tier: 'T2' });
  t.after(() => h.cleanup(project));
  assert.match(h.cli(project, ['tokens']).err, /scaffold design/);
  assert.strictEqual(h.cli(project, ['scaffold', 'design']).code, 0);

  let r = h.cli(project, ['tokens']);
  assert.strictEqual(r.code, 0, r.out + r.err);
  assert.match(r.out, /PASS — tokens are valid at T2/);
  assert.match(r.out, /ok {3}text on bg \(color\): \d+(\.\d+)?:1/);

  r = h.cli(project, ['tokens', '--css', 'src/styles/tokens.css']);
  assert.strictEqual(r.code, 0, r.err);
  assert.match(h.read(path.join(project, 'src/styles/tokens.css')), /--color-primary: #2E5BDA;/);

  h.write(path.join(project, 'src/ui/app.css'), 'body { color: #333333; }\n');
  r = h.cli(project, ['tokens', '--audit', 'src']);
  assert.strictEqual(r.code, 1);
  assert.match(r.out, /src\/ui\/app\.css:1 #333333/);
  assert.doesNotMatch(r.out, /tokens\.css/, 'the generated export is not audited');

  // The same audit as a built-in gate line: runs the CLI directly, no shell.
  const failing = runGates(['backbone: tokens --audit src/ui'], { cwd: project });
  assert.strictEqual(failing.passed, false);
  h.write(path.join(project, 'src/ui/app.css'), 'body { color: var(--color-text); }\n');
  assert.strictEqual(runGates(['backbone: tokens --audit src/ui'], { cwd: project }).passed, true);
});

test('the template palette passes contrast at every tier', () => {
  const tokens = design.parseTokens(fs.readFileSync(path.join(h.PLUGIN_ROOT, 'templates', 'design.md'), 'utf8'));
  for (const tier of ['T1', 'T2', 'T3', 'T4']) {
    const r = design.validateTokens(tokens, tier);
    assert.deepStrictEqual(r.errors, [], `${tier}: ${r.errors.join('; ')}`);
    assert.deepStrictEqual(r.warnings, []);
  }
});

test('Stage 10 needs a threat model from T2 but not at T1', (t) => {
  const t1 = h.initProject({ tier: 'T1' });
  const t2 = h.initProject({ tier: 'T2' });
  t.after(() => { h.cleanup(t1); h.cleanup(t2); });
  assert.strictEqual(h.cli(t1, ['stage', '10', 'done']).code, 0, 'T1 architecture is real-vs-stubbed only');

  assert.match(h.cli(t2, ['stage', '10', 'done']).err, /security\.md does not exist/);
  h.cli(t2, ['scaffold', 'security']);
  const r = h.cli(t2, ['stage', '10', 'done']);
  assert.match(r.err, /"Threat model" section is unfilled/);
  assert.doesNotMatch(r.err, /Data classification/, 'data classification is T3+');

  const sec = path.join(h.docs(t2), 'security.md');
  h.write(sec, [
    '# Security',
    '## Threat model',
    '| Boundary | Threat | Mitigation |',
    '|---|---|---|',
    '| browser ↔ API | Spoofing: stolen session | httpOnly cookies, 7-day expiry |',
    '## Secrets',
    'Only DATABASE_URL, in the host env.',
    '## Authentication and authorization',
    'Magic-link email; every query is scoped to the user id on the server.',
  ].join('\n'));
  assert.strictEqual(h.cli(t2, ['stage', '10', 'done']).code, 0);
});

test('Stage 13 needs the release plan for the tier, and ship warns without it', (t) => {
  const t1 = h.initProject({ tier: 'T1' });
  const t3 = h.initProject({ tier: 'T3' });
  t.after(() => { h.cleanup(t1); h.cleanup(t3); });

  assert.match(h.cli(t1, ['ship']).out, /Warning: Stage 13 \(Release & Operations\) is not-started/);

  assert.match(h.cli(t1, ['stage', '13', 'done']).err, /release\.md does not exist/);
  h.cli(t1, ['scaffold', 'release']);
  assert.match(h.cli(t1, ['stage', '13', 'done']).err, /"Demo plan" section is unfilled/);
  const rel = path.join(h.docs(t1), 'release.md');
  h.write(rel, h.read(rel).replace(/## Demo plan \(T1\)\n\n<!--[\s\S]*?-->/, '## Demo plan (T1)\n\nRuns on the team laptop: `npm run demo`. Backup video: demo.mp4 on the shared drive.'));
  assert.strictEqual(h.cli(t1, ['stage', '13', 'done']).code, 0);

  h.cli(t3, ['scaffold', 'release']);
  const err = h.cli(t3, ['stage', '13', 'done']).err;
  for (const name of ['Environments', 'CI/CD', 'Rollback', 'Observability', 'Rollout strategy', 'Runbook']) {
    assert.match(err, new RegExp(`"${name.replace('/', '\\/')}" section is unfilled`), name);
  }
  assert.doesNotMatch(err, /SLOs/, 'SLOs are T4');
});

test('new documents scaffold only at their tiers', (t) => {
  const t1 = h.initProject({ tier: 'T1' });
  const t3 = h.initProject({ tier: 'T3' });
  t.after(() => { h.cleanup(t1); h.cleanup(t3); });
  assert.match(h.cli(t1, ['scaffold', 'security']).err, /does not apply at T1/);
  assert.match(h.cli(t1, ['scaffold', 'risks']).err, /does not apply at T1/);
  for (const doc of ['design', 'security', 'test-strategy', 'release', 'risks']) {
    assert.strictEqual(h.cli(t3, ['scaffold', doc]).code, 0, doc);
  }
  assert.match(h.read(path.join(h.docs(t3), 'risks.md')), /R-001/);
});

test('a UI module agent is handed the design tokens; a non-UI module is not', (t) => {
  const project = h.initProject({ tier: 'T3' });
  t.after(() => h.cleanup(project));
  h.writeArchitecture(project, [
    { name: 'web', purpose: 'screens', paths: ['src/web/**'], depends_on: [], ui: true, interface_frozen: false },
    { name: 'api', purpose: 'endpoints', paths: ['src/api/**'], depends_on: [], interface_frozen: false },
  ]);
  h.writeModulePrd(project, 'web', { gates: [h.PASS_CMD] });
  h.writeModulePrd(project, 'api', { gates: [h.PASS_CMD] });
  h.write(path.join(h.docs(project), 'design.md'), designMd());

  const web = h.hook('subagent-start', { hook_event_name: 'SubagentStart', cwd: project, agent_id: 'w1', task_description: '[bb:web]', prompt: '[bb:web]' });
  assert.match(web.context, /Design is locked in .*design\.md/);
  assert.match(web.context, /colours: bg, text, muted, primary, on-primary \(light \+ dark\)/);

  const api = h.hook('subagent-start', { hook_event_name: 'SubagentStart', cwd: project, agent_id: 'a1', task_description: '[bb:api]', prompt: '[bb:api]' });
  assert.match(api.context, /You own module "api"/);
  assert.doesNotMatch(api.context, /Design is locked/);
});
