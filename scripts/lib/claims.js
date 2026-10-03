'use strict';

const fs = require('fs');
const { readText, writeFileAtomic, withLock, timestamp } = require('./io');
const { replaceRegion, renderTable } = require('./markdown');
const { docPaths } = require('./paths');
const { parseModules } = require('./modules');

const CLAIM_STATUSES = ['unclaimed', 'in-progress', 'done'];
/** Marker that ties a dispatched subagent to a module, e.g. "[bb:auth]". */
const MODULE_MARKER_RE = /\[bb:([a-z0-9][a-z0-9-]*)\]/g;

function emptyClaims() {
  return { version: 1, modules: {}, agents: {} };
}

function loadClaims(docs) {
  const raw = readText(docPaths(docs).claims);
  if (raw === null) return emptyClaims();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(`claims.json is not valid JSON: ${err.message}`);
  }
  return { ...emptyClaims(), ...data, modules: data.modules || {}, agents: data.agents || {} };
}

function saveClaims(docs, claims) {
  writeFileAtomic(docPaths(docs).claims, `${JSON.stringify(claims, null, 2)}\n`);
}

function moduleRecord(claims, name) {
  return claims.modules[name] || {
    status: 'unclaimed', owner: null, updated: null, notes: '', gate_attempts: 0,
  };
}

function extractModuleMarkers(text) {
  if (!text) return [];
  const found = new Set();
  for (const m of String(text).matchAll(MODULE_MARKER_RE)) found.add(m[1]);
  return [...found];
}

/** Read module definitions from architecture.md; returns [] when the file or block is missing. */
function readModules(docs) {
  const md = readText(docPaths(docs).architecture);
  if (md === null) return [];
  return parseModules(md) || [];
}

function renderClaimsTable(claims, moduleNames) {
  const names = [...new Set([...moduleNames, ...Object.keys(claims.modules)])];
  const rows = names.map((name) => {
    const r = moduleRecord(claims, name);
    return [name, r.status, r.owner, r.updated, r.notes];
  });
  return renderTable(['Module', 'Status', 'Owning agent/session', 'Last updated', 'Notes'], rows);
}

/** Re-render the claim/lock table inside architecture.md. Returns false when markers are missing. */
function syncArchitecture(docs, claims) {
  const file = docPaths(docs).architecture;
  const md = readText(file);
  if (md === null) return false;
  const names = (parseModules(md) || []).map((m) => m.name);
  const updated = replaceRegion(md, 'claims', renderClaimsTable(claims, names));
  if (updated === null) return false;
  if (updated !== md) writeFileAtomic(file, updated);
  return true;
}

/**
 * Mutate claims under the project lock, persist, and re-render architecture.md.
 * `mutator(claims)` returns a result object that is passed back to the caller; a result marked
 * `{ noChange: true }` is not persisted, so a read-only inspection never creates or touches state.
 */
function transact(docs, mutator) {
  fs.mkdirSync(docs, { recursive: true });
  return withLock(docPaths(docs).lock, () => {
    const claims = loadClaims(docs);
    const result = mutator(claims);
    if (!result || !result.noChange) {
      saveClaims(docs, claims);
      syncArchitecture(docs, claims);
    }
    return result;
  });
}

function claimModule(claims, name, owner, { now = new Date(), agentId = null, force = false } = {}) {
  const current = moduleRecord(claims, name);
  if (current.status === 'in-progress' && current.owner && current.owner !== owner && !force) {
    return { ok: false, reason: 'claimed', record: current };
  }
  if (current.status === 'done' && !force) {
    return { ok: false, reason: 'done', record: current };
  }
  if (force) {
    for (const [id, mod] of Object.entries(claims.agents)) {
      if (mod === name) delete claims.agents[id];
    }
  }
  claims.modules[name] = {
    ...current, status: 'in-progress', owner, updated: timestamp(now), notes: '', gate_attempts: 0,
  };
  if (agentId) claims.agents[agentId] = name;
  return { ok: true, record: claims.modules[name] };
}

function releaseModule(claims, name, { status = 'unclaimed', notes = '', now = new Date() } = {}) {
  if (!CLAIM_STATUSES.includes(status)) {
    throw new Error(`Invalid claim status "${status}". Expected one of ${CLAIM_STATUSES.join(', ')}.`);
  }
  const current = moduleRecord(claims, name);
  claims.modules[name] = {
    ...current, status, owner: null, updated: timestamp(now), notes, gate_attempts: 0,
  };
  for (const [agentId, mod] of Object.entries(claims.agents)) {
    if (mod === name) delete claims.agents[agentId];
  }
  return claims.modules[name];
}

module.exports = {
  CLAIM_STATUSES, MODULE_MARKER_RE, emptyClaims, loadClaims, saveClaims, moduleRecord,
  extractModuleMarkers, readModules, renderClaimsTable, syncArchitecture, transact, claimModule, releaseModule,
};
