import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import {
  convertMmahMedianToPoints,
  convertMmahSvgPathToNormalized,
} from '../src/engines/hanziStroke';

const SOURCES = {
  hskComplete:
    'https://raw.githubusercontent.com/drkameleon/complete-hsk-vocabulary/main/complete.min.json',
  hsk30Chars:
    'https://raw.githubusercontent.com/elkmovie/hsk30/main/charlist.txt',
  mmahDictionary:
    'https://raw.githubusercontent.com/skishore/makemeahanzi/master/dictionary.txt',
  mmahGraphics:
    'https://raw.githubusercontent.com/skishore/makemeahanzi/master/graphics.txt',
};

const OUTPUT_DB_PATH = path.resolve('assets/data/chinese_corpus.db');

interface CompleteHskForm {
  t?: string;
  i?: { y?: string; n?: string };
  m?: string[];
  c?: string[];
}

interface CompleteHskEntry {
  s: string;
  r?: string;
  l?: string[];
  q?: number;
  p?: string[];
  f?: CompleteHskForm[];
}

interface MmahDictRow {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  etymology?: { type?: string; hint?: string; phonetic?: string; semantic?: string };
  radical?: string;
}

interface MmahGraphicsRow {
  character: string;
  strokes: string[];
  medians: [number, number][][];
}

const POS_LABELS: Record<string, string> = {
  n: 'noun',
  nr: 'name',
  ns: 'place',
  nt: 'org',
  nz: 'proper',
  v: 'verb',
  vn: 'verbal noun',
  vd: 'verb-adv',
  a: 'adj',
  ad: 'adv-adj',
  an: 'adj-noun',
  d: 'adv',
  m: 'num',
  q: 'measure',
  r: 'pron',
  p: 'prep',
  c: 'conj',
  u: 'particle',
  e: 'interj',
  o: 'onomatopoeia',
  i: 'idiom',
  l: 'phrase',
  t: 'time',
  s: 'location',
  f: 'direction',
  b: 'modifier',
  z: 'descriptive',
  y: 'modal',
};

function mapPosTags(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return 'vocab';
  const mapped = tags
    .map((t) => POS_LABELS[t] ?? t)
    .filter((v, idx, arr) => arr.indexOf(v) === idx)
    .slice(0, 2);
  return mapped.join('/');
}

function extractLowestHsk3Level(levels: string[] | undefined): number | null {
  if (!levels) return null;
  let minLevel: number | null = null;
  for (const tag of levels) {
    const match = /^n([1-7])$/.exec(tag);
    if (match) {
      const lvl = Number(match[1]);
      if (minLevel === null || lvl < minLevel) {
        minLevel = lvl;
      }
    }
  }
  return minLevel;
}

function extractTonePattern(numberedPinyin: string): string {
  if (!numberedPinyin.trim()) return '5';
  const tokens = numberedPinyin.trim().split(/\s+/);
  const tones = tokens.map((tok) => {
    const m = /([1-5])/.exec(tok);
    return m ? m[1] : '5';
  });
  return tones.join('-');
}

const VARIANT_REGEX = /^(?:old |archaic |erhua |see |used )?variant of /i;

function scoreForm(f: CompleteHskForm, simplified: string): number {
  let score = 0;
  if (f.t === simplified) score += 20;
  const meanings = f.m ?? [];
  const hasRealMeaning = meanings.some((m) => !VARIANT_REGEX.test(m));
  if (hasRealMeaning) score += 10;
  const num = f.i?.n ?? '';
  const firstMeaning = meanings[0] ?? '';
  if (!/^[A-Z]/.test(num) && !firstMeaning.toLowerCase().startsWith('surname ')) {
    score += 5;
  }
  return score;
}

function selectPrimaryForm(
  forms: CompleteHskForm[] | undefined,
  simplified: string
): CompleteHskForm | null {
  if (!forms || forms.length === 0) return null;
  let best = forms[0];
  let bestScore = scoreForm(best, simplified);
  for (let i = 1; i < forms.length; i++) {
    const sc = scoreForm(forms[i], simplified);
    if (sc > bestScore) {
      best = forms[i];
      bestScore = sc;
    }
  }
  return best;
}

function formatMeaning(meanings: string[] | undefined): string {
  if (!meanings || meanings.length === 0) return '';
  const clean = meanings.filter((m) => !VARIANT_REGEX.test(m));
  const chosen = (clean.length > 0 ? clean : meanings).slice(0, 4);
  return chosen.join('; ');
}

function parseHsk30CharLevels(rawText: string): Map<string, number> {
  const charLevelMap = new Map<string, number>();
  const sectionToLevel: Record<string, number> = {
    一级汉字表: 1,
    二级汉字表: 2,
    三级汉字表: 3,
    四级汉字表: 4,
    五级汉字表: 5,
    六级汉字表: 6,
    七一九级汉字表: 7,
  };

  let currentLevel: number | null = null;
  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    if (line.includes('手写字表')) {
      break;
    }
    if (line in sectionToLevel) {
      currentLevel = sectionToLevel[line];
      continue;
    }
    if (currentLevel !== null) {
      const m = /^\d+\s+([\u4e00-\u9fff])$/.exec(line);
      if (m) {
        const ch = m[1];
        if (!charLevelMap.has(ch)) {
          charLevelMap.set(ch, currentLevel);
        }
      }
    }
  }
  return charLevelMap;
}

async function fetchText(url: string, attempts = 3): Promise<string> {
  let lastError: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed fetching ${url}: ${res.status} ${res.statusText}`);
      }
      return await res.text();
    } catch (err) {
      lastError = err;
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, i * 1000));
      }
    }
  }
  throw lastError;
}

async function main() {
  console.log('Downloading open HSK 3.0 & Make Me a Hanzi datasets...');
  const [hskJsonRaw, charListRaw, mmahDictRaw, mmahGraphicsRaw] = await Promise.all([
    fetchText(SOURCES.hskComplete),
    fetchText(SOURCES.hsk30Chars),
    fetchText(SOURCES.mmahDictionary),
    fetchText(SOURCES.mmahGraphics),
  ]);

  const hskEntries: CompleteHskEntry[] = JSON.parse(hskJsonRaw);
  const hskCharLevels = parseHsk30CharLevels(charListRaw);
  console.log(`Parsed ${hskCharLevels.size} official HSK 3.0 character levels.`);

  const mmahDict = new Map<string, MmahDictRow>();
  for (const line of mmahDictRaw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row: MmahDictRow = JSON.parse(line);
    mmahDict.set(row.character, row);
  }

  const mmahGraphics = new Map<string, MmahGraphicsRow>();
  for (const line of mmahGraphicsRaw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row: MmahGraphicsRow = JSON.parse(line);
    mmahGraphics.set(row.character, row);
  }

  // Fallback pinyin/meaning index from single-char HSK vocabulary entries
  const singleCharVocabFallback = new Map<string, { pinyin: string; meaning: string; hskLevel: number }>();
  const vocabRows: Array<{
    id: string;
    simplified: string;
    traditional: string;
    pinyin: string;
    pinyin_numbered: string;
    tone_pattern: string;
    english: string;
    hsk_level: number;
    part_of_speech: string;
    frequency_rank: number;
    classifiers: string;
  }> = [];

  const seenSimplified = new Set<string>();
  const neededHanziSet = new Set<string>(hskCharLevels.keys());

  for (let i = 0; i < hskEntries.length; i++) {
    const entry = hskEntries[i];
    const hskLevel = extractLowestHsk3Level(entry.l);
    if (hskLevel === null) continue;
    if (seenSimplified.has(entry.s)) continue;
    seenSimplified.add(entry.s);

    const primary = selectPrimaryForm(entry.f, entry.s);
    const pinyin = primary?.i?.y ?? '';
    const pinyinNumbered = primary?.i?.n ?? '';
    const english = formatMeaning(primary?.m) || entry.s;
    const traditional = primary?.t || entry.s;
    const classifiers = Array.from(
      new Set((entry.f ?? []).flatMap((f) => f.c ?? []))
    )
      .slice(0, 3)
      .join(', ');

    vocabRows.push({
      id: `hsk3_${i}`,
      simplified: entry.s,
      traditional,
      pinyin,
      pinyin_numbered: pinyinNumbered,
      tone_pattern: extractTonePattern(pinyinNumbered),
      english,
      hsk_level: hskLevel,
      part_of_speech: mapPosTags(entry.p),
      frequency_rank: entry.q ?? 99999,
      classifiers,
    });

    if ([...entry.s].length === 1 && !singleCharVocabFallback.has(entry.s)) {
      singleCharVocabFallback.set(entry.s, {
        pinyin,
        meaning: english,
        hskLevel,
      });
    }

    for (const ch of entry.s) {
      if (/[\u4e00-\u9fff]/.test(ch)) {
        neededHanziSet.add(ch);
      }
    }
  }

  fs.mkdirSync(path.dirname(OUTPUT_DB_PATH), { recursive: true });
  if (fs.existsSync(OUTPUT_DB_PATH)) {
    fs.unlinkSync(OUTPUT_DB_PATH);
  }

  const db = new DatabaseSync(OUTPUT_DB_PATH);
  db.exec(`
    PRAGMA journal_mode = MEMORY;
    PRAGMA synchronous = OFF;
    CREATE TABLE vocabulary (
      id TEXT PRIMARY KEY NOT NULL,
      simplified TEXT NOT NULL,
      traditional TEXT NOT NULL,
      pinyin TEXT NOT NULL,
      pinyin_numbered TEXT NOT NULL,
      tone_pattern TEXT NOT NULL,
      english TEXT NOT NULL,
      hsk_level INTEGER NOT NULL DEFAULT 1,
      part_of_speech TEXT NOT NULL DEFAULT 'vocab',
      frequency_rank INTEGER NOT NULL DEFAULT 99999,
      classifiers TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE hanzi (
      char TEXT PRIMARY KEY NOT NULL,
      radical TEXT NOT NULL,
      stroke_count INTEGER NOT NULL,
      strokes_svg_json TEXT NOT NULL,
      medians_json TEXT NOT NULL,
      decomposition TEXT NOT NULL,
      etymology_hint TEXT NOT NULL,
      hsk_level INTEGER NOT NULL DEFAULT 0,
      pinyin TEXT NOT NULL DEFAULT '',
      meaning TEXT NOT NULL DEFAULT ''
    );
  `);

  const insertVocab = db.prepare(`
    INSERT OR IGNORE INTO vocabulary (
      id, simplified, traditional, pinyin, pinyin_numbered,
      tone_pattern, english, hsk_level, part_of_speech,
      frequency_rank, classifiers
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN;');
  for (const row of vocabRows) {
    insertVocab.run(
      row.id,
      row.simplified,
      row.traditional,
      row.pinyin,
      row.pinyin_numbered,
      row.tone_pattern,
      row.english,
      row.hsk_level,
      row.part_of_speech,
      row.frequency_rank,
      row.classifiers
    );
  }
  db.exec('COMMIT;');

  const insertHanzi = db.prepare(`
    INSERT OR REPLACE INTO hanzi (
      char, radical, stroke_count, strokes_svg_json,
      medians_json, decomposition, etymology_hint,
      hsk_level, pinyin, meaning
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let hanziInserted = 0;
  db.exec('BEGIN;');
  for (const ch of neededHanziSet) {
    const dict = mmahDict.get(ch);
    const gfx = mmahGraphics.get(ch);
    if (!gfx) continue;

    const normStrokes = gfx.strokes.map(convertMmahSvgPathToNormalized);
    const normMedians = gfx.medians.map((stroke) =>
      convertMmahMedianToPoints(stroke).map((pt) => [pt.x, pt.y])
    );

    const hskLevel =
      hskCharLevels.get(ch) ?? singleCharVocabFallback.get(ch)?.hskLevel ?? 0;
    const fallback = singleCharVocabFallback.get(ch);
    const pinyin = (dict?.pinyin?.[0] || fallback?.pinyin || '').trim();
    const meaning = (dict?.definition || fallback?.meaning || '').trim();
    const radical = dict?.radical || ch;
    const decomposition = dict?.decomposition || '';
    const etymologyHint = dict?.etymology?.hint
      ? `${dict.etymology.type ?? 'note'}: ${dict.etymology.hint}`
      : dict?.etymology?.type
        ? `${dict.etymology.type}`
        : '';

    insertHanzi.run(
      ch,
      radical,
      gfx.strokes.length,
      JSON.stringify(normStrokes),
      JSON.stringify(normMedians),
      decomposition,
      etymologyHint,
      hskLevel,
      pinyin,
      meaning
    );
    hanziInserted++;
  }
  db.exec('COMMIT;');

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_corpus_vocab_simplified ON vocabulary(simplified);
    PRAGMA journal_mode = DELETE;
    VACUUM;
  `);
  db.close();

  const stats = fs.statSync(OUTPUT_DB_PATH);
  const mb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(
    `Built ${OUTPUT_DB_PATH} (${mb} MB): ${vocabRows.length} HSK 3.0 vocabulary entries, ${hanziInserted} Hanzi characters.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
