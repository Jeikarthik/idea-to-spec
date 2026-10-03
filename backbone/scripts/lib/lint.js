'use strict';

const fs = require('fs');
const path = require('path');
const { readText } = require('./io');
const { sections, regionMarkers } = require('./markdown');
const { docPaths, modulePrdPath } = require('./paths');
const { parseModules, validateModules } = require('./modules');
const { extractGates } = require('./gates');
const cvs = require('./cvs');

const PLACEHOLDER_RE = /^(|tbd|todo|pending|n\/a|none|-|—|<.*>|\[.*\])$/i;
const GWT_RE = /\bGiven\b[\s\S]*?\bWhen\b[\s\S]*?\bThen\b/;
const DOD_RE = /Definition of Done/i;

/** Drop fenced code blocks so an illustrative example is never read as a real entry or section. */
function stripFences(md) {
  return String(md || '').replace(/^```[^\n]*\n[\s\S]*?^```[ \t]*$/gm, '');
}

/** Parse decision-log.md entries: "## DL-001 — date — title" followed by "- Key: value" lines. */
function parseDecisionLog(md) {
  const entries = new Map();
  for (const sec of sections(stripFences(md), 2)) {
    const idMatch = sec.heading.match(/^(DL-\d{3,})\b/);
    if (!idMatch) continue;
    const fields = {};
    for (const line of sec.body.split(/\r?\n/)) {
      const m = line.match(/^\s*[-*]\s*([A-Za-z][A-Za-z /-]*?)\s*:\s*(.*)$/);
      if (m) fields[m[1].trim().toLowerCase()] = m[2].trim();
    }
    entries.set(idMatch[1], { id: idMatch[1], heading: sec.heading, fields });
  }
  return entries;
}

function isSignedOff(entry) {
  const by = entry.fields['signed off by'];
  return Boolean(by) && !PLACEHOLDER_RE.test(by);
}

/** Validate a DL reference for a given entry type; returns an error string or null. */
function checkDecisionRef(entries, id, type) {
  const entry = entries.get(id);
  if (!entry) return `${id} not found in decision-log.md`;
  const actual = (entry.fields.type || '').toLowerCase();
  if (actual !== type) return `${id} has Type "${entry.fields.type || '—'}", expected "${type}"`;
  if (!isSignedOff(entry)) return `${id} has no explicit "Signed off by" value`;
  if (type === 'adversarial-review') {
    for (const field of ['weakest assumption', 'most likely failure', 'alternative framing']) {
      if (!entry.fields[field] || PLACEHOLDER_RE.test(entry.fields[field])) {
        return `${id} is missing "${field}" — the adversarial pass is incomplete`;
      }
    }
  }
  return null;
}

/** Every master-prd.md section must cite a signed-off adversarial review (Section 2). */
function checkMasterPrd(docs, entries, { onlyHeading } = {}) {
  const errors = [];
  const md = readText(docPaths(docs).masterPrd);
  if (md === null) return ['master-prd.md does not exist'];
  const secs = sections(stripFences(md), 2).filter((s) => !onlyHeading || onlyHeading.test(s.heading));
  if (!secs.length) {
    return [onlyHeading ? `master-prd.md has no section matching ${onlyHeading}` : 'master-prd.md has no sections'];
  }
  for (const sec of secs) {
    const refs = [...sec.body.matchAll(/Sign-off:\s*(DL-\d{3,})/g)].map((m) => m[1]);
    if (!refs.length) {
      errors.push(`master-prd.md "${sec.heading}" has no "Sign-off: DL-###" line — not stress-tested before locking`);
      continue;
    }
    for (const id of refs) {
      const err = checkDecisionRef(entries, id, 'adversarial-review');
      if (err) errors.push(`master-prd.md "${sec.heading}": ${err}`);
    }
    if (/<!--\s*fill|\bTBD\b|\bTODO\b/.test(sec.body)) {
      errors.push(`master-prd.md "${sec.heading}" still contains unfilled placeholders (TBD/TODO/<!-- fill -->)`);
    }
  }
  return errors;
}

function checkAcceptance(label, md) {
  const errors = [];
  if (!GWT_RE.test(md)) errors.push(`${label} has no Given/When/Then acceptance criteria`);
  if (!DOD_RE.test(md)) errors.push(`${label} has no Definition of Done`);
  return errors;
}

function checkWorkUnits(docs, tier) {
  const errors = [];
  const warnings = [];
  const p = docPaths(docs);
  if (tier === 'T1' || tier === 'T2') {
    const md = readText(p.workPackages);
    if (md === null) return { errors: ['work-packages.md does not exist'], warnings };
    const gates = extractGates(md);
    if (!gates.length) errors.push('work-packages.md has no ```backbone-gates blocks — nothing can be verified');
    for (const g of gates) {
      if (!g.id) errors.push('work-packages.md has a backbone-gates block without a package id (```backbone-gates wp-1)');
      if (!g.automated.length && !g.manual.length) errors.push(`work-packages.md gates for ${g.id || '?'} are empty`);
    }
    errors.push(...checkAcceptance('work-packages.md', md));
    return { errors, warnings };
  }

  const arch = readText(p.architecture);
  if (arch === null) return { errors: ['architecture.md does not exist'], warnings };
  let modules;
  try {
    modules = parseModules(arch);
  } catch (err) {
    return { errors: [err.message], warnings };
  }
  if (!modules) return { errors: ['architecture.md has no ```backbone-modules block (module boundary map)'], warnings };
  const { errors: modErrors } = validateModules(modules);
  errors.push(...modErrors);
  const { start, end } = regionMarkers('claims');
  if (!arch.includes(start) || !arch.includes(end)) errors.push('architecture.md is missing the claim/lock table markers');
  for (const m of modules) {
    const label = `modules/${m.name}.md`;
    const md = readText(modulePrdPath(docs, m.name));
    if (md === null) { errors.push(`${label} does not exist`); continue; }
    const gates = extractGates(md);
    if (!gates.length || gates.every((g) => !g.automated.length && !g.manual.length)) {
      errors.push(`${label} has no verification gates (\`\`\`backbone-gates block)`);
    }
    if (!/interface contract/i.test(md)) errors.push(`${label} has no interface contract section`);
    errors.push(...checkAcceptance(label, md));
  }
  if (fs.existsSync(p.modulesDir)) {
    const known = new Set(modules.map((m) => `${m.name}.md`));
    for (const f of fs.readdirSync(p.modulesDir)) {
      if (f.endsWith('.md') && !known.has(f)) warnings.push(`modules/${f} is not in the architecture.md module boundary map`);
    }
  }
  return { errors, warnings };
}

const SECRET_KEY_RE = /(SECRET|TOKEN|PASSWORD|PASSWD|PRIVATE|API_KEY|ACCESS_KEY|_KEY)$/i;
const SAFE_VALUE_RE = /^(|<.*>|changeme|change-me|your[-_].*|xxx+|\*+|example.*|placeholder.*|replace[-_].*)$/i;

function checkEnvExample(project) {
  const errors = [];
  const text = readText(path.join(project, '.env.example'));
  if (text === null) return errors;
  for (const [i, raw] of text.split(/\r?\n/).entries()) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const key = line.replace(/^export\s+/, '').split('=')[0].trim();
    const value = line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    if (SECRET_KEY_RE.test(key) && !SAFE_VALUE_RE.test(value)) {
      errors.push(`.env.example line ${i + 1}: ${key} looks like it holds a real secret — use an empty or <placeholder> value`);
    }
  }
  return errors;
}

function evaluateCvs(docs, tier) {
  const md = readText(docPaths(docs).validation);
  if (md === null) return { error: 'validation.md does not exist' };
  const data = cvs.parseCvsBlock(md);
  if (!data) return { error: 'validation.md has no ```backbone-cvs block' };
  return { result: cvs.evaluate(data, tier) };
}

/** Full document check for `backbone.js check`. */
function checkProject({ project, docs, state }) {
  const errors = [];
  const warnings = [];
  const entries = parseDecisionLog(readText(docPaths(docs).decisionLog) || '');
  const byId = new Map(state.stages.map((s) => [s.id, s]));
  const reached = (id) => ['done', 'rework'].includes(byId.get(id).status);

  if (reached(3)) {
    const { error, result } = evaluateCvs(docs, state.tier);
    if (error) errors.push(`Stage 3 is closed but ${error}`);
    else if (result.verdict !== 'pass') {
      const override = /Override:\s*(DL-\d{3,})/.exec(byId.get(3).notes || '');
      const overrideErr = override ? checkDecisionRef(entries, override[1], 'override') : 'no signed-off override recorded';
      if (overrideErr) errors.push(`Customer Validation Score is BLOCKED (${result.blocking.length} flag(s)) and ${overrideErr}`);
      else warnings.push(`Customer Validation Score is BLOCKED but overridden by ${override[1]}`);
    }
  }
  if (fs.existsSync(docPaths(docs).masterPrd)) errors.push(...checkMasterPrd(docs, entries));
  if (reached(10)) {
    const units = checkWorkUnits(docs, state.tier);
    errors.push(...units.errors);
    warnings.push(...units.warnings);
  }
  errors.push(...checkEnvExample(project));
  for (const [id, entry] of entries) {
    const type = (entry.fields.type || '').toLowerCase();
    if (!type) warnings.push(`${id} has no Type`);
  }
  return { errors, warnings };
}

module.exports = {
  stripFences, parseDecisionLog, checkDecisionRef, checkMasterPrd, checkWorkUnits, checkEnvExample, evaluateCvs, checkProject,
  GWT_RE,
};
