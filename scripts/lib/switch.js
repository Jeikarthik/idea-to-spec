'use strict';

/**
 * The stop switch. Backbone is on by default; any one of these turns it off:
 *   - BACKBONE_DISABLE=1 in the environment;
 *   - a global flag file (every project on this machine);
 *   - a project flag file (<docs>/.backbone-disabled).
 * A flag file may carry `until: YYYY-MM-DD` (a snooze); once that date has passed the flag is ignored.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { readText, today } = require('./io');

/** Where the global flag lives. Override with BACKBONE_HOME (tests use this). */
function globalHome() {
  return path.resolve(process.env.BACKBONE_HOME || path.join(os.homedir(), '.claude', 'backbone'));
}

function globalFlagPath() {
  return path.join(globalHome(), 'disabled');
}

/** Parse a flag file: null if absent, otherwise { until, reason, active }. */
function readFlag(file, now = new Date()) {
  const text = readText(file);
  if (text === null) return null;
  const until = (text.match(/^until:\s*(\d{4}-\d{2}-\d{2})\s*$/m) || [])[1] || null;
  const reason = (text.match(/^reason:\s*(.+)$/m) || [])[1] || null;
  // YYYY-MM-DD strings compare correctly as text; the snooze covers the whole `until` day.
  return { until, reason, active: !until || today(now) <= until };
}

/**
 * Why Backbone is off for this project, or null when it is on.
 * `p` is the object from paths.docPaths().
 */
function disabledReason(p, now = new Date()) {
  if (process.env.BACKBONE_DISABLE === '1') return { scope: 'env', until: null, reason: 'BACKBONE_DISABLE=1' };
  const project = readFlag(p.disabled, now);
  if (project && project.active) return { scope: 'project', until: project.until, reason: project.reason };
  const global = readFlag(globalFlagPath(), now);
  if (global && global.active) return { scope: 'global', until: global.until, reason: global.reason };
  return null;
}

function isDisabled(p, now) {
  return disabledReason(p, now) !== null;
}

function addDays(days, now = new Date()) {
  const d = new Date(now);
  d.setUTCDate(d.getUTCDate() + days); // today() is UTC, so step in UTC too
  return today(d);
}

/** Write a flag file. `days` (optional) makes it a snooze ending after that many days. */
function writeFlag(file, { scope, days, reason, now = new Date() }) {
  const lines = [
    `Backbone disabled (${scope}) on ${today(now)}. Delete this file, or run "enable${scope === 'global' ? ' --global' : ''}", to turn it back on.`,
  ];
  if (days) lines.push(`until: ${addDays(days, now)}`);
  if (reason) lines.push(`reason: ${String(reason).replace(/\s+/g, ' ').trim()}`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
  return readFlag(file, now);
}

function describe(off) {
  if (!off) return 'on';
  const where = { env: 'by the BACKBONE_DISABLE environment variable', project: 'for this project', global: 'globally (every project on this machine)' }[off.scope];
  return `off ${where}${off.until ? ` until ${off.until} (snooze)` : ''}${off.reason && off.scope !== 'env' ? ` — ${off.reason}` : ''}`;
}

module.exports = { globalHome, globalFlagPath, readFlag, disabledReason, isDisabled, writeFlag, describe };
