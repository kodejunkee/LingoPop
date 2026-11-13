import { getDatabase } from './database';
import {
  appStorage,
  awardXp,
  getLocalDateKey,
  getStoredNumber,
  getStoredString,
  StorageKeys,
} from './mmkv';
import { enqueueVocabForSRS } from './srs';

export interface LessonProgressRecord {
  lessonId: string;
  completedAt: number | null;
  bestScore: number;
  attempts: number;
}

function getYesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateKey(d);
}

/**
 * Records a completed lesson in SQLite (parameterized query) and updates
 * XP + daily streak in synchronous MMKV storage.
 */
export async function recordLessonCompletion(
  lessonId: string,
  accuracyPercent: number,
  xpEarned: number,
  vocabRewards: string[] = []
): Promise<{ totalXp: number; streakDays: number; enrolledCount: number }> {
  const db = await getDatabase();
  const now = Date.now();

  await db.runAsync(
    `INSERT INTO lesson_progress (lesson_id, completed_at, best_score, attempts)
     VALUES (?, ?, ?, 1)
     ON CONFLICT(lesson_id) DO UPDATE SET
       completed_at = COALESCE(lesson_progress.completed_at, excluded.completed_at),
       best_score = MAX(lesson_progress.best_score, excluded.best_score),
       attempts = lesson_progress.attempts + 1`,
    [lessonId, now, accuracyPercent]
  );

  const enrolledCount = await enqueueVocabForSRS(vocabRewards);

  // Update total XP & today's daily goal XP in MMKV
  const { totalXp } = awardXp(xpEarned);

  // Update daily streak in MMKV
  const today = getLocalDateKey();
  const yesterday = getYesterdayDateKey();
  const lastStudyDate = getStoredString(StorageKeys.LAST_STUDY_DATE, '');
  let streakDays = getStoredNumber(StorageKeys.STREAK_DAYS, 0);

  if (lastStudyDate === today) {
    if (streakDays === 0) {
      streakDays = 1;
      appStorage.set(StorageKeys.STREAK_DAYS, 1);
    }
  } else if (lastStudyDate === yesterday) {
    streakDays += 1;
    appStorage.set(StorageKeys.STREAK_DAYS, streakDays);
    appStorage.set(StorageKeys.LAST_STUDY_DATE, today);
  } else {
    streakDays = 1;
    appStorage.set(StorageKeys.STREAK_DAYS, 1);
    appStorage.set(StorageKeys.LAST_STUDY_DATE, today);
  }

  return { totalXp, streakDays, enrolledCount };
}

export async function getAllLessonProgress(): Promise<Record<string, LessonProgressRecord>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    lesson_id: string;
    completed_at: number | null;
    best_score: number;
    attempts: number;
  }>('SELECT lesson_id, completed_at, best_score, attempts FROM lesson_progress');

  const map: Record<string, LessonProgressRecord> = {};
  for (const row of rows) {
    map[row.lesson_id] = {
      lessonId: row.lesson_id,
      completedAt: row.completed_at,
      bestScore: row.best_score,
      attempts: row.attempts,
    };
  }
  return map;
}

export async function clearAllLessonProgress(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM lesson_progress');
}
