import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'lingopop.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Opens (or returns cached) local SQLite database and ensures core schema
 * tables exist for vocabulary, Hanzi stroke data, FSRS review cards, and lesson progress.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // WAL mode gives better concurrent read/write performance on mobile
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

    CREATE TABLE IF NOT EXISTS lesson_progress (
      lesson_id TEXT PRIMARY KEY NOT NULL,
      completed_at INTEGER,
      best_score REAL NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_srs_due ON srs_cards(due_at);
    CREATE INDEX IF NOT EXISTS idx_vocab_hsk ON vocabulary(hsk_level);
  `);

  dbInstance = db;
  return db;
}
