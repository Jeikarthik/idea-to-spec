'use strict';

const fs = require('fs');
const path = require('path');
const { PLUGIN_ROOT } = require('./paths');

const TIERS = ['T1', 'T2', 'T3', 'T4'];

let cached = null;
function load() {
  if (!cached) {
    cached = JSON.parse(fs.readFileSync(path.join(PLUGIN_ROOT, 'data', 'stages.json'), 'utf8'));
  }
  return cached;
}

function assertTier(tier) {
  if (!TIERS.includes(tier)) {
    throw new Error(`Invalid tier "${tier}". Expected one of ${TIERS.join(', ')}.`);
  }
}

function tierRank(tier) {
  assertTier(tier);
  return TIERS.indexOf(tier);
}

/** Resolve every stage for a tier: applicability, depth, and the frameworks that fire. */
function plan(tier) {
  assertTier(tier);
  return load().stages.map((stage) => {
    const t = stage.tiers[tier];
    return {
      id: stage.id,
      key: stage.key,
      name: stage.name,
      skill: stage.skill,
      documents: stage.documents,
      applicability: t.applicability,
      depth: t.depth,
      frameworks: t.applicability === 'skip'
        ? []
        : stage.frameworks
          .filter((f) => f.tiers.includes(tier))
          .map((f) => ({ name: f.name, condition: f.condition || null, compose: f.compose || null })),
    };
  });
}

function documentsFor(tier) {
  assertTier(tier);
  return load().documents.filter((d) => d.tiers.includes(tier));
}

function stageById(id) {
  return load().stages.find((s) => s.id === id) || null;
}

function stageByKey(key) {
  return load().stages.find((s) => s.key === key) || null;
}

/** Stage id for a stage key. Code refers to stages by key so adding a stage never silently re-targets a rule. */
function idOf(key) {
  const stage = stageByKey(key);
  if (!stage) throw new Error(`Unknown stage key "${key}".`);
  return stage.id;
}

function stageCount() {
  return load().stages.length;
}

function tierInfo(tier) {
  assertTier(tier);
  return load().tiers[tier];
}

function handoffTarget(tier) {
  assertTier(tier);
  return load().handoff[tier];
}

function renderPlan(tier) {
  const info = tierInfo(tier);
  const lines = [
    `# Backbone plan — ${tier} (${info.label})`,
    '',
    `Timeframe: ${info.timeframe} · Typical output: ${info.typical_output} · Ceremony: ${info.ceremony}`,
    '',
    'Cross-cutting: every AI-generated plan, canvas, architecture choice, or scope gets an adversarial pass (backbone:adversarial-review) and explicit sign-off before it is locked into master-prd.md.',
    '',
  ];
  for (const s of plan(tier)) {
    lines.push(`## Stage ${s.id} — ${s.name} [${s.applicability}]`);
    lines.push(`Skill: backbone:${s.skill}`);
    lines.push(`Depth: ${s.depth}`);
    for (const f of s.frameworks) {
      const extras = [f.condition && `when: ${f.condition}`, f.compose && `compose: ${f.compose}`].filter(Boolean);
      lines.push(`- ${f.name}${extras.length ? ` (${extras.join('; ')})` : ''}`);
    }
    lines.push('');
  }
  lines.push('## Documents at this tier');
  for (const d of documentsFor(tier)) {
    lines.push(`- ${d.file} — ${d.purpose}${d.condition ? ` (only if: ${d.condition})` : ''}`);
  }
  lines.push('');
  lines.push(`Execution handoff: ${handoffTarget(tier)}`);
  return lines.join('\n');
}

module.exports = {
  TIERS, load, plan, documentsFor, stageById, stageByKey, idOf, stageCount, tierInfo, tierRank, assertTier, handoffTarget, renderPlan,
};
