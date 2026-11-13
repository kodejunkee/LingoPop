import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALL_LESSONS, HSK1_LESSONS } from '@/curriculum';
import type { LessonDefinition } from '@/curriculum/types';
import { triggerTapHaptic } from '@/engines/haptics';
import {
  getStoredNumber,
  StorageKeys,
} from '@/storage/mmkv';
import {
  getAllLessonProgress,
  type LessonProgressRecord,
} from '@/storage/progress';
import { getSRSStats, type SRSStats } from '@/storage/srs';
import { Radii } from '@/theme/tokens';

export default function HomeDashboardScreen() {
  const [streak, setStreak] = useState(() => getStoredNumber(StorageKeys.STREAK_DAYS, 0));
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgressRecord>>({});
  const [srsStats, setSrsStats] = useState<SRSStats>({ totalCards: 0, dueNow: 0, mastered: 0 });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setStreak(getStoredNumber(StorageKeys.STREAK_DAYS, 0));

      getAllLessonProgress()
        .then((records) => {
          if (active) setProgressMap(records);
        })
        .catch(() => {});

      getSRSStats()
        .then((stats) => {
          if (active) setSrsStats(stats);
        })
        .catch(() => {});

      return () => {
        active = false;
      };
    }, [])
  );

  // Active / next lesson
  const nextLesson: LessonDefinition =
    ALL_LESSONS.find((l) => !progressMap[l.id]?.completedAt) ?? ALL_LESSONS[0];

  const currentLevelLessons =
    ALL_LESSONS.filter((l) => l.hskLevel === nextLesson.hskLevel) || HSK1_LESSONS;
  const completedInLevel = currentLevelLessons.filter(
    (l) => Boolean(progressMap[l.id]?.completedAt)
  ).length;
  const levelProgressPct = Math.min(
    100,
    Math.round((completedInLevel / Math.max(1, currentLevelLessons.length)) * 100)
  );

  const totalCompletedLessons = Object.values(progressMap).filter((r) => r.completedAt).length;
  const learnerLevel = Math.max(1, Math.floor(totalCompletedLessons / 2) + 1);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          {/* Standalone Brand Header Logo */}
          <Image
            source={require('../../../assets/mimiko-header-logo-transparent.png')}
            style={styles.headerLogoImage}
            resizeMode="contain"
          />

          {/* Notification Bell with Red Badge Dot */}
          <Pressable
            onPress={() => triggerTapHaptic()}
            style={({ pressed }) => [styles.notificationBtn, pressed && styles.pressed]}
          >
            <Ionicons name="notifications-outline" size={20} color="#1E293B" />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        {/* Hero Banner: "Learn a new language" with seamless mascot & clouds */}
        <View
          style={styles.heroBannerWrapper}
          accessible={true}
          accessibilityLabel="Learn a new language. Anytime, anywhere. Even offline."
        >
          <Image
            source={require('../../../assets/mimiko-full-hero-feathered-2x.png')}
            style={styles.heroBannerImage}
            resizeMode="contain"
          />
        </View>

        {/* 3 Stat Cards Row: Streak, Level, Offline Ready */}
        <View style={styles.statsRow}>
          {/* Card 1: Streak */}
          <View style={styles.statCard}>
            <Ionicons name="flame" size={24} color="#F97316" />
            <View style={styles.statTextCol}>
              <Text style={styles.statMainText} numberOfLines={1}>
                {Math.max(1, streak)} Day
              </Text>
              <Text style={styles.statSubText} numberOfLines={1}>
                Streak
              </Text>
            </View>
          </View>

          {/* Card 2: Level */}
          <View style={styles.statCard}>
            <Ionicons name="bar-chart" size={22} color="#6366F1" />
            <View style={styles.statTextCol}>
              <Text style={styles.statMainText} numberOfLines={1}>
                Lv. {learnerLevel}
              </Text>
              <Text style={styles.statSubText} numberOfLines={1}>
                Learner
              </Text>
            </View>
          </View>

          {/* Card 3: Downloaded Ready */}
          <View style={styles.statCard}>
            <View style={styles.downloadIconWrap}>
              <Ionicons name="download-outline" size={20} color="#7C3AED" />
              <View style={styles.checkBadge}>
                <Ionicons name="checkmark" size={8} color="#FFFFFF" />
              </View>
            </View>
            <View style={styles.statTextCol}>
              <Text style={styles.statMainText} numberOfLines={1}>
                24 Units
              </Text>
              <Text style={styles.statSubText} numberOfLines={1}>
                Ready
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Continue Learning Card */}
        <View style={styles.continueSection}>
          <Text style={styles.sectionHeaderTitle}>Continue Learning</Text>
          <Pressable
            onPress={() => {
              triggerTapHaptic();
              router.push(`/lesson/${nextLesson.id}`);
            }}
            style={({ pressed }) => [styles.continueCard, pressed && styles.cardPressed]}
          >
            {/* Pure mountain ridges artwork in upper right */}
            <Image
              source={require('../../../assets/mimiko-mountains-feathered-2x.png')}
              style={styles.mountainsBackdrop}
              resizeMode="contain"
            />

            <View style={styles.continueMainRow}>
              <View style={styles.flagBox}>
                <Text style={styles.flagEmoji}>🇨🇳</Text>
              </View>
              <View style={styles.continueDetails}>
                <Text style={styles.continueLangTitle}>Chinese</Text>
                <Text style={styles.continueUnitSub} numberOfLines={1}>
                  {nextLesson.hskLevel ? `HSK ${nextLesson.hskLevel}` : 'Beginner'} · Unit {nextLesson.order}
                </Text>
              </View>
            </View>

            {/* Clean violet progress bar row with percentage */}
            <View style={styles.progressRow}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.max(9, levelProgressPct)}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressPercent}>{Math.max(9, levelProgressPct)}%</Text>
            </View>
          </Pressable>
        </View>

        {/* Section: Your Languages Carousel */}
        <View style={styles.languagesSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Your Languages</Text>
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                router.push('/(tabs)/learn');
              }}
            >
              <Text style={styles.seeAllLink}>Manage</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.languagesRow}
          >
            {/* Active Card: Chinese */}
            <View style={[styles.langCard, styles.langCardActive]}>
              <Text style={styles.langFlag}>🇨🇳</Text>
              <Text style={styles.langName}>Chinese</Text>
              <Text style={styles.langStatusActive}>Lv. {learnerLevel}</Text>
            </View>

            {/* Inactive Card: Japanese */}
            <View style={styles.langCard}>
              <Text style={styles.langFlag}>🇯🇵</Text>
              <Text style={styles.langName}>Japanese</Text>
              <Text style={styles.langStatus}>Start</Text>
            </View>

            {/* Inactive Card: Italian */}
            <View style={styles.langCard}>
              <Text style={styles.langFlag}>🇮🇹</Text>
              <Text style={styles.langName}>Italian</Text>
              <Text style={styles.langStatus}>Start</Text>
            </View>

            {/* Add Language Card */}
            <View style={[styles.langCard, styles.langCardAdd]}>
              <Ionicons name="add" size={22} color="#64748B" />
              <Text style={styles.langAddText}>Add{'\n'}Language</Text>
            </View>
          </ScrollView>
        </View>

        {/* Section: Practice Today (5 Pods) */}
        <View style={styles.practiceSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeaderTitle}>Practice Today</Text>
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                router.push('/(tabs)/practice');
              }}
            >
              <Text style={styles.seeAllLink}>See All</Text>
            </Pressable>
          </View>

          <View style={styles.podsRow}>
            {/* 1. Vocabulary / Characters */}
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                router.push('/(tabs)/characters');
              }}
              style={styles.podItem}
            >
              <View style={[styles.podSquircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="book" size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.podLabel}>Vocabulary</Text>
            </Pressable>

            {/* 2. Listening */}
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                router.push('/sound-lab');
              }}
              style={styles.podItem}
            >
              <View style={[styles.podSquircle, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="headset" size={22} color="#3B82F6" />
              </View>
              <Text style={styles.podLabel}>Listening</Text>
            </Pressable>

            {/* 3. Speaking */}
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                router.push(`/lesson/${nextLesson.id}`);
              }}
              style={styles.podItem}
            >
              <View style={[styles.podSquircle, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="chatbubbles" size={22} color="#EC4899" />
              </View>
              <Text style={styles.podLabel}>Speaking</Text>
            </Pressable>

            {/* 4. Reading / Dictionary */}
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                router.push('/dictionary');
              }}
              style={styles.podItem}
            >
              <View style={[styles.podSquircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="reader" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.podLabel}>Reading</Text>
            </Pressable>

            {/* 5. Review (FSRS) */}
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                router.push('/review');
              }}
              style={styles.podItem}
            >
              <View style={[styles.podSquircle, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="repeat" size={22} color="#10B981" />
              </View>
              <Text style={styles.podLabel}>
                {srsStats.dueNow > 0 ? `${srsStats.dueNow} Due` : 'Review'}
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF6F2',
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  headerLogoImage: {
    width: 130,
    height: 38,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1ECE6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: Radii.pill,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  heroBannerWrapper: {
    width: '100%',
    height: 165,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBannerImage: {
    width: '100%',
    height: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1ECE6',
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
  },
  downloadIconWrap: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: Radii.pill,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  statTextCol: {
    flex: 1,
    gap: 1,
  },
  statMainText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  statSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  continueSection: {
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7C3AED',
  },
  continueCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#F1ECE6',
    padding: 16,
    gap: 14,
    overflow: 'hidden',
    position: 'relative',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  mountainsBackdrop: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 145,
    height: 65,
    opacity: 0.95,
  },
  continueMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1ECE6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
  },
  flagEmoji: {
    fontSize: 24,
  },
  continueDetails: {
    flex: 1,
    gap: 2,
  },
  continueLangTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  continueUnitSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E1B4B',
  },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#7C3AED',
    borderRadius: Radii.pill,
  },
  languagesSection: {
    gap: 10,
  },
  languagesRow: {
    gap: 10,
    paddingVertical: 2,
  },
  langCard: {
    width: 82,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  langCardActive: {
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  langCardAdd: {
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  langFlag: {
    fontSize: 22,
  },
  langName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  langStatusActive: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7C3AED',
  },
  langStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  langAddText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 12,
  },
  practiceSection: {
    gap: 12,
  },
  podsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  podItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  podSquircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  podLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
