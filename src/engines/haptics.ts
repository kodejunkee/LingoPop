import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { getStoredBoolean, StorageKeys } from '../storage/mmkv';

function isHapticsEnabled(): boolean {
  return getStoredBoolean(StorageKeys.HAPTICS_ENABLED, true);
}

export async function triggerTapHaptic(): Promise<void> {
  if (!isHapticsEnabled() || Platform.OS === 'web') return;
  try {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Keyboard_Tap);
    } else {
      await Haptics.selectionAsync();
    }
  } catch {
    // Haptics may be unavailable on simulators or certain hardware
  }
}

export async function triggerSuccessHaptic(): Promise<void> {
  if (!isHapticsEnabled() || Platform.OS === 'web') return;
  try {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  } catch {
    // Ignore hardware haptics failures
  }
}

export async function triggerErrorHaptic(): Promise<void> {
  if (!isHapticsEnabled() || Platform.OS === 'web') return;
  try {
    if (Platform.OS === 'android') {
      await Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  } catch {
    // Ignore hardware haptics failures
  }
}
