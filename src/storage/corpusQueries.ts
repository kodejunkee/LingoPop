import { DOJO_CHARACTERS, getHanziDef, type HanziCharacterDef } from '../curriculum/hanziData';
import { buildHanziStrokesFromMmah } from '../engines/hanziStroke';
import { getToneFromPinyin } from '../engines/pinyin';
import type { ToneNumber } from '../theme/tokens';
import { getDatabase } from './database';
import type { DictionaryRow } from './srs';

export interface HSKLevelMastery {
  level: number;
  label: string;
  totalVocab: number;
  learnedVocab: number;
  totalHanzi: number;
}

export interface HSKCorpusSummary {
  levels: HSKLevelMastery[];
  totalVocab: number;
  learnedVocab: number;
  totalHanzi: number;
}

export interface HanziCatalogItem {
  char: string;
  pinyin: string;
  tone: ToneNumber;
  meaning: string;
  radical: string;
  strokeCount: number;
  hskLevel: number;
}

interface RawHanziDbRow {
  char: string;
  radical: string;
  stroke_count: number;
  strokes_svg_json: string;
  medians_json: string;
  decomposition: string;
  etymology_hint: string;
  hsk_level: number;
  pinyin: string;
  meaning: string;
}

interface RawVocabRow {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  pinyin_numbered: string;
  tone_pattern: string;
  english: string;
  hsk_level: number;
  part_of_speech: string | null;
  is_enrolled: number;
}

export function formatHskBandLabel(level: number): string {
  return level >= 7 ? 'HSK 7–9' : `HSK ${level}`;
}

/**
 * Returns per-HSK-3.0-band vocabulary & Hanzi totals alongside the learner's enrolled SRS count.
 */
export async function getHSKMasteryStats(): Promise<HSKCorpusSummary> {
  const db = await getDatabase();

  const vocabCounts = await db.getAllAsync<{
    hsk_level: number;
    total_count: number;
    learned_count: number;
  }>(`
    SELECT
      v.hsk_level AS hsk_level,
      COUNT(*) AS total_count,
      SUM(CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END) AS learned_count
    FROM vocabulary v
    LEFT JOIN srs_cards s ON s.item_type = 'vocab' AND s.item_id = v.simplified
    GROUP BY v.hsk_level
    ORDER BY v.hsk_level ASC;
  `);

  const hanziCounts = await db.getAllAsync<{
    hsk_level: number;
    total_count: number;
  }>(`
    SELECT hsk_level, COUNT(*) AS total_count
    FROM hanzi
    WHERE hsk_level > 0
    GROUP BY hsk_level;
  `);

  const hanziByLevel = new Map<number, number>(
    hanziCounts.map((row) => [row.hsk_level, row.total_count])
  );
  const vocabByLevel = new Map(vocabCounts.map((row) => [row.hsk_level, row]));

  const bands = [1, 2, 3, 4, 5, 6, 7];
  const levels: HSKLevelMastery[] = bands.map((lvl) => {
    const v = vocabByLevel.get(lvl);
    return {
      level: lvl,
      label: formatHskBandLabel(lvl),
      totalVocab: v?.total_count ?? 0,
      learnedVocab: v?.learned_count ?? 0,
      totalHanzi: hanziByLevel.get(lvl) ?? 0,
    };
  });

  const totalVocab = vocabCounts.reduce((acc, r) => acc + r.total_count, 0);
  const learnedVocab = vocabCounts.reduce((acc, r) => acc + (r.learned_count ?? 0), 0);
  const totalHanziRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM hanzi;'
  );

  return {
    levels,
    totalVocab,
    learnedVocab,
    totalHanzi: totalHanziRow?.count ?? 0,
  };
}

/**
 * Looks up a specific Chinese word in SQLite for tap-to-lookup graded reading popups.
 */
export async function lookupWordByHanzi(hanziText: string): Promise<DictionaryRow | null> {
  const clean = hanziText.trim();
  if (!clean) return null;

  const db = await getDatabase();
  const row = await db.getFirstAsync<RawVocabRow>(
    `SELECT v.*, CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END AS is_enrolled
     FROM vocabulary v
     LEFT JOIN srs_cards s ON s.item_type = 'vocab' AND s.item_id = v.simplified
     WHERE v.simplified = ? OR v.traditional = ?
     ORDER BY CASE WHEN v.simplified = ? THEN 0 ELSE 1 END, v.hsk_level ASC
     LIMIT 1;`,
    [clean, clean, clean]
  );

  if (!row) return null;

  return {
    id: row.id,
    simplified: row.simplified,
    traditional: row.traditional,
    pinyin: row.pinyin,
    pinyinNumbered: row.pinyin_numbered,
    tonePattern: row.tone_pattern,
    english: row.english,
    hskLevel: row.hsk_level,
    partOfSpeech: row.part_of_speech,
    isEnrolled: row.is_enrolled === 1,
  };
}

/**
 * Queries SQLite's Make Me a Hanzi catalog for Hanzi Dojo character picking (filtered & paginated).
 */
export async function searchHanziCatalog(
  rawQuery = '',
  hskFilter: number | null = null,
  limit = 60
): Promise<HanziCatalogItem[]> {
  const db = await getDatabase();
  const query = rawQuery.trim();
  const safeLimit = Math.max(1, Math.min(120, Math.floor(limit)));

  const clauses: string[] = [];
  const params: (string | number)[] = [];

  if (hskFilter !== null) {
    clauses.push('hsk_level = ?');
    params.push(hskFilter);
  }
  if (query) {
    const pattern = `%${query}%`;
    clauses.push('(char = ? OR pinyin LIKE ? OR meaning LIKE ? OR radical = ?)');
    params.push(query, pattern, pattern, query);
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const sql = `
    SELECT char, pinyin, meaning, radical, stroke_count, hsk_level
    FROM hanzi
    ${where}
    ORDER BY
      CASE WHEN hsk_level > 0 THEN hsk_level ELSE 99 END ASC,
      stroke_count ASC
    LIMIT ?;
  `;
  params.push(safeLimit);

  const rows = await db.getAllAsync<{
    char: string;
    pinyin: string;
    meaning: string;
    radical: string;
    stroke_count: number;
    hsk_level: number;
  }>(sql, params);

  if (rows.length > 0) {
    return rows.map((r) => {
      const curated = getHanziDef(r.char);
      const pinyin = r.pinyin || curated?.pinyin || '';
      return {
        char: r.char,
        pinyin,
        tone: curated?.tone ?? getToneFromPinyin(pinyin),
        meaning: r.meaning || curated?.meaning || '',
        radical: r.radical || curated?.radical || r.char,
        strokeCount: r.stroke_count,
        hskLevel: r.hsk_level,
      };
    });
  }

  // Fallback for offline Web preview before native corpus DB attaches
  return DOJO_CHARACTERS.filter((d) => {
    if (hskFilter !== null && (d.hskLevel ?? 1) !== hskFilter) return false;
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      d.char === query ||
      d.pinyin.toLowerCase().includes(q) ||
      d.meaning.toLowerCase().includes(q)
    );
  })
    .slice(0, safeLimit)
    .map((d) => ({
      char: d.char,
      pinyin: d.pinyin,
      tone: d.tone,
      meaning: d.meaning,
      radical: d.radical,
      strokeCount: d.strokes.length,
      hskLevel: d.hskLevel ?? 1,
    }));
}

/**
 * Loads full interactive `HanziCharacterDef` (stroke outlines, validation polylines, radical &
 * etymology) for any character in the 3,000+ Hanzi corpus, preferring rich Stage 1 curated data.
 */
export async function getHanziByChar(char: string): Promise<HanziCharacterDef | null> {
  const curated = getHanziDef(char);
  if (curated) {
    return curated;
  }

  const db = await getDatabase();
  const row = await db.getFirstAsync<RawHanziDbRow>(
    `SELECT char, radical, stroke_count, strokes_svg_json, medians_json,
            decomposition, etymology_hint, hsk_level, pinyin, meaning
     FROM hanzi
     WHERE char = ?
     LIMIT 1;`,
    [char]
  );

  if (!row) return null;

  let normalizedMedians: [number, number][][] = [];
  let normalizedSvgs: string[] = [];

  try {
    normalizedMedians = JSON.parse(row.medians_json) as [number, number][][];
  } catch {
    normalizedMedians = [];
  }
  try {
    normalizedSvgs = JSON.parse(row.strokes_svg_json) as string[];
  } catch {
    normalizedSvgs = [];
  }

  const strokes = buildHanziStrokesFromMmah(normalizedMedians, normalizedSvgs);
  if (strokes.length === 0) return null;

  const tone = getToneFromPinyin(row.pinyin);

  return {
    char: row.char,
    pinyin: row.pinyin || '—',
    tone,
    meaning: row.meaning || 'HSK 3.0 Character',
    radical: row.radical || row.char,
    radicalMeaning: row.hsk_level > 0 ? formatHskBandLabel(row.hsk_level) : 'Core Radical',
    componentsSummary: row.decomposition
      ? `IDS Decomposition: ${row.decomposition} · ${row.stroke_count} strokes`
      : `${row.stroke_count} strokes`,
    etymologyStory:
      row.etymology_hint ||
      `Included in Official HSK 3.0 (${formatHskBandLabel(row.hsk_level || 1)}). Trace each median stroke smoothly in numbered order.`,
    hskLevel: row.hsk_level,
    strokes,
  };
}
