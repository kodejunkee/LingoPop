import { createMMKV } from 'react-native-mmkv';

/**
 * High-speed synchronous key-value storage instance for app state,
 * user preferences, streak counts, and active session markers.
 */
export const appStorage = createMMKV({
  id: 'lingopop-storage',
});

export const StorageKeys = {
  STREAK_DAYS: 'user.streak_days',
  TOTAL_XP: 'user.total_xp',
  DAILY_GOAL_XP: 'user.daily_goal_xp',
  DAILY_XP_COUNT: 'user.daily_xp_count',
  DAILY_XP_DATE: 'user.daily_xp_date',
  LAST_STUDY_DATE: 'user.last_study_date',
  ACTIVE_COURSE: 'user.active_course',
  SOUND_ENABLED: 'prefs.sound_enabled',
  HAPTICS_ENABLED: 'prefs.haptics_enabled',
  AUDIO_SPEED: 'prefs.audio_speed',
  PINYIN_MODE: 'prefs.pinyin_mode', // 'always' | 'learning' | 'hidden'
  REMINDER_ENABLED: 'prefs.reminder_enabled',
  REMINDER_HOUR: 'prefs.reminder_hour',
  REMINDER_MINUTE: 'prefs.reminder_minute',
} as const;

export function getStoredNumber(key: string, fallback = 0): number {
  return appStorage.getNumber(key) ?? fallback;
}

export function getStoredBoolean(key: string, fallback = true): boolean {
  return appStorage.getBoolean(key) ?? fallback;
}

export function getStoredString(key: string, fallback = ''): string {
  return appStorage.getString(key) ?? fallback;
}

export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayXp(): number {
  const today = getLocalDateKey();
  if (getStoredString(StorageKeys.DAILY_XP_DATE, '') !== today) {
    return 0;
  }
  return getStoredNumber(StorageKeys.DAILY_XP_COUNT, 0);
}

export function awardXp(amount: number): { totalXp: number; todayXp: number } {
  const totalXp = getStoredNumber(StorageKeys.TOTAL_XP, 0) + amount;
  appStorage.set(StorageKeys.TOTAL_XP, totalXp);

  const today = getLocalDateKey();
  const todayXp = getTodayXp() + amount;
  appStorage.set(StorageKeys.DAILY_XP_DATE, today);
  appStorage.set(StorageKeys.DAILY_XP_COUNT, todayXp);

  return { totalXp, todayXp };
}
