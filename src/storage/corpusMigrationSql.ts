/**
 * Pure SQL statements executed inside SQLite after attaching the bundled
 * `chinese_corpus.db` read-only seed database as schema `corpus`.
 * Kept free of React Native / Expo runtime imports so Node unit tests verify the exact SQL.
 *
 * Pre-existing user rows are enriched FIRST (when the main tables only contain ~89 vocab
 * and ~20 Hanzi rows), and then the remaining ~11,000 corpus entries are batch-inserted.
 */
export const CORPUS_ATTACH_MERGE_SQL = `
  UPDATE vocabulary
  SET
    frequency_rank = COALESCE(
      (SELECT c.frequency_rank FROM corpus.vocabulary c WHERE c.simplified = vocabulary.simplified),
      frequency_rank
    ),
    classifiers = CASE
      WHEN classifiers = '' THEN COALESCE(
        (SELECT c.classifiers FROM corpus.vocabulary c WHERE c.simplified = vocabulary.simplified),
        ''
      )
      ELSE classifiers
    END
  WHERE frequency_rank = 99999;

  INSERT OR IGNORE INTO vocabulary (
    simplified, traditional, pinyin, pinyin_numbered,
    tone_pattern, english, hsk_level, part_of_speech,
    frequency_rank, classifiers
  )
  SELECT
    simplified, traditional, pinyin, pinyin_numbered,
    tone_pattern, english, hsk_level, part_of_speech,
    frequency_rank, classifiers
  FROM corpus.vocabulary;

  UPDATE hanzi
  SET
    hsk_level = CASE
      WHEN hsk_level = 0 THEN COALESCE(
        (SELECT c.hsk_level FROM corpus.hanzi c WHERE c.char = hanzi.char),
        0
      )
      ELSE hsk_level
    END,
    pinyin = CASE
      WHEN pinyin = '' THEN COALESCE(
        (SELECT c.pinyin FROM corpus.hanzi c WHERE c.char = hanzi.char),
        ''
      )
      ELSE pinyin
    END,
    meaning = CASE
      WHEN meaning = '' THEN COALESCE(
        (SELECT c.meaning FROM corpus.hanzi c WHERE c.char = hanzi.char),
        ''
      )
      ELSE meaning
    END
  WHERE hsk_level = 0 OR pinyin = '' OR meaning = '';

  INSERT OR IGNORE INTO hanzi (
    char, radical, stroke_count, strokes_svg_json,
    medians_json, decomposition, etymology_hint,
    hsk_level, pinyin, meaning
  )
  SELECT
    char, radical, stroke_count, strokes_svg_json,
    medians_json, decomposition, etymology_hint,
    hsk_level, pinyin, meaning
  FROM corpus.hanzi;
`;
