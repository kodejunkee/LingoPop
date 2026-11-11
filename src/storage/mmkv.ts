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
  LAST_STUDY_DATE: 'user.last_study_date',
  ACTIVE_COURSE: 'user.active_course',
  SOUND_ENABLED: 'prefs.sound_enabled',
  HAPTICS_ENABLED: 'prefs.haptics_enabled',
  PINYIN_MODE: 'prefs.pinyin_mode', // 'always' | 'learning' | 'hidden'
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
