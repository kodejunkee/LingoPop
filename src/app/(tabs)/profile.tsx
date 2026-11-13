import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { triggerSuccessHaptic, triggerTapHaptic } from '@/engines/haptics';
import {
  appStorage,
  getStoredBoolean,
  getStoredNumber,
  StorageKeys,
} from '@/storage/mmkv';
import { clearAllLessonProgress, getAllLessonProgress } from '@/storage/progress';
import { getSRSStats } from '@/storage/srs';
import { Colors, Radii, Spacing } from '@/theme/tokens';

const SPEEDS = [
  { label: '0.75×', value: 0.75 },
  { label: '0.85×', value: 0.85 },
  { label: '1.0×', value: 1.0 },
];

export default function ProfileScreen() {
  const [totalXp, setTotalXp] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [audioSpeed, setAudioSpeed] = useState(0.85);
  const [dailyGoal, setDailyGoal] = useState(50);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setTotalXp(getStoredNumber(StorageKeys.TOTAL_XP, 0));
      setStreakDays(getStoredNumber(StorageKeys.STREAK_DAYS, 0));
      setSoundEnabled(getStoredBoolean(StorageKeys.SOUND_ENABLED, true));
      setHapticsEnabled(getStoredBoolean(StorageKeys.HAPTICS_ENABLED, true));
      setAudioSpeed(getStoredNumber(StorageKeys.AUDIO_SPEED, 0.85));
      setDailyGoal(getStoredNumber(StorageKeys.DAILY_GOAL_XP, 50));
    }, [])
  );

  const toggleSound = (val: boolean) => {
    triggerTapHaptic();
    setSoundEnabled(val);
    appStorage.set(StorageKeys.SOUND_ENABLED, val);
  };

  const toggleHaptics = (val: boolean) => {
    triggerTapHaptic();
    setHapticsEnabled(val);
    appStorage.set(StorageKeys.HAPTICS_ENABLED, val);
  };

  const selectSpeed = (val: number) => {
    triggerTapHaptic();
    setAudioSpeed(val);
    appStorage.set(StorageKeys.AUDIO_SPEED, val);
  };

  const selectGoal = (val: number) => {
    triggerTapHaptic();
    setDailyGoal(val);
    appStorage.set(StorageKeys.DAILY_GOAL_XP, val);
  };

  const handleExportProgress = async () => {
    triggerSuccessHaptic();
    const [lessons, srs] = await Promise.all([getAllLessonProgress(), getSRSStats()]);
    const payload = {
      exportedAt: new Date().toISOString(),
      app: 'Mimiko',
      totalXp,
      streakDays,
      srsStats: srs,
      lessonProgress: lessons,
    };
    await Clipboard.setStringAsync(JSON.stringify(payload, null, 2));
    setStatusMessage('Progress backup JSON copied to clipboard!');
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleResetProgress = () => {
    Alert.alert(
      'Reset All Progress',
      'This will clear your completed lessons and streak on this device. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await clearAllLessonProgress();
            appStorage.set(StorageKeys.TOTAL_XP, 0);
            appStorage.set(StorageKeys.STREAK_DAYS, 0);
            setTotalXp(0);
            setStreakDays(0);
            setStatusMessage('All progress has been reset.');
            setTimeout(() => setStatusMessage(null), 3000);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Profile & Preferences</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={require('../../../assets/mimiko-avatar.png')}
            style={styles.avatarImage}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Mimiko Learner</Text>
            <Text style={styles.profileSub}>Mandarin Master in Progress</Text>
            <View style={styles.pillRow}>
              <View style={styles.statPill}>
                <Ionicons name="flame" size={16} color="#FF6B35" />
                <Text style={styles.statPillText}>{streakDays} Day Streak</Text>
              </View>
              <View style={styles.statPill}>
                <Ionicons name="star" size={16} color="#FFB703" />
                <Text style={styles.statPillText}>{totalXp} XP</Text>
              </View>
            </View>
          </View>
        </View>

        {statusMessage && (
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
            <Text style={styles.toastText}>{statusMessage}</Text>
          </View>
        )}

        {/* Audio & Haptic Controls */}
        <Text style={styles.sectionLabel}>Learning Preferences</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.settingTitle}>Sound Effects & Audio</Text>
              <Text style={styles.settingSub}>Native pronunciation and ding on correct answers</Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={toggleSound}
              trackColor={{ true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.settingTitle}>Haptic Feedback</Text>
              <Text style={styles.settingSub}>Vibrations on taps and answers</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={toggleHaptics}
              trackColor={{ true: Colors.primary }}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.columnSetting}>
            <Text style={styles.settingTitle}>Speech Playback Speed</Text>
            <Text style={styles.settingSub}>Pacing for Mandarin voice synthesis</Text>
            <View style={styles.choiceRow}>
              {SPEEDS.map((s) => {
                const isActive = audioSpeed === s.value;
                return (
                  <Pressable
                    key={s.label}
                    onPress={() => selectSpeed(s.value)}
                    style={[styles.choiceBtn, isActive && styles.choiceBtnActive]}
                  >
                    <Text style={[styles.choiceBtnText, isActive && styles.choiceBtnTextActive]}>
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.columnSetting}>
            <Text style={styles.settingTitle}>Daily Target XP Goal</Text>
            <View style={styles.choiceRow}>
              {[25, 50, 100].map((goal) => {
                const isActive = dailyGoal === goal;
                return (
                  <Pressable
                    key={goal}
                    onPress={() => selectGoal(goal)}
                    style={[styles.choiceBtn, isActive && styles.choiceBtnActive]}
                  >
                    <Text style={[styles.choiceBtnText, isActive && styles.choiceBtnTextActive]}>
                      {goal} XP
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Offline Privacy & Data */}
        <Text style={styles.sectionLabel}>Your Offline Data</Text>
        <View style={styles.card}>
          <Text style={styles.settingSub}>
            Mimiko stores 100% of your progress locally on-device with zero trackers or external accounts required.
          </Text>
          <Pressable onPress={handleExportProgress} style={styles.exportBtn}>
            <Ionicons name="copy-outline" size={18} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>Copy Progress Backup (JSON)</Text>
          </Pressable>
          <Pressable onPress={handleResetProgress} style={styles.resetBtn}>
            <Ionicons name="trash-outline" size={18} color="#DC2626" />
            <Text style={styles.resetBtnText}>Reset All Progress</Text>
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
  topHeader: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  container: {
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: Radii.xl,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  profileSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
  statPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  toastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  columnSetting: {
    gap: Spacing.sm,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  choiceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  choiceBtnTextActive: {
    color: '#FFFFFF',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    marginTop: 4,
  },
  exportBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 10,
    borderRadius: Radii.lg,
  },
  resetBtnText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 13,
  },
});
