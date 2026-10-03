'use strict';

const TIMEFRAMES = ['hours', 'days', 'weeks', 'months'];

function parseBool(value, name) {
  const v = String(value).trim().toLowerCase();
  if (['yes', 'y', 'true', '1'].includes(v)) return true;
  if (['no', 'n', 'false', '0'].includes(v)) return false;
  throw new Error(`--${name} must be yes or no (got "${value}").`);
}

/**
 * Stage 0 tier classification from the four intake answers.
 * Precedence: a short (hours/days) build is T1 regardless of anything else; otherwise a real
 * external client/industry stakeholder makes it T4; otherwise a team makes it T3; otherwise T2.
 * Tensions are surfaced for explicit confirmation rather than silently resolved.
 */
function classify({ timeframe, team, client, judged }) {
  if (!TIMEFRAMES.includes(timeframe)) {
    throw new Error(`--timeframe must be one of ${TIMEFRAMES.join(', ')} (got "${timeframe}").`);
  }
  const teamSize = Number(team);
  if (!Number.isInteger(teamSize) || teamSize < 1) throw new Error(`--team must be a positive integer (got "${team}").`);
  const hasClient = parseBool(client, 'client');
  const isJudged = parseBool(judged, 'judged');

  const rationale = [];
  const tensions = [];
  let tier;

  if (timeframe === 'hours' || timeframe === 'days') {
    tier = 'T1';
    rationale.push(`Timeframe is ${timeframe}: hackathon/buildathon depth, near-zero ceremony.`);
    if (isJudged) rationale.push('Being judged/pitched: Stage 14 packaging reverse-engineers the judging rubric.');
    if (hasClient) tensions.push('A real external client on an hours/days timeframe: confirm this is a throwaway prototype and not a client deliverable (which would be T4).');
    if (teamSize > 1) rationale.push(`Team of ${teamSize}, but the timeframe dominates; one shared work-packages.md still suffices.`);
  } else if (hasClient) {
    tier = 'T4';
    rationale.push('A real external client/industry stakeholder: sourced market sizing, stakeholder mapping, compliance awareness.');
    if (timeframe === 'weeks') tensions.push('T4 work usually runs months+; confirm the weeks timeframe is realistic for a client-grade deliverable.');
  } else if (teamSize >= 2) {
    tier = 'T3';
    rationale.push(`Team of ${teamSize} over ${timeframe}: full validation set, module PRDs, shared docs.`);
  } else {
    tier = 'T2';
    rationale.push(`Solo over ${timeframe}: validated concept, locked scope, light self-paced ceremony.`);
  }

  if (isJudged && tier !== 'T1') {
    tensions.push(`Judged/pitched over ${timeframe}: Stage 14 at ${tier} does positioning, not rubric mapping; add rubric mapping to packaging.md if a judged event is the real deadline.`);
  }

  return { tier, rationale, tensions, inputs: { timeframe, team: teamSize, client: hasClient, judged: isJudged } };
}

module.exports = { classify, TIMEFRAMES, parseBool };
