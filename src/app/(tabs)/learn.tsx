import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  HSK1_LESSONS,
  HSK2_LESSONS,
  HSK3_LESSONS,
  HSK4_LESSONS,
  HSK5_LESSONS,
  HSK6_LESSONS,
  HSK7_9_LESSONS,
} from '@/curriculum';
import type { LessonDefinition } from '@/curriculum/types';
import { canAccessLesson } from '@/engines/entitlements';
import { triggerTapHaptic } from '@/engines/haptics';
import {
  getAllLessonProgress,
  type LessonProgressRecord,
} from '@/storage/progress';
import { Colors, Radii, Spacing } from '@/theme/tokens';

const HSK_LEVEL_TABS = [
  { id: 'all', label: 'All Levels' },
  { id: '1', label: 'HSK 1', lessons: HSK1_LESSONS, color: '#1E847F', kicker: 'HSK 1 · COMPLETE BEGINNER SURVIVAL' },
  { id: '2', label: 'HSK 2', lessons: HSK2_LESSONS, color: '#3A86FF', kicker: 'HSK 2 · ELEMENTARY COMMUNICATION' },
  { id: '3', label: 'HSK 3', lessons: HSK3_LESSONS, color: '#8338EC', kicker: 'HSK 3 · INTERMEDIATE STRUCTURES' },
  { id: '4', label: 'HSK 4', lessons: HSK4_LESSONS, color: '#EA580C', kicker: 'HSK 4 · INDEPENDENT FLUENCY' },
  { id: '5', label: 'HSK 5', lessons: HSK5_LESSONS, color: '#7C3AED', kicker: 'HSK 5 · ADVANCED FLUENCY & MEDIA' },
  { id: '6', label: 'HSK 6', lessons: HSK6_LESSONS, color: '#BE185D', kicker: 'HSK 6 · PROFESSIONAL & CLASSICAL MASTERY' },
  { id: '7', label: 'HSK 7–9', lessons: HSK7_9_LESSONS, color: '#0F766E', kicker: 'HSK 7–9 · PINNACLE SINOLOGY & GLOBAL DISCOURSE' },
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
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionKicker, { color: accentColor }]}>{kicker}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Text style={[styles.sectionProgress, { color: accentColor }]}>
          {completedCount}/{lessons.length}
        </Text>
      </View>

      <View style={styles.lessonList}>
        {lessons.map((lesson, idx) => {
          const access = canAccessLesson(lesson);
          if (!access.accessible) {
            return null;
          }
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
                  lesson.isCheckpointExam && { backgroundColor: '#F59E0B' },
                  isCompleted
                    ? styles.lessonNumberDone
                    : prevCompleted
                      ? { backgroundColor: lesson.isCheckpointExam ? '#F59E0B' : accentColor }
                      : styles.lessonNumberPending,
                ]}
              >
                {lesson.isCheckpointExam ? (
                  <Ionicons name="trophy" size={18} color="#FFFFFF" />
                ) : isCompleted ? (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                ) : (
                  <Text
                    style={[
                      styles.lessonNumberText,
                      prevCompleted && { color: '#FFFFFF' },
                    ]}
                  >
                    {lesson.hskLevel ? `U${lesson.order}` : `${lesson.stage}.${lesson.order}`}
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

export default function LearnScreen() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgressRecord>>({});

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getAllLessonProgress()
        .then((records) => {
          if (active) setProgressMap(records);
        })
        .catch((err) => console.warn('LearnScreen: Failed to fetch lesson progress:', err));

      return () => {
        active = false;
      };
    }, [])
  );

  const sectionsToRender =
    selectedFilter === 'all'
      ? HSK_LEVEL_TABS.slice(1)
      : HSK_LEVEL_TABS.filter((t) => t.id === selectedFilter);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HSK Mandarin Academy</Text>
        <Text style={styles.headerSubtitle}>
          Official HSK 1 through HSK 7–9 · 70 In-Depth Units + 7 Checkpoint Exams
        </Text>

        {/* Level Switcher Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {HSK_LEVEL_TABS.map((tab) => {
            const isActive = selectedFilter === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => {
                  triggerTapHaptic();
                  setSelectedFilter(tab.id);
                }}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {sectionsToRender.map((tier) => (
          <LessonStageSection
            key={tier.id}
            kicker={tier.kicker!}
            title="10 In-Depth Units + 🏆 Capstone Checkpoint Exam"
            accentColor={tier.color!}
            lessons={tier.lessons!}
            progressMap={progressMap}
          />
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
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  filterRow: {
    gap: 8,
    paddingBottom: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surfaceMuted,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  container: {
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  stageBlock: {
    gap: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: Spacing.sm,
  },
  sectionKicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  sectionProgress: {
    fontSize: 13,
    fontWeight: '800',
  },
  lessonList: {
    gap: Spacing.sm,
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  lessonCardDone: {
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  lessonCardAhead: {
    opacity: 0.85,
  },
  lessonNumberBox: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonNumberPending: {
    backgroundColor: Colors.surfaceMuted,
  },
  lessonNumberDone: {
    backgroundColor: Colors.success,
  },
  lessonNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  lessonBody: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  lessonSubtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  lessonMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  bestScoreBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.pill,
  },
  pressed: {
    opacity: 0.75,
  },
});
