import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  STAGE_0_LESSONS,
  STAGE_1_LESSONS,
  STAGE_2_LESSONS,
  STAGE_3_LESSONS,
  STAGE_4_LESSONS,
} from '@/curriculum';
import type { LessonDefinition } from '@/curriculum/types';
import { triggerTapHaptic } from '@/engines/haptics';
import { getDatabase } from '@/storage/database';
import {
  appStorage,
  getStoredBoolean,
  getStoredNumber,
  getTodayXp,
  StorageKeys,
} from '@/storage/mmkv';
import {
  getAllLessonProgress,
  type LessonProgressRecord,
} from '@/storage/progress';
import { getSRSStats, type SRSStats } from '@/storage/srs';
import { Colors, Radii, Spacing } from '@/theme/tokens';

const UPCOMING_STAGES = [
  {
    id: 'tier-5',
    badge: 'HSK 4–9 · Modular Expansion',
    title: 'Advanced & Business Chinese',
    subtitle: 'Chengyu idioms, graded reading passages & HSK 4–9 vocabulary packs',
    icon: 'ribbon' as const,
    color: '#0EA5E9',
  },
];

function LessonStageSection({
  kicker,
  title,
  accentColor,
  lessons,
  progressMap,
}: {
  kicker: string;
  title: string;
  accentColor: string;
  lessons: LessonDefinition[];
  progressMap: Record<string, LessonProgressRecord>;
}) {
  const completedCount = lessons.filter((l) => Boolean(progressMap[l.id]?.completedAt)).length;

  return (
    <View style={styles.stageBlock}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionKicker, { color: accentColor }]}>{kicker}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={[styles.sectionProgress, { color: accentColor }]}>
          {completedCount}/{lessons.length}
        </Text>
      </View>

      <View style={styles.lessonList}>
        {lessons.map((lesson, idx) => {
          const record = progressMap[lesson.id];
          const isCompleted = Boolean(record?.completedAt);
          const prevCompleted =
            idx === 0 || Boolean(progressMap[lessons[idx - 1].id]?.completedAt);

          return (
            <Pressable
              key={lesson.id}
              onPress={() => {
                triggerTapHaptic();
                router.push(`/lesson/${lesson.id}`);
              }}
              style={({ pressed }) => [
                styles.lessonCard,
                isCompleted && styles.lessonCardDone,
                !prevCompleted && !isCompleted && styles.lessonCardAhead,
                pressed && styles.pressed,
              ]}
            >
              <View
                style={[
                  styles.lessonNumberBox,
                  isCompleted
                    ? styles.lessonNumberDone
                    : prevCompleted
                      ? { backgroundColor: accentColor }
                      : styles.lessonNumberPending,
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.lessonNumberText,
                      prevCompleted && { color: '#FFFFFF' },
                    ]}
                  >
                    {lesson.stage}.{lesson.order}
                  </Text>
                )}
              </View>

              <View style={styles.lessonBody}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonSubtitle}>{lesson.subtitle}</Text>
                <View style={styles.lessonMetaRow}>
                  <Text style={styles.lessonMetaText}>
                    {lesson.estimatedMinutes} min · +{lesson.xpReward} XP
                  </Text>
                  {isCompleted && record ? (
                    <Text style={styles.bestScoreBadge}>
                      Best: {Math.round(record.bestScore)}%
                    </Text>
                  ) : null}
                </View>
              </View>

              <Ionicons
                name="play-circle"
                size={28}
                color={isCompleted ? Colors.success : accentColor}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const [dbReady, setDbReady] = useState(false);
  const [xp, setXp] = useState(() => getStoredNumber(StorageKeys.TOTAL_XP, 0));
  const [todayXp, setTodayXp] = useState(() => getTodayXp());
  const [dailyGoal, setDailyGoal] = useState(() =>
    getStoredNumber(StorageKeys.DAILY_GOAL_XP, 50)
  );
  const [streak, setStreak] = useState(() => getStoredNumber(StorageKeys.STREAK_DAYS, 0));
  const [soundEnabled, setSoundEnabled] = useState(() =>
    getStoredBoolean(StorageKeys.SOUND_ENABLED, true)
  );
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgressRecord>>({});
  const [srsStats, setSrsStats] = useState<SRSStats>({
    totalCards: 0,
    dueNow: 0,
    mastered: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setXp(getStoredNumber(StorageKeys.TOTAL_XP, 0));
      setTodayXp(getTodayXp());
      setDailyGoal(getStoredNumber(StorageKeys.DAILY_GOAL_XP, 50));
      setStreak(getStoredNumber(StorageKeys.STREAK_DAYS, 0));
      setSoundEnabled(getStoredBoolean(StorageKeys.SOUND_ENABLED, true));

      getDatabase()
        .then(() => Promise.all([getAllLessonProgress(), getSRSStats()]))
        .then(([map, stats]) => {
          if (active) {
            setProgressMap(map);
            setSrsStats(stats);
            setDbReady(true);
          }
        })
        .catch((err) => {
          console.warn('SQLite load error:', err);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  const toggleSoundMode = () => {
    const next = !soundEnabled;
    appStorage.set(StorageKeys.SOUND_ENABLED, next);
    setSoundEnabled(next);
    triggerTapHaptic();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>LingoPop</Text>
            <Text style={styles.subtitle}>Mandarin Chinese · Zero to Fluency</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statBadge}>
              <Ionicons name="flame" size={16} color={Colors.primary} />
              <Text style={styles.statText}>{streak}</Text>
            </View>
            <View style={styles.statBadge}>
              <Ionicons name="star" size={16} color="#FFB703" />
              <Text style={styles.statText}>{xp} XP</Text>
            </View>
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                router.push('/settings');
              }}
              style={styles.settingsBtn}
              hitSlop={8}
              accessibilityLabel="Open settings"
            >
              <Ionicons name="settings-outline" size={18} color={Colors.textPrimary} />
            </Pressable>
          </View>
        </View>

        {/* Quick Controls & Offline Status */}
        <View style={styles.controlsRow}>
          <View style={styles.statusChip}>
            <Ionicons
              name={dbReady ? 'checkmark-circle' : 'hourglass-outline'}
              size={15}
              color={dbReady ? '#1B9AAA' : Colors.textMuted}
            />
            <Text style={styles.statusChipText}>
              {dbReady ? 'Offline Ready' : 'Loading DB...'}
            </Text>
          </View>

          <Pressable onPress={toggleSoundMode} style={styles.soundToggleChip}>
            <Ionicons
              name={soundEnabled ? 'volume-high' : 'volume-mute'}
              size={15}
              color={soundEnabled ? Colors.primary : Colors.textSecondary}
            />
            <Text style={styles.soundToggleText}>
              {soundEnabled ? 'Audio On' : 'Silent Mode'}
            </Text>
          </Pressable>
        </View>

        {/* Daily Goal Progress Bar */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeaderRow}>
            <Text style={styles.goalTitle}>Today&rsquo;s Study Goal</Text>
            <Text style={styles.goalCount}>
              {todayXp} / {dailyGoal} XP
            </Text>
          </View>
          <View style={styles.goalTrack}>
            <View
              style={[
                styles.goalFill,
                { width: `${Math.min(100, Math.round((todayXp / Math.max(1, dailyGoal)) * 100))}%` },
              ]}
            />
          </View>
        </View>

        {/* Daily FSRS Spaced Repetition Banner */}
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            router.push('/review');
          }}
          style={({ pressed }) => [styles.reviewBanner, pressed && styles.pressed]}
        >
          <View style={styles.reviewIconBox}>
            <Ionicons name="layers" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.reviewBody}>
            <Text style={styles.reviewTitle}>Daily FSRS Review</Text>
            <Text style={styles.reviewSub}>
              {srsStats.dueNow > 0
                ? `${srsStats.dueNow} flashcards due now · ${srsStats.totalCards} in deck`
                : srsStats.totalCards > 0
                  ? `All caught up! (${srsStats.totalCards} enrolled)`
                  : 'Tap to start spaced repetition flashcards'}
            </Text>
          </View>
          {srsStats.dueNow > 0 ? (
            <View style={styles.duePill}>
              <Text style={styles.duePillText}>{srsStats.dueNow}</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#3A86FF" />
          )}
        </Pressable>

        {/* Practice Studios: Sound Lab + Hanzi Dojo + Dictionary */}
        <View style={styles.labsGrid}>
          <Pressable
            onPress={() => {
              triggerTapHaptic();
              router.push('/sound-lab');
            }}
            style={({ pressed }) => [styles.labTile, styles.soundLabTile, pressed && styles.pressed]}
          >
            <View style={[styles.labTileIcon, { backgroundColor: Colors.primary }]}>
              <Ionicons name="musical-notes" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.labTileTitle}>Sound Lab</Text>
            <Text style={styles.labTileSub}>Tones &amp; Sandhi</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerTapHaptic();
              router.push('/hanzi-dojo');
            }}
            style={({ pressed }) => [styles.labTile, styles.dojoLabTile, pressed && styles.pressed]}
          >
            <View style={[styles.labTileIcon, { backgroundColor: '#1E847F' }]}>
              <Ionicons name="brush" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.labTileTitle}>Hanzi Dojo</Text>
            <Text style={styles.labTileSub}>Stroke Tracing</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              triggerTapHaptic();
              router.push('/dictionary');
            }}
            style={({ pressed }) => [styles.labTile, styles.dictLabTile, pressed && styles.pressed]}
          >
            <View style={[styles.labTileIcon, { backgroundColor: '#6D28D9' }]}>
              <Ionicons name="search" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.labTileTitle}>Dictionary</Text>
            <Text style={styles.labTileSub}>HSK 1 Search</Text>
          </Pressable>
        </View>

        {/* Stage 0 Curriculum */}
        <LessonStageSection
          kicker="STAGE 0 · PHONETICS"
          title="The Sound Engine (Pinyin & Tones)"
          accentColor={Colors.primary}
          lessons={STAGE_0_LESSONS}
          progressMap={progressMap}
        />

        {/* Stage 1 Curriculum */}
        <LessonStageSection
          kicker="STAGE 1 · LITERACY"
          title="Anatomy of Hanzi (Strokes & Radicals)"
          accentColor="#1E847F"
          lessons={STAGE_1_LESSONS}
          progressMap={progressMap}
        />

        {/* Stage 2 Curriculum */}
        <LessonStageSection
          kicker="STAGE 2 · HSK 1 GRAMMAR"
          title="Sentence Architecture"
          accentColor="#3A86FF"
          lessons={STAGE_2_LESSONS}
          progressMap={progressMap}
        />

        {/* Stage 3 Curriculum */}
        <LessonStageSection
          kicker="STAGE 3 · IMMERSION & SPEAKING"
          title="Real Conversations"
          accentColor="#8338EC"
          lessons={STAGE_3_LESSONS}
          progressMap={progressMap}
        />

        {/* Stage 4 Curriculum */}
        <LessonStageSection
          kicker="STAGE 4 · HSK 2–3 BRIDGE"
          title="Intermediate Mandarin Grammar"
          accentColor="#E07A22"
          lessons={STAGE_4_LESSONS}
          progressMap={progressMap}
        />

        {/* Upcoming Curriculum Roadmap */}
        <Text style={[styles.sectionTitle, { marginTop: Spacing.sm }]}>
          Upcoming Mastery Stages
        </Text>

        {UPCOMING_STAGES.map((tier) => (
          <View key={tier.id} style={styles.tierCard}>
            <View style={[styles.iconBox, { backgroundColor: `${tier.color}18` }]}>
              <Ionicons name={tier.icon} size={22} color={tier.color} />
            </View>
            <View style={styles.tierContent}>
              <Text style={[styles.tierBadge, { color: tier.color }]}>{tier.badge}</Text>
              <Text style={styles.tierTitle}>{tier.title}</Text>
              <Text style={styles.tierSubtitle}>{tier.subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  settingsBtn: {
    backgroundColor: Colors.surface,
    padding: 7,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EDF6F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1D3557',
  },
  soundToggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  soundToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  goalCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  goalCount: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  goalTrack: {
    height: 8,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoSoft,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: Spacing.md,
  },
  reviewIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#3A86FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBody: {
    flex: 1,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  reviewSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  duePill: {
    backgroundColor: '#3A86FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  duePillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  labsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  labTile: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.xl,
    borderWidth: 1,
    gap: 3,
  },
  soundLabTile: {
    backgroundColor: Colors.primarySoft,
    borderColor: '#FFD6C4',
  },
  dojoLabTile: {
    backgroundColor: '#E6F7F5',
    borderColor: '#BBEAE4',
  },
  dictLabTile: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  labTileIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  labTileTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  labTileSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  stageBlock: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sectionProgress: {
    fontSize: 14,
    fontWeight: '800',
  },
  lessonList: {
    gap: Spacing.md,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  lessonCardDone: {
    borderColor: '#BBF7D0',
    backgroundColor: '#FAFFFB',
  },
  lessonCardAhead: {
    opacity: 0.88,
  },
  lessonNumberBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberDone: {
    backgroundColor: Colors.success,
  },
  lessonNumberPending: {
    backgroundColor: Colors.surfaceMuted,
  },
  lessonNumberText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  lessonBody: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  lessonSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 4,
  },
  lessonMetaText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  bestScoreBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.success,
  },
  tierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    opacity: 0.78,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierContent: {
    flex: 1,
  },
  tierBadge: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tierTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  tierSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  pressed: {
    opacity: 0.85,
  },
});
