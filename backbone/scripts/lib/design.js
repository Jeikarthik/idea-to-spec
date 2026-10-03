'use strict';

/**
 * Design tokens: the ```backbone-tokens block in design.md. It is to the UI what the module map is to
 * the file tree — one locked source several agents share, so parallel modules do not each invent a
 * palette. Backbone checks it (required groups per tier, valid colours, WCAG contrast on the declared
 * pairs), exports it as CSS custom properties, and audits code for colours that bypass it.
 */

const fs = require('fs');
const path = require('path');
const { findBlocks } = require('./markdown');

const HEX_RE = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

/** Token groups that must be present, by tier. Colour and font are the floor everywhere. */
const REQUIRED = {
  T1: ['color', 'font'],
  T2: ['color', 'font', 'type_scale', 'space', 'radius'],
  T3: ['color', 'font', 'type_scale', 'space', 'radius', 'motion'],
  T4: ['color', 'font', 'type_scale', 'space', 'radius', 'motion'],
};
const PALETTES = ['color', 'color_dark'];

/** Minimum contrast by pair kind: body text, large text (≥24px or ≥19px bold), and UI/graphics. */
const THRESHOLDS = { text: 4.5, large: 3, ui: 3 };

function parseTokens(md) {
  const [block] = findBlocks(md, 'backbone-tokens');
  if (!block) return null;
  let data;
  try {
    data = JSON.parse(block.body);
  } catch (err) {
    throw new Error(`design.md backbone-tokens block is not valid JSON: ${err.message}`);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('design.md backbone-tokens block must be a JSON object.');
  return data;
}

function expandHex(hex) {
  const h = hex.slice(1);
  return h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
}

/** WCAG 2.x relative luminance of an sRGB hex colour. */
function luminance(hex) {
  const h = expandHex(hex);
  const [r, g, b] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Every declared pair, evaluated in every palette that defines both colours. */
function contrastResults(tokens) {
  const results = [];
  for (const pair of tokens.contrast_pairs || []) {
    const [fg, bg, kind = 'text'] = pair;
    for (const palette of PALETTES) {
      const colors = tokens[palette];
      if (!colors || !(fg in colors) || !(bg in colors)) continue;
      if (!HEX_RE.test(colors[fg]) || !HEX_RE.test(colors[bg])) continue;
      const ratio = contrastRatio(colors[fg], colors[bg]);
      const min = THRESHOLDS[kind] || THRESHOLDS.text;
      results.push({ palette, fg, bg, kind, ratio: Math.round(ratio * 100) / 100, min, passed: ratio >= min });
    }
  }
  return results;
}

/** Structural and accessibility check. Returns { errors, warnings, contrast }. */
function validateTokens(tokens, tier = 'T2') {
  const errors = [];
  const warnings = [];
  for (const group of REQUIRED[tier] || REQUIRED.T2) {
    const g = tokens[group];
    if (!g || typeof g !== 'object' || !Object.keys(g).length) errors.push(`backbone-tokens has no "${group}" group (required at ${tier})`);
  }
  for (const palette of PALETTES) {
    const colors = tokens[palette];
    if (colors === undefined) continue;
    if (!colors || typeof colors !== 'object') { errors.push(`"${palette}" must be an object of name → hex`); continue; }
    for (const [name, value] of Object.entries(colors)) {
      if (!NAME_RE.test(name)) errors.push(`${palette}.${name}: token names must be kebab-case`);
      if (!HEX_RE.test(String(value))) errors.push(`${palette}.${name}: "${value}" is not a #rgb or #rrggbb colour`);
    }
  }
  if (tokens.color && Object.keys(tokens.color).length < 2) errors.push('"color" needs at least a background and a text colour');
  if (tier !== 'T1' && !tokens.color_dark) warnings.push('no "color_dark" palette — light/dark is expected from T2 up (or record why not in design.md)');
  if (tokens.color_dark && tokens.color) {
    const missing = Object.keys(tokens.color).filter((k) => !(k in tokens.color_dark));
    if (missing.length) warnings.push(`color_dark is missing ${missing.join(', ')} — those roles fall back to the light value`);
  }

  const pairs = tokens.contrast_pairs;
  if (!Array.isArray(pairs) || !pairs.length) {
    errors.push('backbone-tokens declares no "contrast_pairs" — list every foreground/background pair the UI uses, e.g. ["text", "bg"]');
  } else {
    for (const [i, pair] of pairs.entries()) {
      if (!Array.isArray(pair) || pair.length < 2 || pair.length > 3) { errors.push(`contrast_pairs[${i}] must be [foreground, background] or [foreground, background, "text"|"large"|"ui"]`); continue; }
      const [fg, bg, kind] = pair;
      if (kind !== undefined && !(kind in THRESHOLDS)) errors.push(`contrast_pairs[${i}]: kind "${kind}" must be text, large or ui`);
      for (const name of [fg, bg]) {
        if (!tokens.color || !(name in tokens.color)) errors.push(`contrast_pairs[${i}]: "${name}" is not a colour in "color"`);
      }
    }
  }
  const contrast = errors.length ? [] : contrastResults(tokens);
  for (const r of contrast) {
    if (!r.passed) errors.push(`contrast ${r.fg} on ${r.bg} (${r.palette}) is ${r.ratio}:1 — needs ${r.min}:1 for ${r.kind}`);
  }
  return { errors, warnings, contrast };
}

function cssBlock(selector, vars, indent = '') {
  return [`${indent}${selector} {`, ...vars.map(([k, v]) => `${indent}  --${k}: ${v};`), `${indent}}`].join('\n');
}

/** Export as CSS custom properties: light on :root, dark under prefers-color-scheme and [data-theme="dark"]. */
function toCss(tokens) {
  const vars = [];
  for (const [group, prefix] of [['color', 'color'], ['font', 'font'], ['type_scale', 'text'], ['space', 'space'], ['radius', 'radius'], ['shadow', 'shadow'], ['motion', 'motion']]) {
    for (const [k, v] of Object.entries(tokens[group] || {})) vars.push([`${prefix}-${k}`, v]);
  }
  const out = ['/* Generated by Backbone from design.md (backbone-tokens). Edit design.md, not this file. */', cssBlock(':root', vars)];
  const dark = Object.entries(tokens.color_dark || {}).map(([k, v]) => [`color-${k}`, v]);
  if (dark.length) {
    out.push('', '@media (prefers-color-scheme: dark) {', cssBlock(':root:not([data-theme="light"])', dark, '  '), '}', '', cssBlock(':root[data-theme="dark"]', dark));
  }
  return `${out.join('\n')}\n`;
}

const AUDIT_EXT = new Set(['.css', '.scss', '.sass', '.less', '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.html', '.astro']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage', 'vendor']);
const CODE_HEX_RE = /(^|[^\w&])#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})(?![\w-])/g;

function walk(target, files) {
  let stat;
  try { stat = fs.statSync(target); } catch { return; }
  if (stat.isDirectory()) {
    if (SKIP_DIRS.has(path.basename(target))) return;
    for (const entry of fs.readdirSync(target)) walk(path.join(target, entry), files);
  } else if (AUDIT_EXT.has(path.extname(target).toLowerCase())) {
    files.push(target);
  }
}

/**
 * Find colour literals in code that are not token values. Lines marked `token-ok` are exempt, and so is
 * any file that starts with the generated-CSS banner. Returns [{ file, line, value }].
 */
function auditColors(targets, tokens, { cwd = process.cwd() } = {}) {
  const allowed = new Set();
  for (const palette of PALETTES) {
    for (const v of Object.values(tokens[palette] || {})) if (HEX_RE.test(String(v))) allowed.add(expandHex(String(v)).toLowerCase());
  }
  const files = [];
  for (const t of targets) walk(path.resolve(cwd, t), files);
  const findings = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    if (text.startsWith('/* Generated by Backbone from design.md')) continue;
    text.split(/\r?\n/).forEach((line, i) => {
      if (/token-ok/.test(line)) return;
      for (const m of line.matchAll(CODE_HEX_RE)) {
        const raw = m[2];
        // 4- and 8-digit literals carry alpha, which tokens do not express — always worth a look.
        const known = (raw.length === 3 || raw.length === 6) && allowed.has(expandHex(`#${raw}`).toLowerCase());
        if (!known) findings.push({ file: path.relative(cwd, file).replace(/\\/g, '/'), line: i + 1, value: `#${raw}` });
      }
    });
  }
  return findings;
}

module.exports = { REQUIRED, THRESHOLDS, parseTokens, luminance, contrastRatio, contrastResults, validateTokens, toCss, auditColors };
