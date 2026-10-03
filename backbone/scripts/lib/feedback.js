'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return null;
  const d = new Date(`${s}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Latest "## YYYY-MM-DD" entry heading in feedback-log.md, or null. */
function lastFeedbackDate(feedbackLogMd) {
  if (!feedbackLogMd) return null;
  const dates = [...feedbackLogMd.matchAll(/^##\s+(\d{4}-\d{2}-\d{2})\b/gm)]
    .map((m) => parseDate(m[1]))
    .filter(Boolean)
    .sort((a, b) => b - a);
  return dates[0] || null;
}

/**
 * Whether a post-ship feedback checkpoint is due (Stage 15).
 * Applies at T2+ once shipped; due when cadence days have passed since ship or the last logged touchpoint.
 */
function feedbackStatus(state, feedbackLogMd, now = new Date()) {
  if (!state) return { applicable: false, reason: 'No Backbone state.' };
  if (state.tier === 'T1') return { applicable: false, reason: 'Feedback loop does not apply at T1.' };
  const shipped = parseDate(state.shipped_at);
  if (!shipped) return { applicable: false, reason: 'Project has not shipped (run `backbone.js ship`).' };
  const last = lastFeedbackDate(feedbackLogMd);
  const anchor = last && last > shipped ? last : shipped;
  const todayUtc = parseDate(now.toISOString().slice(0, 10));
  const daysSince = Math.floor((todayUtc - anchor) / DAY_MS);
  const cadence = state.feedback_cadence_days;
  return {
    applicable: true,
    due: daysSince >= cadence,
    daysSince,
    cadence,
    anchor: anchor.toISOString().slice(0, 10),
    anchorKind: last && last > shipped ? 'last feedback entry' : 'ship date',
  };
}

module.exports = { feedbackStatus, lastFeedbackDate, parseDate };
