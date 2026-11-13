import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { triggerTapHaptic } from '@/engines/haptics';
import { getSRSStats, type SRSStats } from '@/storage/srs';
import { Colors, Radii, Spacing } from '@/theme/tokens';

export default function PracticeScreen() {
  const [srsStats, setSrsStats] = useState<SRSStats>({
    totalCards: 0,
    dueNow: 0,
    mastered: 0,
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getSRSStats()
        .then((s) => {
          if (active) setSrsStats(s);
        })
        .catch(() => {});

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice & Skills Lab</Text>
        <Text style={styles.headerSubtitle}>
          Reinforce vocabulary, auditory discrimination, and speaking fluency
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* SRS Review Hero Banner */}
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            router.push('/review');
          }}
          style={({ pressed }) => [
            styles.srsHeroCard,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.srsLeft}>
            <View style={styles.srsIconCircle}>
              <Ionicons name="repeat" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.srsDetails}>
              <Text style={styles.srsKicker}>FSRS Spaced Repetition</Text>
              <Text style={styles.srsTitle}>Daily Flashcard Review</Text>
              <Text style={styles.srsSubtitle}>
                {srsStats.dueNow > 0
                  ? `${srsStats.dueNow} cards due for retention review`
                  : 'All caught up! Tap to review or add new cards'}
              </Text>
            </View>
          </View>
          <View style={styles.srsBadge}>
            <Text style={styles.srsBadgeText}>{srsStats.dueNow} Due</Text>
          </View>
        </Pressable>

        {/* Practice Pods Grid */}
        <Text style={styles.sectionHeader}>Practice Modes</Text>

        {/* Sound Lab */}
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            router.push('/sound-lab');
          }}
          style={({ pressed }) => [styles.practiceCard, pressed && styles.pressed]}
        >
          <View style={[styles.cardIconBox, { backgroundColor: '#EDE9FE' }]}>
            <Ionicons name="headset" size={26} color={Colors.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Tone & Pinyin Sound Lab</Text>
            <Text style={styles.cardSubtitle}>
              Master minimal pair auditory discrimination (e.g. wèn vs wěn, mǎi vs mài)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>

        {/* Hanzi Dojo / Characters Shortcut */}
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            router.push('/hanzi-dojo');
          }}
          style={({ pressed }) => [styles.practiceCard, pressed && styles.pressed]}
        >
          <View style={[styles.cardIconBox, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="brush" size={26} color="#D97706" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Character Stroke Dojo</Text>
            <Text style={styles.cardSubtitle}>
              Full-screen canvas with stroke order validation and radical breakdown
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>

        {/* Offline Dictionary */}
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            router.push('/dictionary');
          }}
          style={({ pressed }) => [styles.practiceCard, pressed && styles.pressed]}
        >
          <View style={[styles.cardIconBox, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="book" size={26} color="#16A34A" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Offline HSK Corpus Dictionary</Text>
            <Text style={styles.cardSubtitle}>
              Look up characters, radicals, and example sentences across HSK 1–9
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Pressable>

        {/* Stats Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Memory & Retention Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{srsStats.totalCards}</Text>
              <Text style={styles.statLabel}>Deck Size</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: Colors.primary }]}>{srsStats.dueNow}</Text>
              <Text style={styles.statLabel}>Due Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#16A34A' }]}>{srsStats.mastered}</Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
          </View>
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
  header: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
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
  },
  container: {
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  srsHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    gap: Spacing.md,
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  srsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  srsIconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radii.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  srsDetails: {
    flex: 1,
    gap: 2,
  },
  srsKicker: {
    fontSize: 11,
    fontWeight: '800',
    color: '#E0E7FF',
    textTransform: 'uppercase',
  },
  srsTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  srsSubtitle: {
    fontSize: 11,
    color: '#EDE9FE',
  },
  srsBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  srsBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  practiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  cardIconBox: {
    width: 50,
    height: 50,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  pressed: {
    opacity: 0.8,
  },
});
