'use strict';

const { findBlocks } = require('./markdown');

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

/** Parse the ```backbone-modules JSON block from architecture.md. Returns null when absent. */
function parseModules(architectureMd) {
  const [block] = findBlocks(architectureMd, 'backbone-modules');
  if (!block) return null;
  let data;
  try {
    data = JSON.parse(block.body);
  } catch (err) {
    throw new Error(`architecture.md backbone-modules block is not valid JSON: ${err.message}`);
  }
  if (!data || !Array.isArray(data.modules)) {
    throw new Error('architecture.md backbone-modules block must be {"modules": [...]}.');
  }
  return data.modules;
}

function normalizePath(p) {
  return String(p).replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
}

/** The literal directory/file prefix of a path pattern, up to the first glob character. */
function staticPrefix(pattern) {
  const norm = normalizePath(pattern);
  const idx = norm.search(/[*?[{]/);
  if (idx === -1) return norm;
  const upTo = norm.slice(0, idx);
  return upTo.includes('/') ? upTo.slice(0, upTo.lastIndexOf('/')) : '';
}

/** Conservative ownership overlap: true when either static prefix contains the other on a path-segment boundary. */
function pathsOverlap(a, b) {
  const pa = staticPrefix(a);
  const pb = staticPrefix(b);
  if (pa === '' || pb === '') return true;
  if (pa === pb) return true;
  return pa.startsWith(`${pb}/`) || pb.startsWith(`${pa}/`);
}

function validateModules(modules) {
  const errors = [];
  const names = new Set();
  for (const [i, m] of modules.entries()) {
    const where = `module #${i + 1}${m && m.name ? ` (${m.name})` : ''}`;
    if (!m || typeof m !== 'object') { errors.push(`${where} is not an object`); continue; }
    if (!NAME_RE.test(m.name || '')) errors.push(`${where}: name must be kebab-case`);
    if (names.has(m.name)) errors.push(`${where}: duplicate name`);
    names.add(m.name);
    if (!Array.isArray(m.paths) || m.paths.length === 0) errors.push(`${where}: paths must be a non-empty array`);
    if (m.depends_on !== undefined && !Array.isArray(m.depends_on)) errors.push(`${where}: depends_on must be an array`);
    if (typeof m.interface_frozen !== 'boolean') errors.push(`${where}: interface_frozen must be true or false`);
  }
  if (errors.length) return { errors, order: null };
  for (const m of modules) {
    for (const dep of m.depends_on || []) {
      if (dep === m.name) errors.push(`module ${m.name}: depends on itself`);
      else if (!names.has(dep)) errors.push(`module ${m.name}: depends_on unknown module "${dep}"`);
    }
  }
  for (let i = 0; i < modules.length; i++) {
    for (let j = i + 1; j < modules.length; j++) {
      for (const pa of modules[i].paths) {
        for (const pb of modules[j].paths) {
          if (pathsOverlap(pa, pb)) {
            errors.push(`ownership overlap: ${modules[i].name} "${pa}" vs ${modules[j].name} "${pb}"`);
          }
        }
      }
    }
  }
  if (errors.length) return { errors, order: null };
  const order = topoOrder(modules);
  if (!order) errors.push('dependency graph has a cycle');
  return { errors, order };
}

/** Kahn's algorithm; returns module names in dependency order, or null on a cycle. */
function topoOrder(modules) {
  const indegree = new Map(modules.map((m) => [m.name, (m.depends_on || []).length]));
  const dependents = new Map(modules.map((m) => [m.name, []]));
  for (const m of modules) for (const dep of m.depends_on || []) dependents.get(dep).push(m.name);
  const queue = modules.filter((m) => indegree.get(m.name) === 0).map((m) => m.name);
  const order = [];
  while (queue.length) {
    const name = queue.shift();
    order.push(name);
    for (const d of dependents.get(name)) {
      indegree.set(d, indegree.get(d) - 1);
      if (indegree.get(d) === 0) queue.push(d);
    }
  }
  return order.length === modules.length ? order : null;
}

/** Dependencies whose interfaces are not yet frozen — a module must not start until this is empty. */
function unfrozenDependencies(modules, name) {
  const byName = new Map(modules.map((m) => [m.name, m]));
  const mod = byName.get(name);
  if (!mod) return [];
  return (mod.depends_on || []).filter((dep) => !(byName.get(dep) && byName.get(dep).interface_frozen));
}

module.exports = { parseModules, validateModules, topoOrder, unfrozenDependencies, pathsOverlap, staticPrefix, NAME_RE };
