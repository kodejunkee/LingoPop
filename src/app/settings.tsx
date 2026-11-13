import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { triggerSuccessHaptic, triggerTapHaptic } from '@/engines/haptics';
import { disableDailyReminder, enableDailyReminder } from '@/engines/notifications';
import {
  appStorage,
  getStoredBoolean,
  getStoredNumber,
  StorageKeys,
} from '@/storage/mmkv';
import { getAllLessonProgress } from '@/storage/progress';
import { getSRSStats } from '@/storage/srs';
import { Colors, Radii, Spacing } from '@/theme/tokens';

const GOAL_OPTIONS = [30, 50, 100];

const REMINDER_TIMES = [
  { label: '08:30 AM', hour: 8, minute: 30 },
  { label: '12:30 PM', hour: 12, minute: 30 },
  { label: '07:30 PM', hour: 19, minute: 30 },
  { label: '09:00 PM', hour: 21, minute: 0 },
];

export default function SettingsScreen() {
  const [soundEnabled, setSoundEnabled] = useState(() =>
    getStoredBoolean(StorageKeys.SOUND_ENABLED, true)
  );
  const [hapticsEnabled, setHapticsEnabled] = useState(() =>
    getStoredBoolean(StorageKeys.HAPTICS_ENABLED, true)
  );
  const [dailyGoal, setDailyGoal] = useState(() =>
    getStoredNumber(StorageKeys.DAILY_GOAL_XP, 50)
  );
  const [reminderEnabled, setReminderEnabled] = useState(() =>
    getStoredBoolean(StorageKeys.REMINDER_ENABLED, false)
  );
  const [reminderHour, setReminderHour] = useState(() =>
    getStoredNumber(StorageKeys.REMINDER_HOUR, 19)
  );
  const [reminderMinute, setReminderMinute] = useState(() =>
    getStoredNumber(StorageKeys.REMINDER_MINUTE, 30)
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleToggleSound = (val: boolean) => {
    appStorage.set(StorageKeys.SOUND_ENABLED, val);
    setSoundEnabled(val);
    triggerTapHaptic();
  };

  const handleToggleHaptics = (val: boolean) => {
    appStorage.set(StorageKeys.HAPTICS_ENABLED, val);
    setHapticsEnabled(val);
    if (val) triggerTapHaptic();
  };

  const handleToggleReminder = async (val: boolean) => {
    triggerTapHaptic();
    if (Platform.OS === 'web') {
      setStatusMessage('Daily reminders are available on iOS and Android devices.');
      return;
    }

    if (val) {
      const ok = await enableDailyReminder(reminderHour, reminderMinute);
      setReminderEnabled(ok);
      setStatusMessage(
        ok
          ? 'Daily reminder scheduled!'
          : 'Notification permission was denied in system settings.'
      );
    } else {
      await disableDailyReminder();
      setReminderEnabled(false);
      setStatusMessage('Daily reminder turned off.');
    }
  };

  const handleSelectTime = async (hour: number, minute: number) => {
    triggerTapHaptic();
    setReminderHour(hour);
    setReminderMinute(minute);
    appStorage.set(StorageKeys.REMINDER_HOUR, hour);
    appStorage.set(StorageKeys.REMINDER_MINUTE, minute);

    if (reminderEnabled && Platform.OS !== 'web') {
      await enableDailyReminder(hour, minute);
      setStatusMessage('Reminder time updated!');
    }
  };

  const handleExportProgress = async () => {
    triggerSuccessHaptic();
    const [lessons, srs] = await Promise.all([getAllLessonProgress(), getSRSStats()]);
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Mimiko',
      totalXp: getStoredNumber(StorageKeys.TOTAL_XP, 0),
      streakDays: getStoredNumber(StorageKeys.STREAK_DAYS, 0),
      srsStats: srs,
      lessonProgress: lessons,
    };
    await Clipboard.setStringAsync(JSON.stringify(payload, null, 2));
    setStatusMessage('Progress backup JSON copied to clipboard!');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.pageTitle}>Settings &amp; Backup</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {statusMessage ? (
          <View style={styles.statusBanner}>
            <Ionicons name="information-circle" size={18} color={Colors.info} />
            <Text style={styles.statusText}>{statusMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Learning Experience</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Mandarin Audio &amp; TTS</Text>
              <Text style={styles.settingSub}>
                Turn off for silent / headphone-free study
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={handleToggleSound}
              trackColor={{ true: Colors.primary, false: '#CBD5E1' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Tactile Haptics</Text>
              <Text style={styles.settingSub}>
                Vibration feedback on stroke tracing &amp; answers
              </Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={handleToggleHaptics}
              trackColor={{ true: Colors.primary, false: '#CBD5E1' }}
            />
          </View>

          <View style={styles.divider} />

          <View style={{ gap: Spacing.sm }}>
            <Text style={styles.settingTitle}>Daily XP Goal</Text>
            <View style={styles.timeRow}>
              {GOAL_OPTIONS.map((goal) => {
                const active = dailyGoal === goal;
                return (
                  <Pressable
                    key={goal}
                    onPress={() => {
                      triggerTapHaptic();
                      setDailyGoal(goal);
                      appStorage.set(StorageKeys.DAILY_GOAL_XP, goal);
                      setStatusMessage(`Daily goal updated to ${goal} XP.`);
                    }}
                    style={[styles.timeChip, active && styles.timeChipActive]}
                  >
                    <Text style={[styles.timeText, active && styles.timeTextActive]}>
                      {goal} XP
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Daily Streak Reminder</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Local Study Notification</Text>
              <Text style={styles.settingSub}>
                Offline daily ping so you never break your streak
              </Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={handleToggleReminder}
              trackColor={{ true: Colors.primary, false: '#CBD5E1' }}
            />
          </View>

          <View style={styles.timeRow}>
            {REMINDER_TIMES.map((slot) => {
              const active =
                reminderHour === slot.hour && reminderMinute === slot.minute;
              return (
                <Pressable
                  key={slot.label}
                  onPress={() => handleSelectTime(slot.hour, slot.minute)}
                  style={[styles.timeChip, active && styles.timeChipActive]}
                >
                  <Text style={[styles.timeText, active && styles.timeTextActive]}>
                    {slot.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Your Offline Data</Text>
        <View style={styles.card}>
          <Text style={styles.settingSub}>
            Mimiko stores 100% of your progress locally on-device with zero trackers or accounts required.
          </Text>
          <Pressable onPress={handleExportProgress} style={styles.exportBtn}>
            <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>Copy Progress Backup (JSON)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  backBtn: {
    padding: 4,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  container: {
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.infoSoft,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.info,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  timeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  timeTextActive: {
    color: Colors.primary,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radii.lg,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
