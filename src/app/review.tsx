import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioControlRow } from '@/components/AudioControlRow';
import { speakMandarin, stopMandarinSpeech } from '@/engines/audioService';
import { scheduleFSRSCard, type FSRSRating } from '@/engines/fsrs';
import { triggerSuccessHaptic, triggerTapHaptic } from '@/engines/haptics';
import {
  enqueueVocabForSRS,
  getDueReviewCards,
  getSRSStats,
  submitSRSReview,
  type ReviewCardWithVocab,
  type SRSStats,
} from '@/storage/srs';
import { Colors, Radii, Spacing, ToneColors, type ToneNumber } from '@/theme/tokens';

const STARTER_PACK_WORDS = ['我', '你', '好', '是', '不', '吗', '水', '茶', '书', '老师'];

const RATING_CONFIG: { rating: FSRSRating; label: string; color: string; bg: string }[] = [
  { rating: 1, label: 'Again', color: '#DC2626', bg: '#FEE2E2' },
  { rating: 2, label: 'Hard', color: '#D97706', bg: '#FEF3C7' },
  { rating: 3, label: 'Good', color: '#16A34A', bg: '#DCFCE7' },
  { rating: 4, label: 'Easy', color: '#2563EB', bg: '#DBEAFE' },
];

export default function ReviewScreen() {
  const [cards, setCards] = useState<ReviewCardWithVocab[]>([]);
  const [stats, setStats] = useState<SRSStats>({ totalCards: 0, dueNow: 0, mastered: 0 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDeckData = useCallback(async () => {
    const [due, srsStats] = await Promise.all([getDueReviewCards(25), getSRSStats()]);
    return { due, srsStats };
  }, []);

  useEffect(() => {
    let active = true;
    fetchDeckData()
      .then(({ due, srsStats }) => {
        if (!active) return;
        setCards(due);
        setStats(srsStats);
        setCurrentIndex(0);
        setRevealed(false);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      stopMandarinSpeech();
    };
  }, [fetchDeckData]);

  const currentItem = cards[currentIndex];

  useEffect(() => {
    if (currentItem) {
      const timer = setTimeout(() => {
        speakMandarin(currentItem.simplified);
      }, 200);
      return () => {
        clearTimeout(timer);
        stopMandarinSpeech();
      };
    }
  }, [currentItem]);

  const previewIntervals = useMemo(() => {
    if (!currentItem) return null;
    return {
      1: scheduleFSRSCard(currentItem.card, 1).intervalLabel,
      2: scheduleFSRSCard(currentItem.card, 2).intervalLabel,
      3: scheduleFSRSCard(currentItem.card, 3).intervalLabel,
      4: scheduleFSRSCard(currentItem.card, 4).intervalLabel,
    };
  }, [currentItem]);

  const handleRate = async (rating: FSRSRating) => {
    if (!currentItem) return;
    triggerTapHaptic();
    stopMandarinSpeech();
    await submitSRSReview(currentItem.card, rating);
    setReviewedCount((prev) => prev + 1);
    setRevealed(false);
    setCurrentIndex((prev) => prev + 1);
    if (currentIndex + 1 >= cards.length) {
      triggerSuccessHaptic();
      const updatedStats = await getSRSStats();
      setStats(updatedStats);
    }
  };

  const handleEnrollStarter = async () => {
    triggerTapHaptic();
    setLoading(true);
    try {
      await enqueueVocabForSRS(STARTER_PACK_WORDS);
      const { due, srsStats } = await fetchDeckData();
      setCards(due);
      setStats(srsStats);
      setCurrentIndex(0);
      setRevealed(false);
    } finally {
      setLoading(false);
    }
  };

  const primaryTone = useMemo(() => {
    if (!currentItem) return 1 as ToneNumber;
    const first = Number(currentItem.tonePattern.split('-')[0]);
    return (first >= 1 && first <= 5 ? first : 1) as ToneNumber;
  }, [currentItem]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            stopMandarinSpeech();
            router.back();
          }}
          hitSlop={10}
        >
          <Ionicons name="close" size={26} color={Colors.textSecondary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>FSRS Daily Review</Text>
          <Text style={styles.headerSub}>
            {cards.length > 0 && currentIndex < cards.length
              ? `Card ${currentIndex + 1} of ${cards.length}`
              : `${stats.totalCards} cards in deck`}
          </Text>
        </View>
        <View style={styles.xpPill}>
          <Ionicons name="star" size={14} color="#FFB703" />
          <Text style={styles.xpPillText}>+{reviewedCount * 5}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <Text style={styles.mutedText}>Loading FSRS schedule...</Text>
        </View>
      ) : !currentItem ? (
        <View style={styles.centerBox}>
          <View style={styles.emptyIconCircle}>
            <Ionicons
              name={stats.totalCards === 0 ? 'layers-outline' : 'checkmark-done'}
              size={44}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>
            {stats.totalCards === 0
              ? 'Your Review Deck is Empty'
              : reviewedCount > 0
                ? 'Review Session Complete!'
                : 'All Caught Up!'}
          </Text>
          <Text style={styles.emptyBody}>
            {stats.totalCards === 0
              ? 'Complete Stage 2 lessons to enroll words automatically, or start now with 10 essential HSK 1 words.'
              : `You have ${stats.totalCards} active cards (${stats.mastered} mastered). FSRS will bring each word back right before you’re about to forget it.`}
          </Text>

          {stats.totalCards === 0 ? (
            <Pressable onPress={handleEnrollStarter} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Enroll 10 HSK 1 Starter Words</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.back()} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Back to Roadmap</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <View style={styles.cardStage}>
          <View style={styles.flashcard}>
            <Text style={styles.posBadge}>
              HSK {currentItem.hskLevel}
              {currentItem.partOfSpeech ? ` · ${currentItem.partOfSpeech}` : ''}
            </Text>

            <Text style={styles.cardHanzi}>{currentItem.simplified}</Text>

            <AudioControlRow hanziText={currentItem.simplified} label="Listen" />

            {revealed ? (
              <View style={styles.revealBox}>
                <Text style={[styles.cardPinyin, { color: ToneColors[primaryTone] }]}>
                  {currentItem.pinyin}
                </Text>
                <Text style={styles.cardEnglish}>{currentItem.english}</Text>
                <Text style={styles.memoryMeta}>
                  Reps: {currentItem.card.reps} · Stability:{' '}
                  {currentItem.card.stability.toFixed(1)}d
                </Text>
              </View>
            ) : (
              <Text style={styles.tapHint}>Try to recall the pronunciation and meaning</Text>
            )}
          </View>

          {!revealed ? (
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                setRevealed(true);
              }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnText}>Show Answer</Text>
            </Pressable>
          ) : (
            <View style={styles.ratingsGrid}>
              {RATING_CONFIG.map((cfg) => (
                <Pressable
                  key={cfg.rating}
                  onPress={() => handleRate(cfg.rating)}
                  style={[styles.ratingBtn, { backgroundColor: cfg.bg }]}
                >
                  <Text style={[styles.ratingLabel, { color: cfg.color }]}>
                    {cfg.label}
                  </Text>
                  <Text style={[styles.ratingInterval, { color: cfg.color }]}>
                    {previewIntervals?.[cfg.rating] ?? ''}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  headerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  xpPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  centerBox: {
    flex: 1,
    padding: Spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  mutedText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  cardStage: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'space-between',
  },
  flashcard: {
    flex: 1,
    marginBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  posBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info,
    backgroundColor: Colors.infoSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  cardHanzi: {
    fontSize: 64,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  tapHint: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: Spacing.md,
  },
  revealBox: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    width: '100%',
  },
  cardPinyin: {
    fontSize: 24,
    fontWeight: '800',
  },
  cardEnglish: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  memoryMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radii.lg,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  ratingsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  ratingBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
    gap: 2,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  ratingInterval: {
    fontSize: 12,
    fontWeight: '700',
  },
});
