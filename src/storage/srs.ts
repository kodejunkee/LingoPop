import { Platform } from 'react-native';

import {
  createNewFSRSCard,
  scheduleFSRSCard,
  type CardState,
  type FSRSCard,
  type FSRSRating,
} from '../engines/fsrs';
import { getDatabase } from './database';
import { awardXp } from './mmkv';

export interface ReviewCardWithVocab {
  card: FSRSCard;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  pinyinNumbered: string;
  tonePattern: string;
  english: string;
  hskLevel: number;
  partOfSpeech: string | null;
}

export interface DictionaryRow {
  id: number;
  simplified: string;
  traditional: string | null;
  pinyin: string;
  pinyinNumbered: string;
  tonePattern: string;
  english: string;
  hskLevel: number;
  partOfSpeech: string | null;
  isEnrolled: boolean;
}

export interface SRSStats {
  totalCards: number;
  dueNow: number;
  mastered: number;
}

/**
 * Enrolls vocabulary words into the FSRS review deck if not already tracked.
 */
export async function enqueueVocabForSRS(words: string[]): Promise<number> {
  if (words.length === 0) return 0;
  const db = await getDatabase();
  const now = Date.now();
  let inserted = 0;

  await db.withTransactionAsync(async () => {
    for (const word of words) {
      const card = createNewFSRSCard('vocab', word, now);
      const res = await db.runAsync(
        `INSERT OR IGNORE INTO srs_cards
          (item_type, item_id, state, difficulty, stability, elapsed_days, scheduled_days, reps, lapses, due_at, last_review_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          card.itemType,
          card.itemId,
          card.state,
          card.difficulty,
          card.stability,
          card.elapsedDays,
          card.scheduledDays,
          card.reps,
          card.lapses,
          card.dueAt,
          card.lastReviewAt,
        ]
      );
      inserted += res.changes;
    }
  });

  return inserted;
}

export async function getSRSStats(): Promise<SRSStats> {
  const db = await getDatabase();
  const now = Date.now();

  const row = await db.getFirstAsync<{
    total_cards: number;
    due_now: number | null;
    mastered: number | null;
  }>(
    `SELECT
       COUNT(*) AS total_cards,
       SUM(CASE WHEN due_at <= ? THEN 1 ELSE 0 END) AS due_now,
       SUM(CASE WHEN stability >= 14 THEN 1 ELSE 0 END) AS mastered
     FROM srs_cards`,
    [now]
  );

  return {
    totalCards: row?.total_cards ?? 0,
    dueNow: row?.due_now ?? 0,
    mastered: row?.mastered ?? 0,
  };
}

export async function getDueReviewCards(limit = 20): Promise<ReviewCardWithVocab[]> {
  const db = await getDatabase();
  const now = Date.now();

  const rows = await db.getAllAsync<{
    id: number;
    item_type: 'vocab' | 'hanzi';
    item_id: string;
    state: number;
    difficulty: number;
    stability: number;
    elapsed_days: number;
    scheduled_days: number;
    reps: number;
    lapses: number;
    due_at: number;
    last_review_at: number | null;
    simplified: string;
    traditional: string | null;
    pinyin: string;
    pinyin_numbered: string;
    tone_pattern: string;
    english: string;
    hsk_level: number;
    part_of_speech: string | null;
  }>(
    `SELECT
       s.id, s.item_type, s.item_id, s.state, s.difficulty, s.stability,
       s.elapsed_days, s.scheduled_days, s.reps, s.lapses, s.due_at, s.last_review_at,
       v.simplified, v.traditional, v.pinyin, v.pinyin_numbered, v.tone_pattern,
       v.english, v.hsk_level, v.part_of_speech
     FROM srs_cards s
     INNER JOIN vocabulary v ON v.simplified = s.item_id
     WHERE s.item_type = 'vocab' AND s.due_at <= ?
     ORDER BY s.due_at ASC
     LIMIT ?`,
    [now, limit]
  );

  return rows.map((r) => ({
    card: {
      id: r.id,
      itemType: r.item_type,
      itemId: r.item_id,
      state: r.state as CardState,
      difficulty: r.difficulty,
      stability: r.stability,
      elapsedDays: r.elapsed_days,
      scheduledDays: r.scheduled_days,
      reps: r.reps,
      lapses: r.lapses,
      dueAt: r.due_at,
      lastReviewAt: r.last_review_at,
    },
    simplified: r.simplified,
    traditional: r.traditional,
    pinyin: r.pinyin,
    pinyinNumbered: r.pinyin_numbered,
    tonePattern: r.tone_pattern,
    english: r.english,
    hskLevel: r.hsk_level,
    partOfSpeech: r.part_of_speech,
  }));
}

/**
 * Applies FSRS scheduling for a rating and persists updated memory state + XP reward.
 */
export async function submitSRSReview(
  card: FSRSCard,
  rating: FSRSRating
): Promise<{ updatedCard: FSRSCard; intervalLabel: string }> {
  const db = await getDatabase();
  const { card: next, intervalLabel } = scheduleFSRSCard(card, rating);

  await db.runAsync(
    `UPDATE srs_cards
     SET state = ?, difficulty = ?, stability = ?, elapsed_days = ?,
         scheduled_days = ?, reps = ?, lapses = ?, due_at = ?, last_review_at = ?
     WHERE item_type = ? AND item_id = ?`,
    [
      next.state,
      next.difficulty,
      next.stability,
      next.elapsedDays,
      next.scheduledDays,
      next.reps,
      next.lapses,
      next.dueAt,
      next.lastReviewAt,
      next.itemType,
      next.itemId,
    ]
  );

  awardXp(5);

  return { updatedCard: next, intervalLabel };
}

/**
 * Searches offline vocabulary using parameterized SQLite FTS5 on native
 * and parameterized LIKE fallback on web.
 */
export async function searchDictionary(
  rawQuery: string,
  hskFilter: number | null = null,
  limit = 80,
  offset = 0
): Promise<DictionaryRow[]> {
  const db = await getDatabase();
  const query = rawQuery.trim();
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));

  if (!query) {
    const sql = hskFilter
      ? `SELECT v.*, CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END AS is_enrolled
         FROM vocabulary v
         LEFT JOIN srs_cards s ON s.item_type = 'vocab' AND s.item_id = v.simplified
         WHERE v.hsk_level = ?
         ORDER BY v.frequency_rank ASC, v.id ASC
         LIMIT ? OFFSET ?`
      : `SELECT v.*, CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END AS is_enrolled
         FROM vocabulary v
         LEFT JOIN srs_cards s ON s.item_type = 'vocab' AND s.item_id = v.simplified
         ORDER BY v.hsk_level ASC, v.frequency_rank ASC, v.id ASC
         LIMIT ? OFFSET ?`;
    const rows = hskFilter
      ? await db.getAllAsync<DictionaryQueryRow>(sql, [hskFilter, safeLimit, safeOffset])
      : await db.getAllAsync<DictionaryQueryRow>(sql, [safeLimit, safeOffset]);
    return rows.map(mapDictRow);
  }

  // Try FTS5 prefix search on native when query uses ASCII/word tokens
  if (Platform.OS !== 'web') {
    const sanitizedTokens = query
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((tok) => `"${tok}"*`)
      .join(' ');

    if (sanitizedTokens) {
      try {
        const ftsSql = hskFilter
          ? `SELECT v.*, CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END AS is_enrolled
             FROM vocabulary_fts f
             INNER JOIN vocabulary v ON v.rowid = f.rowid
             LEFT JOIN srs_cards s ON s.item_type = 'vocab' AND s.item_id = v.simplified
             WHERE vocabulary_fts MATCH ? AND v.hsk_level = ?
             ORDER BY v.hsk_level ASC, v.frequency_rank ASC
             LIMIT ? OFFSET ?`
          : `SELECT v.*, CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END AS is_enrolled
             FROM vocabulary_fts f
             INNER JOIN vocabulary v ON v.rowid = f.rowid
             LEFT JOIN srs_cards s ON s.item_type = 'vocab' AND s.item_id = v.simplified
             WHERE vocabulary_fts MATCH ?
             ORDER BY v.hsk_level ASC, v.frequency_rank ASC
             LIMIT ? OFFSET ?`;
        const rows = hskFilter
          ? await db.getAllAsync<DictionaryQueryRow>(ftsSql, [
              sanitizedTokens,
              hskFilter,
              safeLimit,
              safeOffset,
            ])
          : await db.getAllAsync<DictionaryQueryRow>(ftsSql, [
              sanitizedTokens,
              safeLimit,
              safeOffset,
            ]);
        if (rows.length > 0 || safeOffset > 0) {
          return rows.map(mapDictRow);
        }
      } catch {
        // Fall through to LIKE query cleanly
      }
    }
  }

  const pattern = `%${query}%`;
  const likeSql = hskFilter
    ? `SELECT v.*, CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END AS is_enrolled
       FROM vocabulary v
       LEFT JOIN srs_cards s ON s.item_type = 'vocab' AND s.item_id = v.simplified
       WHERE v.hsk_level = ?
         AND (v.simplified LIKE ? OR v.pinyin LIKE ? OR v.pinyin_numbered LIKE ? OR v.english LIKE ?)
       ORDER BY v.frequency_rank ASC, v.id ASC
       LIMIT ? OFFSET ?`
    : `SELECT v.*, CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END AS is_enrolled
       FROM vocabulary v
       LEFT JOIN srs_cards s ON s.item_type = 'vocab' AND s.item_id = v.simplified
       WHERE v.simplified LIKE ? OR v.pinyin LIKE ? OR v.pinyin_numbered LIKE ? OR v.english LIKE ?
       ORDER BY CASE WHEN v.simplified = ? THEN 0 ELSE 1 END, v.hsk_level ASC, v.frequency_rank ASC
       LIMIT ? OFFSET ?`;

  const rows = hskFilter
    ? await db.getAllAsync<DictionaryQueryRow>(likeSql, [
        hskFilter,
        pattern,
        pattern,
        pattern,
        pattern,
        safeLimit,
        safeOffset,
      ])
    : await db.getAllAsync<DictionaryQueryRow>(likeSql, [
        pattern,
        pattern,
        pattern,
        pattern,
        query,
        safeLimit,
        safeOffset,
      ]);

  return rows.map(mapDictRow);
}

interface DictionaryQueryRow {
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

function mapDictRow(r: DictionaryQueryRow): DictionaryRow {
  return {
    id: r.id,
    simplified: r.simplified,
    traditional: r.traditional,
    pinyin: r.pinyin,
    pinyinNumbered: r.pinyin_numbered,
    tonePattern: r.tone_pattern,
    english: r.english,
    hskLevel: r.hsk_level,
    partOfSpeech: r.part_of_speech,
    isEnrolled: r.is_enrolled === 1,
  };
}
