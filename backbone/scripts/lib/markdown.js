'use strict';

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Find fenced code blocks tagged with `lang`, e.g. ```backbone-gates auth
 * Returns [{ info, body, start, end }] where info is the text after the language tag.
 */
function findBlocks(md, lang) {
  if (!md) return [];
  const re = new RegExp(
    '^```' + escapeRegExp(lang) + '(?:[ \\t]+([^\\r\\n]*?))?[ \\t]*\\r?\\n([\\s\\S]*?)^```[ \\t]*$',
    'gm'
  );
  const blocks = [];
  let m;
  while ((m = re.exec(md)) !== null) {
    blocks.push({
      info: (m[1] || '').trim(),
      body: m[2].replace(/\r?\n$/, ''),
      start: m.index,
      end: m.index + m[0].length,
    });
  }
  return blocks;
}

/** Replace the body of the first fenced block tagged `lang`. Returns null if absent. */
function replaceFirstBlock(md, lang, body) {
  const [block] = findBlocks(md, lang);
  if (!block) return null;
  const info = block.info ? ` ${block.info}` : '';
  return `${md.slice(0, block.start)}\`\`\`${lang}${info}\n${body}\n\`\`\`${md.slice(block.end)}`;
}

function regionMarkers(name) {
  return { start: `<!-- backbone:${name}:start -->`, end: `<!-- backbone:${name}:end -->` };
}

/** Replace text between <!-- backbone:name:start --> and <!-- backbone:name:end -->. Returns null if markers are missing. */
function replaceRegion(md, name, content) {
  if (!md) return null;
  const { start, end } = regionMarkers(name);
  const s = md.indexOf(start);
  const e = md.indexOf(end);
  if (s === -1 || e === -1 || e < s) return null;
  return `${md.slice(0, s + start.length)}\n${content}\n${md.slice(e)}`;
}

function escapeCell(value) {
  return String(value === null || value === undefined || value === '' ? '—' : value)
    .replace(/\r?\n/g, ' ')
    .replace(/\|/g, '\\|');
}

function renderTable(headers, rows) {
  const lines = [
    `| ${headers.map(escapeCell).join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
  ];
  for (const row of rows) lines.push(`| ${row.map(escapeCell).join(' | ')} |`);
  return lines.join('\n');
}

/** Split markdown into sections at the given heading level: [{ heading, body }]. Content before the first heading is ignored. */
function sections(md, level = 2) {
  if (!md) return [];
  const hashes = '#'.repeat(level);
  const re = new RegExp(`^${hashes}[ \\t]+(.+?)[ \\t]*$`, 'gm');
  const heads = [];
  let m;
  while ((m = re.exec(md)) !== null) heads.push({ heading: m[1], index: m.index, after: m.index + m[0].length });
  return heads.map((h, i) => ({
    heading: h.heading,
    body: md.slice(h.after, i + 1 < heads.length ? heads[i + 1].index : md.length),
  }));
}

module.exports = { findBlocks, replaceFirstBlock, replaceRegion, regionMarkers, renderTable, sections, escapeRegExp };
