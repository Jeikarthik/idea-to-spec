'use strict';

const stages = require('./stages');
const { findBlocks, renderTable } = require('./markdown');
const { readText, writeFileAtomic, today } = require('./io');

const STATUSES = ['not-started', 'in-progress', 'done', 'skipped', 'blocked', 'rework'];
const MODES = ['greenfield', 'bootstrap'];
const STAGE_COUNT = 14;

function assertStatus(status) {
  if (!STATUSES.includes(status)) {
    throw new Error(`Invalid stage status "${status}". Expected one of ${STATUSES.join(', ')}.`);
  }
}

function createState({ project, tier, mode, reason, now = new Date() }) {
  stages.assertTier(tier);
  if (!MODES.includes(mode)) throw new Error(`Invalid mode "${mode}". Expected greenfield or bootstrap.`);
  if (!project || !String(project).trim()) throw new Error('Project name is required.');
  if (!reason || !String(reason).trim()) throw new Error('A triage rationale (--reason) is required.');
  const date = today(now);
  return {
    backbone_version: 1,
    project: String(project).trim(),
    tier,
    mode,
    created: date,
    updated: date,
    shipped_at: null,
    feedback_cadence_days: 7,
    tier_history: [{ tier, date, reason: String(reason).trim() }],
    work_packages: {},
    stages: stages.plan(tier).map((s) => ({
      id: s.id,
      name: s.name,
      skill: s.skill,
      applicability: s.applicability,
      depth: s.depth,
      status: s.id === 0 ? 'in-progress' : s.applicability === 'skip' ? 'skipped' : 'not-started',
      updated: date,
      notes: s.applicability === 'skip' ? `Not applicable at ${tier}.` : '',
    })),
  };
}

function validateState(state) {
  const problems = [];
  if (!state || typeof state !== 'object') return ['state is not an object'];
  if (!stages.TIERS.includes(state.tier)) problems.push(`invalid tier "${state.tier}"`);
  if (!MODES.includes(state.mode)) problems.push(`invalid mode "${state.mode}"`);
  if (!Array.isArray(state.stages) || state.stages.length !== STAGE_COUNT) {
    problems.push(`expected ${STAGE_COUNT} stages`);
  } else {
    state.stages.forEach((s, i) => {
      if (s.id !== i) problems.push(`stage at position ${i} has id ${s.id}`);
      if (!STATUSES.includes(s.status)) problems.push(`stage ${i} has invalid status "${s.status}"`);
      if (!['active', 'conditional', 'skip'].includes(s.applicability)) problems.push(`stage ${i} has invalid applicability "${s.applicability}"`);
    });
  }
  if (!Array.isArray(state.tier_history)) problems.push('tier_history must be an array');
  if (state.shipped_at !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(state.shipped_at))) {
    problems.push('shipped_at must be null or YYYY-MM-DD');
  }
  if (!Number.isInteger(state.feedback_cadence_days) || state.feedback_cadence_days < 1) {
    problems.push('feedback_cadence_days must be a positive integer');
  }
  return problems;
}

function parseState(md) {
  const [block] = findBlocks(md, 'backbone-state');
  if (!block) throw new Error('state.md has no ```backbone-state block.');
  let state;
  try {
    state = JSON.parse(block.body);
  } catch (err) {
    throw new Error(`state.md backbone-state block is not valid JSON: ${err.message}`);
  }
  const problems = validateState(state);
  if (problems.length) throw new Error(`state.md is invalid: ${problems.join('; ')}`);
  state.work_packages = state.work_packages || {};
  return state;
}

/** Returns null when state.md does not exist; throws when it exists but is malformed. */
function readState(file) {
  const md = readText(file);
  return md === null ? null : parseState(md);
}

function renderState(state) {
  const info = stages.tierInfo(state.tier);
  const stageRows = state.stages.map((s) => [s.id, s.name, s.applicability, s.depth, s.status, s.updated, s.notes]);
  const lines = [
    '# Backbone State',
    '',
    '> Canonical machine state is the `backbone-state` block at the bottom of this file; the tables are rendered from it.',
    '> Change it through the Backbone CLI (`/backbone-status`, or `node "<plugin>/scripts/backbone.js" stage <id> <status>`), not by hand.',
    '',
    `**Project:** ${state.project} · **Tier:** ${state.tier} (${info.label}) · **Mode:** ${state.mode} · **Shipped:** ${state.shipped_at || 'no'} · **Updated:** ${state.updated}`,
    '',
    '## Stages',
    '',
    renderTable(['#', 'Stage', 'Applies', 'Depth at this tier', 'Status', 'Updated', 'Notes'], stageRows),
    '',
    '## Tier history',
    '',
    renderTable(['Date', 'Tier', 'Reason'], state.tier_history.map((h) => [h.date, h.tier, h.reason])),
    '',
  ];
  const wp = Object.entries(state.work_packages || {});
  if (wp.length) {
    lines.push('## Work packages', '');
    lines.push(renderTable(['Package', 'Status', 'Updated', 'Notes'], wp.map(([id, w]) => [id, w.status, w.updated, w.notes])));
    lines.push('');
  }
  lines.push('```backbone-state', JSON.stringify(state, null, 2), '```', '');
  return lines.join('\n');
}

function writeState(file, state, now = new Date()) {
  state.updated = today(now);
  const problems = validateState(state);
  if (problems.length) throw new Error(`Refusing to write invalid state: ${problems.join('; ')}`);
  writeFileAtomic(file, renderState(state));
}

function setStageStatus(state, id, status, notes, now = new Date()) {
  assertStatus(status);
  const stage = state.stages.find((s) => s.id === id);
  if (!stage) throw new Error(`No stage with id ${id}.`);
  stage.status = status;
  stage.updated = today(now);
  if (notes !== undefined) stage.notes = notes;
  return stage;
}

/**
 * Re-triage after an explicit scope change. Completed work is kept; stages whose depth
 * increased are flagged `rework`; newly applicable stages reopen; newly skipped, unstarted stages close.
 */
function retier(state, newTier, reason, now = new Date()) {
  stages.assertTier(newTier);
  if (!reason || !String(reason).trim()) throw new Error('A reason is required to re-triage.');
  const oldTier = state.tier;
  const date = today(now);
  const deeper = stages.tierRank(newTier) > stages.tierRank(oldTier);
  const newPlan = stages.plan(newTier);
  state.stages = state.stages.map((s) => {
    const p = newPlan[s.id];
    const next = { ...s, applicability: p.applicability, depth: p.depth, skill: p.skill };
    if (s.id === 0) {
      return { ...next, status: 'done', updated: date, notes: `Re-triaged ${oldTier} → ${newTier}.` };
    }
    if (p.applicability === 'skip') {
      if (s.status === 'not-started' || s.status === 'skipped') {
        return { ...next, status: 'skipped', updated: date, notes: `Not applicable at ${newTier}.` };
      }
      return { ...next, notes: `${s.notes ? `${s.notes} ` : ''}Not applicable at ${newTier}; existing output kept.` };
    }
    if (s.status === 'skipped') {
      return { ...next, status: 'not-started', updated: date, notes: `Now applicable at ${newTier}.` };
    }
    if (deeper && (s.status === 'done' || s.status === 'rework') && s.depth !== p.depth) {
      return { ...next, status: 'rework', updated: date, notes: `Done at ${oldTier} depth; deepen to ${newTier}: ${p.depth}` };
    }
    return next;
  });
  state.tier = newTier;
  state.tier_history.push({ tier: newTier, date, reason: String(reason).trim() });
  return state;
}

/** The next stage the orchestrator should run, or null when everything applicable is closed. */
function nextStage(state) {
  return state.stages.find((s) => {
    if (s.applicability === 'skip') return false;
    if (s.status === 'done' || s.status === 'skipped') return false;
    if (s.id === 13 && !state.shipped_at) return false;
    return true;
  }) || null;
}

module.exports = {
  STATUSES, MODES, createState, parseState, readState, renderState, writeState,
  validateState, setStageStatus, retier, nextStage, assertStatus,
};
