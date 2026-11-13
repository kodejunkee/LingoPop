import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioControlRow } from '@/components/AudioControlRow';
import { HanziCanvas } from '@/components/HanziCanvas';
import { DOJO_CHARACTERS, type HanziCharacterDef } from '@/curriculum/hanziData';
import { stopMandarinSpeech } from '@/engines/audioService';
import { triggerTapHaptic } from '@/engines/haptics';
import {
  getHanziByChar,
  searchHanziCatalog,
  type HanziCatalogItem,
} from '@/storage/corpusQueries';
import { Colors, Radii, Spacing, ToneColors } from '@/theme/tokens';

const DOJO_FILTERS: { label: string; value: number | null }[] = [
  { label: 'Curated', value: -1 },
  { label: 'All HSK', value: null },
  { label: 'HSK 1', value: 1 },
  { label: 'HSK 2', value: 2 },
  { label: 'HSK 3', value: 3 },
  { label: 'HSK 4', value: 4 },
  { label: 'HSK 5', value: 5 },
  { label: 'HSK 6', value: 6 },
  { label: 'HSK 7–9', value: 7 },
];

const CURATED_ITEMS: HanziCatalogItem[] = DOJO_CHARACTERS.map((d) => ({
  char: d.char,
  pinyin: d.pinyin,
  tone: d.tone,
  meaning: d.meaning,
  radical: d.radical,
  strokeCount: d.strokes.length,
  hskLevel: d.hskLevel ?? 1,
}));

export default function HanziDojoScreen() {
  const [selectedChar, setSelectedChar] = useState<HanziCharacterDef>(DOJO_CHARACTERS[0]);
  const [query, setQuery] = useState('');
  const [hskFilter, setHskFilter] = useState<number | null>(-1);
  const [catalog, setCatalog] = useState<HanziCatalogItem[]>(CURATED_ITEMS);

  useEffect(() => {
    return () => {
      stopMandarinSpeech();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (hskFilter === -1 && !query.trim()) {
        if (active) setCatalog(CURATED_ITEMS);
        return;
      }
      const levelArg = hskFilter === -1 ? null : hskFilter;
      searchHanziCatalog(query, levelArg, 80)
        .then((items) => {
          if (active) {
            setCatalog(items);
          }
        })
        .catch((err) => console.warn('Hanzi catalog query error:', err));
    }, 100);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, hskFilter]);

  const selectCharacter = (char: string) => {
    triggerTapHaptic();
    getHanziByChar(char)
      .then((def) => {
        if (def) {
          setSelectedChar(def);
        }
      })
      .catch((err) => console.warn('Hanzi load error:', err));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Navigation */}
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
          <Text style={styles.pageTitle}>Hanzi Writing Dojo</Text>
          <Text style={styles.pageSubtitle}>
            3,000+ HSK 3.0 characters · Guided & Memory Mode
          </Text>
        </View>
      </View>

      {/* Search & HSK Band Filter */}
      <View style={styles.pickerContainer}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={(txt) => {
              setQuery(txt);
              if (txt.trim() && hskFilter === -1) {
                setHskFilter(null);
              }
            }}
            placeholder="Search character, pinyin, or English..."
            placeholderTextColor={Colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {DOJO_FILTERS.map((f) => {
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

        {/* Virtualized Horizontal Character Picker */}
        <FlatList
          horizontal
          data={catalog}
          keyExtractor={(item) => item.char}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerList}
          renderItem={({ item }) => {
            const active = item.char === selectedChar.char;
            return (
              <Pressable
                onPress={() => selectCharacter(item.char)}
                style={[styles.charChip, active && styles.charChipActive]}
              >
                <Text style={[styles.charChipHanzi, active && styles.charChipTextActive]}>
                  {item.char}
                </Text>
                <Text
                  style={[
                    styles.charChipPinyin,
                    { color: active ? '#FFFFFF' : ToneColors[item.tone] },
                  ]}
                >
                  {item.pinyin || '—'}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>

      {/* Interactive Tracing Stage + Anatomy Breakdown */}
      <ScrollView
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <HanziCanvas
          key={selectedChar.char}
          character={selectedChar}
          size={264}
          initialShowGuide={true}
          allowGuideToggle={true}
        />

        <View style={styles.audioRowWrap}>
          <AudioControlRow hanziText={selectedChar.char} label={`Pronounce ${selectedChar.char}`} />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillLabel}>Radical</Text>
              <Text style={styles.infoPillValue}>
                {selectedChar.radical} ({selectedChar.radicalMeaning})
              </Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillLabel}>Strokes</Text>
              <Text style={styles.infoPillValue}>{selectedChar.strokes.length}</Text>
            </View>
          </View>

          <Text style={styles.infoHeading}>Structure Breakdown</Text>
          <Text style={styles.infoBody}>{selectedChar.componentsSummary}</Text>

          <Text style={[styles.infoHeading, { marginTop: Spacing.sm }]}>Memory Story</Text>
          <Text style={styles.infoBody}>{selectedChar.etymologyStory}</Text>
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
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.background,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    paddingVertical: 2,
  },
  filterRow: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: '#1E847F',
    borderColor: '#1E847F',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  pickerList: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  charChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    minWidth: 56,
  },
  charChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  charChipHanzi: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  charChipPinyin: {
    fontSize: 11,
    fontWeight: '700',
  },
  charChipTextActive: {
    color: '#FFFFFF',
  },
  bodyContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  audioRowWrap: {
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  infoPill: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: Radii.md,
  },
  infoPillLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  infoPillValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  infoHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  infoBody: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
