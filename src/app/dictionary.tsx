import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { speakMandarin, stopMandarinSpeech } from '@/engines/audioService';
import { triggerSuccessHaptic, triggerTapHaptic } from '@/engines/haptics';
import { formatHskBandLabel } from '@/storage/corpusQueries';
import {
  enqueueVocabForSRS,
  searchDictionary,
  type DictionaryRow,
} from '@/storage/srs';
import { Colors, Radii, Spacing, ToneColors, type ToneNumber } from '@/theme/tokens';

const PAGE_SIZE = 80;

const HSK_FILTERS: { label: string; value: number | null }[] = [
  { label: 'All', value: null },
  { label: 'HSK 1', value: 1 },
  { label: 'HSK 2', value: 2 },
  { label: 'HSK 3', value: 3 },
  { label: 'HSK 4', value: 4 },
  { label: 'HSK 5', value: 5 },
  { label: 'HSK 6', value: 6 },
  { label: 'HSK 7–9', value: 7 },
];

export default function DictionaryScreen() {
  const [query, setQuery] = useState('');
  const [hskFilter, setHskFilter] = useState<number | null>(null);
  const [rows, setRows] = useState<DictionaryRow[]>([]);
  const [hasMore, setHasMore] = useState(false);

  const loadRows = useCallback(async (searchText: string, level: number | null) => {
    const results = await searchDictionary(searchText, level, PAGE_SIZE, 0);
    setRows(results);
    setHasMore(results.length === PAGE_SIZE);
  }, []);

  const loadNextPage = useCallback(async () => {
    if (!hasMore) return;
    const more = await searchDictionary(query, hskFilter, PAGE_SIZE, rows.length);
    if (more.length === 0) {
      setHasMore(false);
      return;
    }
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.simplified));
      const next = more.filter((r) => !seen.has(r.simplified));
      return next.length > 0 ? [...prev, ...next] : prev;
    });
    setHasMore(more.length === PAGE_SIZE);
  }, [hasMore, hskFilter, query, rows.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadRows(query, hskFilter).catch((err) =>
        console.warn('Dictionary search error:', err)
      );
    }, 120);
    return () => clearTimeout(timer);
  }, [query, hskFilter, loadRows]);

  useEffect(() => {
    return () => {
      stopMandarinSpeech();
    };
  }, []);

  const handleEnroll = useCallback(
    async (word: string) => {
      triggerSuccessHaptic();
      await enqueueVocabForSRS([word]);
      await loadRows(query, hskFilter);
    },
    [loadRows, query, hskFilter]
  );

  const renderItem = useCallback(
    ({ item }: { item: DictionaryRow }) => {
      const toneNum = Number(item.tonePattern.split('-')[0]);
      const colorTone = (toneNum >= 1 && toneNum <= 5 ? toneNum : 1) as ToneNumber;

      return (
        <View style={styles.wordCard}>
          <Pressable
            onPress={() => {
              triggerTapHaptic();
              speakMandarin(item.simplified);
            }}
            style={styles.wordLeft}
          >
            <Text style={styles.wordHanzi}>{item.simplified}</Text>
            <View style={styles.wordBody}>
              <View style={styles.wordTopRow}>
                <Text style={[styles.wordPinyin, { color: ToneColors[colorTone] }]}>
                  {item.pinyin}
                </Text>
                <View style={styles.hskTag}>
                  <Text style={styles.hskTagText}>{formatHskBandLabel(item.hskLevel)}</Text>
                </View>
                {item.partOfSpeech ? (
                  <Text style={styles.posTag}>{item.partOfSpeech}</Text>
                ) : null}
              </View>
              <Text style={styles.wordEnglish}>{item.english}</Text>
            </View>
          </Pressable>

          <View style={styles.wordActions}>
            <Pressable
              onPress={() => {
                triggerTapHaptic();
                speakMandarin(item.simplified);
              }}
              style={styles.audioIconBtn}
              hitSlop={6}
            >
              <Ionicons name="volume-medium" size={20} color={Colors.primary} />
            </Pressable>

            <Pressable
              disabled={item.isEnrolled}
              onPress={() => handleEnroll(item.simplified)}
              style={[styles.deckBtn, item.isEnrolled && styles.deckBtnDone]}
            >
              <Ionicons
                name={item.isEnrolled ? 'checkmark' : 'add'}
                size={15}
                color={item.isEnrolled ? Colors.success : Colors.textPrimary}
              />
              <Text
                style={[
                  styles.deckBtnText,
                  item.isEnrolled && { color: Colors.success },
                ]}
              >
                {item.isEnrolled ? 'In Deck' : 'Review'}
              </Text>
            </Pressable>
          </View>
        </View>
      );
    },
    [handleEnroll]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            stopMandarinSpeech();
            router.back();
          }}
          hitSlop={10}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.pageTitle}>Offline Dictionary</Text>
          <Text style={styles.pageSubtitle}>
            HSK 1–9 Offline Corpus · Hanzi, Pinyin & English
          </Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search words, pinyin (e.g. shu1), or meanings..."
            placeholderTextColor={Colors.textMuted}
            style={styles.searchInput}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {HSK_FILTERS.map((f) => {
            const active = hskFilter === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => {
                  triggerTapHaptic();
                  setHskFilter(f.value);
                }}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.simplified}
        renderItem={renderItem}
        onEndReached={() => {
          loadNextPage().catch((err) => console.warn('Dictionary pagination error:', err));
        }}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No matching dictionary entries found.</Text>
        }
      />
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
  titleWrap: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pageSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  searchWrap: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  wordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  wordHanzi: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.textPrimary,
    minWidth: 56,
    textAlign: 'center',
  },
  wordBody: {
    flex: 1,
    gap: 2,
  },
  wordTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flexWrap: 'wrap',
  },
  wordPinyin: {
    fontSize: 15,
    fontWeight: '800',
  },
  hskTag: {
    backgroundColor: Colors.infoSoft,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.pill,
  },
  hskTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.info,
  },
  posTag: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  wordEnglish: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  wordActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  audioIconBtn: {
    padding: 6,
  },
  deckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  deckBtnDone: {
    backgroundColor: Colors.successSoft,
  },
  deckBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textMuted,
    fontSize: 14,
    marginTop: Spacing.xl,
  },
});
