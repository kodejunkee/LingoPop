import {
  deleteDatabaseAsync,
  importDatabaseFromAssetAsync,
  openDatabaseAsync,
  type SQLiteDatabase,
} from 'expo-sqlite';
import { Platform } from 'react-native';

import { CHINESE_CORPUS_ASSET } from './corpusAsset';
import { CORPUS_ATTACH_MERGE_SQL } from './corpusMigrationSql';

const SEED_DB_NAME = 'chinese_corpus_seed.db';

/**
 * Ensures newer corpus columns exist cleanly for devices upgrading from SCHEMA_VERSION <= 3.
 */
export async function ensureCorpusSchemaColumns(db: SQLiteDatabase): Promise<void> {
  const vocabCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(vocabulary);');
  const vocabColSet = new Set(vocabCols.map((c) => c.name));

  if (!vocabColSet.has('frequency_rank')) {
    await db.execAsync(
      'ALTER TABLE vocabulary ADD COLUMN frequency_rank INTEGER NOT NULL DEFAULT 99999;'
    );
  }
  if (!vocabColSet.has('classifiers')) {
    await db.execAsync("ALTER TABLE vocabulary ADD COLUMN classifiers TEXT NOT NULL DEFAULT '';");
  }

  const hanziCols = await db.getAllAsync<{ name: string }>('PRAGMA table_info(hanzi);');
  const hanziColSet = new Set(hanziCols.map((c) => c.name));

  if (!hanziColSet.has('hsk_level')) {
    await db.execAsync('ALTER TABLE hanzi ADD COLUMN hsk_level INTEGER NOT NULL DEFAULT 0;');
  }
  if (!hanziColSet.has('pinyin')) {
    await db.execAsync("ALTER TABLE hanzi ADD COLUMN pinyin TEXT NOT NULL DEFAULT '';");
  }
  if (!hanziColSet.has('meaning')) {
    await db.execAsync("ALTER TABLE hanzi ADD COLUMN meaning TEXT NOT NULL DEFAULT '';");
  }

  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_vocab_freq ON vocabulary(frequency_rank);
    CREATE INDEX IF NOT EXISTS idx_hanzi_hsk ON hanzi(hsk_level);
  `);
}

/**
 * Imports the bundled HSK 3.0 (10,969 words) and Make Me a Hanzi (3,000 characters) SQLite
 * corpus into the active user database using native ATTACH DATABASE in C without loading
 * multi-megabyte JSON payloads into JavaScript memory.
 */
export async function importChineseCorpusIfAvailable(mainDb: SQLiteDatabase): Promise<boolean> {
  if (Platform.OS === 'web' || CHINESE_CORPUS_ASSET == null) {
    return false;
  }

  await importDatabaseFromAssetAsync(SEED_DB_NAME, {
    assetId: CHINESE_CORPUS_ASSET,
    forceOverwrite: true,
  });

  const seedDb = await openDatabaseAsync(SEED_DB_NAME, { useNewConnection: true });
  const seedPath = seedDb.databasePath;
  await seedDb.closeAsync();

  let attached = false;
  let inTx = false;

  try {
    await mainDb.runAsync('ATTACH DATABASE ? AS corpus;', [seedPath]);
    attached = true;

    await mainDb.execAsync('BEGIN;');
    inTx = true;

    await mainDb.execAsync(CORPUS_ATTACH_MERGE_SQL);

    await mainDb.execAsync('COMMIT;');
    inTx = false;
    return true;
  } catch (err) {
    if (inTx) {
      try {
        await mainDb.execAsync('ROLLBACK;');
      } catch {
        // Ignore rollback failure when handling outer error
      }
    }
    throw err;
  } finally {
    if (attached) {
      try {
        await mainDb.execAsync('DETACH DATABASE corpus;');
      } catch {
        // Ignore detach cleanup error
      }
    }
    try {
      await deleteDatabaseAsync(SEED_DB_NAME);
    } catch {
      // Non-fatal if OS cleanup already removed temp seed db
    }
  }
}
