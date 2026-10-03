#!/usr/bin/env node
'use strict';

/**
 * SubagentStart: automatic module claiming. A subagent dispatched with a "[bb:<module>]" marker
 * in its task description (or prompt) claims that module in the claim/lock table, so claiming never
 * depends on agents remembering to update a file. Conflicts are refused and the subagent is told to stop.
 */

const fs = require('fs');
const { readStdinJson, readText, timestamp } = require('../../scripts/lib/io');
const { isDisabled } = require('../../scripts/lib/switch');
const { projectDir, docsDir, docPaths, modulePrdPath } = require('../../scripts/lib/paths');
const { readState } = require('../../scripts/lib/state');
const claimsLib = require('../../scripts/lib/claims');
const { unfrozenDependencies } = require('../../scripts/lib/modules');
const { extractGates } = require('../../scripts/lib/gates');

const TRANSCRIPT_TAIL_BYTES = 4 * 1024 * 1024;

function emit(context) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: context },
  }));
}

function readTail(file, bytes) {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const size = fs.fstatSync(fd).size;
    const start = Math.max(0, size - bytes);
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    return buf.toString('utf8');
  } catch {
    return '';
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
  }
}

/**
 * Fallback when the hook input lacks the marker: find Agent/Task tool calls in the parent
 * transcript that have no result yet and carry a marker. Returns the unique module, or null if ambiguous.
 */
function moduleFromTranscript(transcriptPath, alreadyMapped) {
  if (!transcriptPath) return null;
  const pending = new Map();
  const resolved = new Set();
  for (const line of readTail(transcriptPath, TRANSCRIPT_TAIL_BYTES).split(/\r?\n/)) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }
    const content = entry && entry.message && Array.isArray(entry.message.content) ? entry.message.content : [];
    for (const block of content) {
      if (block.type === 'tool_use' && ['Agent', 'Task'].includes(block.name) && block.input) {
        const text = `${block.input.description || ''}\n${block.input.prompt || ''}`;
        const markers = claimsLib.extractModuleMarkers(text);
        if (markers.length === 1) pending.set(block.id, markers[0]);
      } else if (block.type === 'tool_result' && block.tool_use_id) {
        resolved.add(block.tool_use_id);
      }
    }
  }
  const candidates = new Set(
    [...pending.entries()].filter(([id]) => !resolved.has(id)).map(([, mod]) => mod).filter((mod) => !alreadyMapped.has(mod))
  );
  return candidates.size === 1 ? [...candidates][0] : null;
}

function ownershipContext({ name, mod, modules, docs, owner }) {
  const prd = modulePrdPath(docs, name);
  const deps = mod.depends_on || [];
  const gates = extractGates(readText(prd) || '');
  const automated = gates.flatMap((g) => g.automated);
  const manual = gates.flatMap((g) => g.manual);
  return [
    `[Backbone] You own module "${name}" — claimed for ${owner} in the claim/lock table.`,
    'Binding rules for this module:',
    `1. Your spec is ${prd}. It is self-contained — read it first. The non-negotiables in ${docPaths(docs).masterPrd} bind you too.`,
    `2. Only create or edit files inside this module's boundary: ${mod.paths.join(', ')}. Every other path belongs to another module.`,
    deps.length
      ? `3. You depend on: ${deps.join(', ')}. Use only their interface contracts in ${docPaths(docs).architecture} — never their internals.`
      : '3. This module has no module dependencies.',
    '4. Do not change your own interface contract. If it must change, stop and report why; interface changes are decided and logged in decision-log.md by the orchestrator.',
    `5. Nothing is done until the verification gates pass. When you stop, Backbone runs them automatically${automated.length ? `: ${automated.join(' && ')}` : ' (none automated are defined — report that as a spec defect)'}. If they fail you will be sent back to fix them.`,
    manual.length ? `6. Manual gates (only the user can confirm these; report evidence for each): ${manual.join('; ')}.` : '6. No manual gates.',
    `7. End your final message with [bb:${name}] and a gate-by-gate report (Given/When/Then criterion → evidence).`,
    modules.length > 1 ? `Other modules in flight must not be touched: ${modules.filter((m) => m.name !== name).map((m) => m.name).join(', ')}.` : '',
  ].filter(Boolean).join('\n');
}

function main() {
  const input = readStdinJson();
  const project = projectDir({ input });
  const docs = docsDir(project);
  const p = docPaths(docs);
  if (isDisabled(p)) return;
  if (!input.agent_id) return;

  let state;
  try { state = readState(p.state); } catch { return; }
  if (!state) return;

  let modules;
  try { modules = claimsLib.readModules(docs); } catch (err) {
    const markers = claimsLib.extractModuleMarkers(`${input.task_description || ''}\n${input.prompt || ''}`);
    if (markers.length) emit(`[Backbone] Cannot claim [bb:${markers[0]}]: ${err.message}. Stop and report this to the orchestrator.`);
    return;
  }

  const direct = claimsLib.extractModuleMarkers(`${input.task_description || ''}\n${input.prompt || ''}`);
  if (direct.length > 1) {
    emit(`[Backbone] This task carries several module markers (${direct.map((m) => `[bb:${m}]`).join(', ')}). One agent owns exactly one module: stop and report so the orchestrator can re-dispatch.`);
    return;
  }

  const owner = `subagent:${input.agent_type || 'agent'}:${input.agent_id}`;
  const outcome = claimsLib.transact(docs, (claims) => {
    const mapped = new Set(Object.values(claims.agents));
    const name = direct[0] || moduleFromTranscript(input.transcript_path, mapped);
    if (!name) return { kind: 'none', noChange: true };
    const mod = modules.find((m) => m.name === name);
    if (!mod) return { kind: 'unknown', name, noChange: true };
    const unfrozen = unfrozenDependencies(modules, name);
    if (unfrozen.length) return { kind: 'unfrozen', name, unfrozen, noChange: true };
    const result = claimsLib.claimModule(claims, name, owner, { agentId: input.agent_id });
    return result.ok
      ? { kind: 'ok', name, mod }
      : { kind: result.reason === 'done' ? 'already-done' : 'conflict', name, record: result.record, noChange: true };
  });

  switch (outcome.kind) {
    case 'none':
      return;
    case 'unknown':
      emit(`[Backbone] [bb:${outcome.name}] is not in the module boundary map in ${p.architecture}. Do not start work: stop and report the unknown module to the orchestrator.`);
      return;
    case 'unfrozen':
      emit(`[Backbone] Module "${outcome.name}" cannot start: dependency interfaces are not frozen yet (${outcome.unfrozen.join(', ')}). Do not write code. Stop now and report that it is blocked on those interface freezes.`);
      return;
    case 'already-done':
      emit(`[Backbone] Module "${outcome.name}" is already done (gates passed ${outcome.record.updated || 'earlier'}). Do not modify it. Stop and ask the orchestrator whether the user explicitly reopened it.`);
      return;
    case 'conflict':
      emit(`[Backbone] CONFLICT: module "${outcome.name}" is already claimed by ${outcome.record.owner} (since ${outcome.record.updated || timestamp()}). Do not edit any of its files. Stop immediately and report the conflict to the orchestrator.`);
      return;
    default:
      emit(ownershipContext({ name: outcome.name, mod: outcome.mod, modules, docs, owner }));
  }
}

try {
  main();
} catch (err) {
  process.stderr.write(`[backbone] subagent-start hook failed: ${err.stack || err.message}\n`);
}
