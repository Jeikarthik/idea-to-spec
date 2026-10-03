'use strict';

const fs = require('fs');
const path = require('path');
const { PLUGIN_ROOT, docPaths, modulePrdPath } = require('./paths');

/**
 * Document scaffolding. Each key maps a Backbone document to its template, its destination, and the
 * tiers it applies at (per data/stages.json). `needsName` documents take --name.
 */
const DOCUMENTS = {
  brief: { template: 'brief.md', dest: (ctx) => path.join(ctx.docs, 'brief.md'), tiers: ['T1', 'T2', 'T3', 'T4'] },
  problem: { template: 'problem.md', dest: (ctx) => path.join(ctx.docs, 'problem.md'), tiers: ['T1', 'T2', 'T3', 'T4'] },
  validation: { template: 'validation.md', dest: (ctx) => docPaths(ctx.docs).validation, tiers: ['T2', 'T3', 'T4'] },
  canvas: { template: 'canvas.md', dest: (ctx) => path.join(ctx.docs, 'canvas.md'), tiers: ['T2', 'T3', 'T4'] },
  'discovery-tree': { template: 'discovery-tree.md', dest: (ctx) => path.join(ctx.docs, 'discovery-tree.md'), tiers: ['T2', 'T3', 'T4'] },
  viability: { template: 'viability.md', dest: (ctx) => path.join(ctx.docs, 'viability.md'), tiers: ['T3', 'T4'] },
  retention: { template: 'retention.md', dest: (ctx) => path.join(ctx.docs, 'retention.md'), tiers: ['T2', 'T3', 'T4'] },
  packaging: { template: 'packaging.md', dest: (ctx) => path.join(ctx.docs, 'packaging.md'), tiers: ['T1', 'T2', 'T3', 'T4'] },
  'feedback-log': { template: 'feedback-log.md', dest: (ctx) => docPaths(ctx.docs).feedbackLog, tiers: ['T2', 'T3', 'T4'] },
  'decision-log': { template: 'decision-log.md', dest: (ctx) => docPaths(ctx.docs).decisionLog, tiers: ['T1', 'T2', 'T3', 'T4'] },
  'master-prd': { template: 'master-prd.md', dest: (ctx) => docPaths(ctx.docs).masterPrd, tiers: ['T1', 'T2', 'T3', 'T4'] },
  architecture: { template: 'architecture.md', dest: (ctx) => docPaths(ctx.docs).architecture, tiers: ['T1', 'T2', 'T3', 'T4'] },
  'work-packages': { template: 'work-packages.md', dest: (ctx) => docPaths(ctx.docs).workPackages, tiers: ['T1', 'T2'] },
  module: { template: 'module.md', dest: (ctx, name) => modulePrdPath(ctx.docs, name), tiers: ['T3', 'T4'], needsName: true },
  prerequisites: { template: 'prerequisites.md', dest: (ctx) => path.join(ctx.docs, 'prerequisites.md'), tiers: ['T1', 'T2', 'T3', 'T4'] },
  'env-example': { template: 'env.example', dest: (ctx) => path.join(ctx.project, '.env.example'), tiers: ['T1', 'T2', 'T3', 'T4'] },
  migration: { template: 'migration.sql', dest: (ctx, name) => path.join(ctx.docs, 'migrations', `${nextMigrationNumber(ctx.docs)}_${name}.sql`), tiers: ['T1', 'T2', 'T3', 'T4'], needsName: true },
  'speckit-constitution': { template: 'handoff/speckit-constitution.md', dest: (ctx) => path.join(ctx.docs, 'handoff', 'constitution.md'), tiers: ['T1', 'T2'] },
  'speckit-spec': { template: 'handoff/speckit-spec-seed.md', dest: (ctx) => path.join(ctx.docs, 'handoff', 'spec-seed.md'), tiers: ['T1', 'T2'] },
  'bmad-brief': { template: 'handoff/bmad-brief.md', dest: (ctx) => path.join(ctx.docs, 'handoff', 'project-brief.md'), tiers: ['T3', 'T4'] },
  dispatch: { template: 'handoff/subagent-dispatch.md', dest: (ctx, name) => path.join(ctx.docs, 'handoff', `dispatch-${name}.md`), tiers: ['T3', 'T4'], needsName: true },
};

function nextMigrationNumber(docs) {
  const dir = path.join(docs, 'migrations');
  let max = 0;
  try {
    for (const f of fs.readdirSync(dir)) {
      const m = f.match(/^(\d{4})_/);
      if (m) max = Math.max(max, Number(m[1]));
    }
  } catch { /* no migrations yet */ }
  return String(max + 1).padStart(4, '0');
}

function render(templateName, vars) {
  const raw = fs.readFileSync(path.join(PLUGIN_ROOT, 'templates', templateName), 'utf8');
  return raw.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

module.exports = { DOCUMENTS, render, nextMigrationNumber };
