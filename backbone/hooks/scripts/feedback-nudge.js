#!/usr/bin/env node
'use strict';

/**
 * SessionStart: post-ship feedback nudge (Stage 13). Once a T2+ project has shipped, remind the
 * session when a real-user checkpoint is due so deadline pressure does not quietly skip collecting signal.
 */

const { readStdinJson, readText } = require('../../scripts/lib/io');
const { isDisabled } = require('../../scripts/lib/switch');
const { projectDir, docsDir, docPaths } = require('../../scripts/lib/paths');
const { readState } = require('../../scripts/lib/state');
const { feedbackStatus } = require('../../scripts/lib/feedback');

function main() {
  const input = readStdinJson();
  const project = projectDir({ input });
  const docs = docsDir(project);
  const p = docPaths(docs);
  if (isDisabled(p)) return;

  let state;
  try { state = readState(p.state); } catch { return; }
  const status = feedbackStatus(state, readText(p.feedbackLog));
  if (!status.applicable || !status.due) return;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: [
        `[Backbone] Feedback checkpoint DUE for "${state.project}": ${status.daysSince} day(s) since the ${status.anchorKind} (${status.anchor}); cadence is every ${status.cadence} day(s).`,
        'Raise this with the user at a natural point early in the session and use the backbone:feedback-loop skill:',
        'collect real reactions from actual users, re-score the Customer Validation Score with real data, and re-run the relevant discovery-tree branch to decide the next iteration.',
        'Do not fabricate user feedback. If no real users were reached, log that honestly in feedback-log.md.',
      ].join('\n'),
    },
  }));
}

try {
  main();
} catch (err) {
  process.stderr.write(`[backbone] feedback-nudge hook failed: ${err.stack || err.message}\n`);
}
