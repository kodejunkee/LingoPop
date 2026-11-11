import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

import { DOJO_CHARACTERS } from '../curriculum/hanziData';
import { HSK1_VOCAB } from '../curriculum/hsk1Vocab';
import { HSK2_3_VOCAB } from '../curriculum/hsk2Vocab';

const DB_NAME = 'lingopop.db';
const SCHEMA_VERSION = 3;

let dbInitPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Opens (or returns cached) local SQLite database, runs versioned schema
 * migrations, and idempotently seeds offline Hanzi + HSK 1 vocabulary.
 */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbInitPromise) {
    dbInitPromise = initializeDatabase().catch((err) => {
      dbInitPromise = null;
      throw err;
    });
  }
  return dbInitPromise;
}

async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  if (Platform.OS !== 'web') {
    await db.execAsync('PRAGMA journal_mode = WAL;');
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      simplified TEXT NOT NULL,
      traditional TEXT,
      pinyin TEXT NOT NULL,
      pinyin_numbered TEXT NOT NULL,
      tone_pattern TEXT NOT NULL,
      english TEXT NOT NULL,
      hsk_level INTEGER NOT NULL DEFAULT 1,
      part_of_speech TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_vocab_simplified ON vocabulary(simplified);
    CREATE INDEX IF NOT EXISTS idx_vocab_hsk ON vocabulary(hsk_level);

    CREATE TABLE IF NOT EXISTS hanzi (
      char TEXT PRIMARY KEY NOT NULL,
      radical TEXT,
      stroke_count INTEGER NOT NULL DEFAULT 0,
      strokes_svg_json TEXT,
      medians_json TEXT,
      decomposition TEXT,
      etymology_hint TEXT
    );

    CREATE TABLE IF NOT EXISTS srs_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL,
      item_id TEXT NOT NULL,
      state INTEGER NOT NULL DEFAULT 0,
      difficulty REAL NOT NULL DEFAULT 0,
      stability REAL NOT NULL DEFAULT 0,
      elapsed_days INTEGER NOT NULL DEFAULT 0,
      scheduled_days INTEGER NOT NULL DEFAULT 0,
      reps INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      due_at INTEGER NOT NULL,
      last_review_at INTEGER,
      UNIQUE(item_type, item_id)
    );

    CREATE INDEX IF NOT EXISTS idx_srs_due ON srs_cards(due_at);

    CREATE TABLE IF NOT EXISTS lesson_progress (
      lesson_id TEXT PRIMARY KEY NOT NULL,
      completed_at INTEGER,
      best_score REAL NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0
    );
  `);

  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion < SCHEMA_VERSION) {
    await runMigrations(db, currentVersion);
  }

  return db;
}

async function runMigrations(
  db: SQLite.SQLiteDatabase,
  fromVersion: number
): Promise<void> {
  if (fromVersion < 1) {
    if (Platform.OS !== 'web') {
      try {
        await db.execAsync(`
          CREATE VIRTUAL TABLE IF NOT EXISTS vocabulary_fts USING fts5(
            simplified,
            pinyin,
            pinyin_numbered,
            english,
            content='vocabulary',
            content_rowid='id'
          );
        `);
      } catch {
        // Fallback safely if FTS5 is unavailable on a given runtime
      }
    }
  }

  if (fromVersion < 3) {
    await seedHanziCharacters(db);
    await seedVocabulary(db);

    if (Platform.OS !== 'web') {
      try {
        await db.execAsync(`INSERT INTO vocabulary_fts(vocabulary_fts) VALUES('rebuild');`);
      } catch {
        // Fallback safely if FTS5 unavailable
      }
    }
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);
}

async function seedHanziCharacters(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const item of DOJO_CHARACTERS) {
      await db.runAsync(
        `INSERT OR IGNORE INTO hanzi
          (char, radical, stroke_count, strokes_svg_json, medians_json, decomposition, etymology_hint)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.char,
          item.radical,
          item.strokes.length,
          null,
          JSON.stringify(item.strokes),
          item.componentsSummary,
          item.etymologyStory,
        ]
      );
    }
  });
}

async function seedVocabulary(db: SQLite.SQLiteDatabase): Promise<void> {
  const allEntries = [...HSK1_VOCAB, ...HSK2_3_VOCAB];
  await db.withTransactionAsync(async () => {
    for (const entry of allEntries) {
      await db.runAsync(
        `INSERT OR IGNORE INTO vocabulary
          (simplified, traditional, pinyin, pinyin_numbered, tone_pattern, english, hsk_level, part_of_speech)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entry.simplified,
          entry.traditional,
          entry.pinyin,
          entry.pinyinNumbered,
          entry.tonePattern,
          entry.english,
          entry.hskLevel,
          entry.partOfSpeech,
        ]
      );
    }
  });
}
