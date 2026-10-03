'use strict';

const { spawnSync } = require('child_process');
const { findBlocks } = require('./markdown');

/**
 * Parse ```backbone-gates blocks. Each non-blank, non-# line is a gate:
 *   <shell command>            — automated gate; must exit 0
 *   manual: <description>      — human-verified gate; only a user can confirm it
 * The block info string (```backbone-gates wp-1) scopes gates to a work package.
 */
function extractGates(md) {
  return findBlocks(md, 'backbone-gates').map((block) => {
    const automated = [];
    const manual = [];
    for (const rawLine of block.body.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const manualMatch = line.match(/^manual:\s*(.+)$/i);
      if (manualMatch) manual.push(manualMatch[1].trim());
      else automated.push(line);
    }
    return { id: block.info || null, automated, manual };
  });
}

function tail(text, max) {
  if (!text) return '';
  return text.length > max ? `…${text.slice(-max)}` : text;
}

function runGates(commands, { cwd, timeoutSec = 300, outputLimit = 1500 } = {}) {
  const results = commands.map((command) => {
    const started = Date.now();
    const r = spawnSync(command, {
      cwd,
      shell: true,
      encoding: 'utf8',
      timeout: timeoutSec * 1000,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    });
    const timedOut = Boolean(r.error && r.error.code === 'ETIMEDOUT');
    return {
      command,
      passed: !r.error && r.status === 0,
      exitCode: r.status,
      timedOut,
      error: r.error && !timedOut ? r.error.message : null,
      durationMs: Date.now() - started,
      output: tail(`${r.stdout || ''}${r.stderr ? `\n${r.stderr}` : ''}`.trim(), outputLimit),
    };
  });
  return { passed: results.every((r) => r.passed), results };
}

function summarizeResults({ results }) {
  return results.map((r) => {
    const verdict = r.passed ? 'PASS' : r.timedOut ? 'TIMEOUT' : `FAIL (exit ${r.exitCode})`;
    const detail = r.passed ? '' : `\n${r.error || r.output || '(no output)'}`;
    return `- ${verdict}: ${r.command}${detail}`;
  }).join('\n');
}

module.exports = { extractGates, runGates, summarizeResults };
