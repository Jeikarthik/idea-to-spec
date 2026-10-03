'use strict';

const { findBlocks } = require('./markdown');

/**
 * Customer Validation Score. Ten parameters scored 1–5, each with an evidence grade.
 * Weighting follows Section 2: pain (frequency, severity) and evidence gate hardest;
 * market size and scalability count least.
 */
const PARAMETERS = [
  { key: 'problem_frequency', label: 'Problem frequency', weight: 3, pain: true },
  { key: 'problem_severity', label: 'Problem severity', weight: 3, pain: true },
  { key: 'affected_customer_count', label: 'Affected-customer count', weight: 1, market: true },
  { key: 'dissatisfaction_with_alternatives', label: 'Dissatisfaction with alternatives', weight: 2 },
  { key: 'willingness_to_adopt', label: 'Willingness to adopt', weight: 2 },
  { key: 'willingness_to_pay', label: 'Willingness to pay', weight: 2 },
  { key: 'market_growth', label: 'Market growth', weight: 1, market: true },
  { key: 'scalability', label: 'Scalability', weight: 1, market: true },
  { key: 'competitive_advantage', label: 'Competitive advantage', weight: 1 },
  { key: 'social_environmental_impact', label: 'Social/environmental impact', weight: 1 },
];

/** Evidence grades, weakest to strongest. "Real evidence" means anecdotal or stronger. */
const EVIDENCE = {
  assumed: 0,     // no evidence; a belief
  secondary: 1,   // desk research, reports, other people's claims
  anecdotal: 2,   // a lived/observed instance (including the founder's own real situation)
  interviews: 3,  // several non-leading (Mom Test) conversations describing past behaviour
  behavioral: 4,  // observed behaviour: usage, payment, pre-commitment, workaround spend
};
const REAL_EVIDENCE_MIN = EVIDENCE.anecdotal;

function parseCvsBlock(md) {
  const [block] = findBlocks(md, 'backbone-cvs');
  if (!block) return null;
  try {
    return JSON.parse(block.body);
  } catch (err) {
    throw new Error(`backbone-cvs block is not valid JSON: ${err.message}`);
  }
}

function evaluate(data, tier) {
  const blocking = [];
  const warnings = [];
  const scores = (data && data.scores) || {};
  const rows = [];
  let weighted = 0;
  let weightSum = 0;

  for (const p of PARAMETERS) {
    const entry = scores[p.key];
    if (!entry || !Number.isInteger(entry.score) || entry.score < 1 || entry.score > 5) {
      blocking.push(`INCOMPLETE: ${p.label} needs an integer score 1–5.`);
      rows.push({ ...p, score: null, evidence: entry && entry.evidence, reasoning: entry && entry.reasoning });
      continue;
    }
    if (!Object.prototype.hasOwnProperty.call(EVIDENCE, entry.evidence)) {
      blocking.push(`INCOMPLETE: ${p.label} needs an evidence grade (${Object.keys(EVIDENCE).join('/')}).`);
    }
    if (!entry.reasoning || !String(entry.reasoning).trim()) {
      blocking.push(`INCOMPLETE: ${p.label} needs written reasoning.`);
    }
    weighted += entry.score * p.weight;
    weightSum += p.weight;
    rows.push({ ...p, score: entry.score, evidence: entry.evidence, reasoning: entry.reasoning });
  }

  const byKey = Object.fromEntries(rows.map((r) => [r.key, r]));
  const pain = PARAMETERS.filter((p) => p.pain).map((p) => byKey[p.key]);
  const market = PARAMETERS.filter((p) => p.market).map((p) => byKey[p.key]);

  for (const r of pain) {
    if (r.score === null) continue;
    if (r.score <= 2) {
      blocking.push(`PAIN_WEAK: ${r.label} scored ${r.score}/5 — a lived, frequently-experienced pain is not established.`);
    }
    const grade = Object.prototype.hasOwnProperty.call(EVIDENCE, r.evidence) ? EVIDENCE[r.evidence] : -1;
    if (grade < REAL_EVIDENCE_MIN) {
      blocking.push(`PAIN_UNEVIDENCED: ${r.label} rests on "${r.evidence || 'none'}" evidence — needs a real lived/observed instance or stronger.`);
    }
  }

  const avg = (list) => {
    const vals = list.filter((r) => r.score !== null).map((r) => r.score);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const painAvg = avg(pain);
  const marketAvg = avg(market);
  const painBlocked = blocking.some((b) => b.startsWith('PAIN_'));
  if (marketAvg !== null && marketAvg >= 4 && painBlocked) {
    blocking.push(`INVERTED_PROFILE: market/scale sub-scores average ${marketAvg.toFixed(1)} while pain is weak or unevidenced — a large market does not substitute for real pain.`);
  }

  const scorers = Array.isArray(data && data.scored_by) ? data.scored_by.filter(Boolean) : [];
  if (scorers.length === 0) blocking.push('INCOMPLETE: scored_by must name who scored.');
  if ((tier === 'T3' || tier === 'T4') && scorers.length < 2) {
    blocking.push(`GROUP_SCORING_REQUIRED: ${tier} requires group scoring (at least two scorers); got ${scorers.length}.`);
  }

  const score = weightSum ? weighted / weightSum : null;
  if (score !== null && score < 3 && !blocking.length) {
    warnings.push(`LOW_OVERALL: weighted score ${score.toFixed(2)}/5 — proceed only with a clear reason in decision-log.md.`);
  }

  return {
    verdict: blocking.length ? 'blocked' : 'pass',
    weightedScore: score === null ? null : Number(score.toFixed(2)),
    painAverage: painAvg === null ? null : Number(painAvg.toFixed(2)),
    marketAverage: marketAvg === null ? null : Number(marketAvg.toFixed(2)),
    blocking,
    warnings,
    rows,
    scorers,
  };
}

function renderResult(result, date) {
  const lines = [
    `**CVS result (${date}):** ${result.verdict.toUpperCase()} · weighted ${result.weightedScore ?? '—'}/5 · pain avg ${result.painAverage ?? '—'} · market/scale avg ${result.marketAverage ?? '—'} · scored by ${result.scorers.join(', ') || '—'}`,
    '',
    '| Parameter | Weight | Score | Evidence |',
    '|---|---|---|---|',
    ...result.rows.map((r) => `| ${r.label} | ${r.weight} | ${r.score ?? '—'} | ${r.evidence || '—'} |`),
  ];
  if (result.blocking.length) lines.push('', '**Blocking flags:**', ...result.blocking.map((b) => `- ${b}`));
  if (result.warnings.length) lines.push('', '**Warnings:**', ...result.warnings.map((w) => `- ${w}`));
  return lines.join('\n');
}

module.exports = { PARAMETERS, EVIDENCE, REAL_EVIDENCE_MIN, parseCvsBlock, evaluate, renderResult };
