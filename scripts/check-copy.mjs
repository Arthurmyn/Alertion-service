/* global console, process */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Filler, banned words, «тариф», and trailing participles from the copy rules.
const banned = [
  'тариф',
  'погрузиться',
  'гобелен',
  'мозаика',
  'калейдоскоп',
  'бесшовный',
  'ключевой',
  'фундаментальный',
  'революционный',
  'симфония',
  'маяк',
  'ландшафт',
  'палитра',
  'более того',
  'кроме того',
  'тем не менее',
  'стоит отметить',
  'важно понимать',
  'важно помнить',
  'нельзя не упомянуть',
  'таким образом',
  'подводя итог',
  'в заключение',
  'подчёркивая',
  'подчеркивая',
  'демонстрируя',
  'отражая',
  'обеспечивая',
  'содействуя',
  'способствуя',
  'раскрыть потенциал',
  'пролить свет',
  'в эпоху цифровизации',
  'не секрет, что',
  'представьте себе',
  'надеюсь, эта информация',
  'дайте знать, если',
  'delve',
  'tapestry',
  'testament',
  'beacon',
  'landscape',
  'realm',
  'embark',
  'foster',
  'nuance',
  'multifaceted',
  'underscore',
  'crucial',
  'pivotal',
  'vibrant',
  'bustling',
  'intricate',
  'holistic',
  'leverage',
];

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.html']);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const bannedRe = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${banned
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join('|')})(?![\\p{L}\\p{N}_])`,
  'giu',
);
const contrastRe = /не только.{0,80}но и/iu;
const hrefRe = /href\s*=\s*(?:\{\s*)?["']#["']/;
const boldRe = /\*\*[^*]+\*\*\s*:|\*\*[^*]+:[^*]*\*\*/;
const limitRe = /(?<![\p{L}\p{N}_])(?:20|50|150)(?![\p{L}\p{N}_])/gu;

const allowsLimitNumbers = (rel) =>
  rel === 'src/data/limits.ts' ||
  rel.startsWith('e2e/') ||
  /\.(test|spec)\.(tsx?|jsx?|mts|cts)$/.test(rel);

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (exts.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

function hitsIn(rel, line, number) {
  const hits = [];
  const at = `${rel}:${number}`;

  for (const word of line.match(bannedRe) ?? []) {
    hits.push(`${at}: banned word «${word}»`);
  }
  if (contrastRe.test(line)) hits.push(`${at}: «не только…, но и…»`);
  if (hrefRe.test(line)) hits.push(`${at}: href="#"`);
  if (boldRe.test(line)) hits.push(`${at}: bold-term bullet`);
  if (!allowsLimitNumbers(rel)) {
    for (const value of line.match(limitRe) ?? []) {
      hits.push(`${at}: hardcoded ${value}`);
    }
  }
  return hits;
}

const files = [
  ...(await walk(path.join(root, 'src'))),
  ...(await walk(path.join(root, 'e2e'))),
  path.join(root, 'index.html'),
];

const hits = [];
for (const file of files) {
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    continue;
  }
  const rel = path.relative(root, file).split(path.sep).join('/');
  text.split('\n').forEach((line, index) => {
    hits.push(...hitsIn(rel, line, index + 1));
  });
}

if (hits.length > 0) {
  console.error(hits.join('\n'));
  process.exit(1);
}

console.log('copy ok');
