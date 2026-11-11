import {
  AndroidImportance,
  cancelAllScheduledNotificationsAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  SchedulableTriggerInputTypes,
  scheduleNotificationAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from 'expo-notifications';
import { Platform } from 'react-native';

import { appStorage, StorageKeys } from '../storage/mmkv';

const CHANNEL_ID = 'daily-study-reminders';

let handlerConfigured = false;

export function ensureNotificationHandler(): void {
  if (handlerConfigured || Platform.OS === 'web') return;
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  handlerConfigured = true;
}

/**
 * Schedules a local daily reminder at the specified hour & minute.
 * Returns true if permission was granted and reminder scheduled.
 */
export async function enableDailyReminder(
  hour: number,
  minute: number
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return false;
  }

  ensureNotificationHandler();

  if (Platform.OS === 'android') {
    await setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily Study Reminders',
      importance: AndroidImportance.DEFAULT,
    });
  }

  const existing = await getPermissionsAsync();
  let granted = existing.status === 'granted';
  if (!granted) {
    const requested = await requestPermissionsAsync();
    granted = requested.status === 'granted';
  }

  if (!granted) {
    appStorage.set(StorageKeys.REMINDER_ENABLED, false);
    return false;
  }

  await cancelAllScheduledNotificationsAsync();

  await scheduleNotificationAsync({
    content: {
      title: 'Time for 5 minutes of Mandarin!',
      body: 'Keep your streak alive — review your FSRS cards or unlock your next lesson.',
      sound: 'default',
    },
    trigger: {
      type: SchedulableTriggerInputTypes.DAILY,
      channelId: Platform.OS === 'android' ? CHANNEL_ID : undefined,
      hour,
      minute,
    },
  });

  appStorage.set(StorageKeys.REMINDER_ENABLED, true);
  appStorage.set(StorageKeys.REMINDER_HOUR, hour);
  appStorage.set(StorageKeys.REMINDER_MINUTE, minute);
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  appStorage.set(StorageKeys.REMINDER_ENABLED, false);
  if (Platform.OS === 'web') return;
  try {
    await cancelAllScheduledNotificationsAsync();
  } catch {
    // Safe fallback if notification scheduler unavailable
  }
}
