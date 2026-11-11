import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ToneContourSvg } from '@/components/ToneContourSvg';
import {
  LAB_CATEGORIES,
  PINYIN_LAB_DATA,
  type LabSyllableEntry,
} from '@/curriculum/pinyinLab';
import { speakMandarin, stopMandarinSpeech } from '@/engines/audioService';
import { triggerTapHaptic } from '@/engines/haptics';
import { analyzeToneSandhi, type SandhiSyllable } from '@/engines/pinyin';
import { Colors, Radii, Spacing, ToneColors } from '@/theme/tokens';

const SANDHI_PRESETS: { label: string; syllables: SandhiSyllable[]; meaning: string }[] = [
  {
    label: '你好',
    meaning: 'Hello',
    syllables: [
      { hanzi: '你', basePinyin: 'ni', citationTone: 3 },
      { hanzi: '好', basePinyin: 'hao', citationTone: 3 },
    ],
  },
  {
    label: '不是',
    meaning: 'Is not',
    syllables: [
      { hanzi: '不', basePinyin: 'bu', citationTone: 4 },
      { hanzi: '是', basePinyin: 'shi', citationTone: 4 },
    ],
  },
  {
    label: '一个',
    meaning: 'One item',
    syllables: [
      { hanzi: '一', basePinyin: 'yi', citationTone: 1 },
      { hanzi: '个', basePinyin: 'ge', citationTone: 4 },
    ],
  },
  {
    label: '一天',
    meaning: 'One day',
    syllables: [
      { hanzi: '一', basePinyin: 'yi', citationTone: 1 },
      { hanzi: '天', basePinyin: 'tian', citationTone: 1 },
    ],
  },
];

export default function SoundLabScreen() {
  const [selectedCategory, setSelectedCategory] = useState<
    LabSyllableEntry['category'] | 'all'
  >('all');
  const [slowMode, setSlowMode] = useState(false);
  const [activePhraseIdx, setActivePhraseIdx] = useState(0);

  useEffect(() => {
    return () => {
      stopMandarinSpeech();
    };
  }, []);

  const filteredData = useMemo(() => {
    if (selectedCategory === 'all') return PINYIN_LAB_DATA;
    return PINYIN_LAB_DATA.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const activePreset = SANDHI_PRESETS[activePhraseIdx];
  const sandhiAnalysis = useMemo(
    () => analyzeToneSandhi(activePreset.syllables),
    [activePreset]
  );

  const handleSpeak = useCallback(
    (hanzi: string) => {
      triggerTapHaptic();
      speakMandarin(hanzi, { slow: slowMode });
    },
    [slowMode]
  );

  const renderEntry = useCallback(
    ({ item }: { item: LabSyllableEntry }) => (
      <View style={styles.labCard}>
        <View style={styles.labHeader}>
          <Text style={styles.labBase}>{item.base}</Text>
          <Text style={styles.labNotes}>{item.notes}</Text>
        </View>
        <View style={styles.variantsGrid}>
          {item.variants.map((variant) => (
            <Pressable
              key={`${item.base}-${variant.pinyin}`}
              onPress={() => handleSpeak(variant.hanzi)}
              style={({ pressed }) => [styles.variantTile, pressed && styles.pressed]}
            >
              <ToneContourSvg tone={variant.tone} width={54} height={30} strokeWidth={2.5} />
              <Text style={styles.variantHanzi}>{variant.hanzi}</Text>
              <Text style={[styles.variantPinyin, { color: ToneColors[variant.tone] }]}>
                {variant.pinyin}
              </Text>
              <Text style={styles.variantMeaning} numberOfLines={1}>
                {variant.meaning}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    ),
    [handleSpeak]
  );

  const listHeader = (
    <View style={styles.headerBlock}>
      {/* Interactive Sandhi Sandbox */}
      <View style={styles.sandhiCard}>
        <View style={styles.sandhiTitleRow}>
          <Ionicons name="swap-horizontal" size={18} color={Colors.primary} />
          <Text style={styles.sandhiCardTitle}>Live Tone Sandhi Inspector</Text>
        </View>

        <View style={styles.presetRow}>
          {SANDHI_PRESETS.map((preset, idx) => {
            const active = idx === activePhraseIdx;
            return (
              <Pressable
                key={preset.label}
                onPress={() => {
                  setActivePhraseIdx(idx);
                  handleSpeak(preset.label);
                }}
                style={[styles.presetBtn, active && styles.presetBtnActive]}
              >
                <Text style={[styles.presetBtnText, active && styles.presetBtnTextActive]}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sandhiBreakdownRow}>
          {sandhiAnalysis.map((s, idx) => (
            <View key={`${s.hanzi}-${idx}`} style={styles.sandhiCharBox}>
              <Text style={styles.sandhiChar}>{s.hanzi}</Text>
              <Text style={styles.sandhiWritten}>
                Written: {s.writtenPinyin} ({s.citationTone}°)
              </Text>
              <Text style={[styles.sandhiSpoken, { color: ToneColors[s.spokenTone] }]}>
                Spoken: {s.spokenPinyin} ({s.spokenTone}°)
              </Text>
            </View>
          ))}
        </View>

        {sandhiAnalysis.find((s) => s.ruleApplied)?.ruleApplied ? (
          <Text style={styles.sandhiRuleNote}>
            Rule: {sandhiAnalysis.find((s) => s.ruleApplied)?.ruleApplied}
          </Text>
        ) : null}
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setSelectedCategory('all');
          }}
          style={[
            styles.filterChip,
            selectedCategory === 'all' && styles.filterChipActive,
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              selectedCategory === 'all' && styles.filterChipTextActive,
            ]}
          >
            All Sounds
          </Text>
        </Pressable>
        {LAB_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => {
                triggerTapHaptic();
                setSelectedCategory(cat.id);
              }}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={[styles.filterChipText, active && styles.filterChipTextActive]}
              >
                {cat.title}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

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
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.titleWrap}>
          <Text style={styles.pageTitle}>Mandarin Sound Lab</Text>
          <Text style={styles.pageSubtitle}>Tap any tile to hear native pronunciation</Text>
        </View>
        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setSlowMode((prev) => !prev);
          }}
          style={[styles.speedToggle, slowMode && styles.speedToggleActive]}
        >
          <Ionicons
            name="speedometer-outline"
            size={16}
            color={slowMode ? '#FFFFFF' : Colors.primary}
          />
          <Text style={[styles.speedToggleText, slowMode && styles.speedToggleTextActive]}>
            {slowMode ? '0.7x' : '1.0x'}
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.base}
        renderItem={renderEntry}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
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
  speedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: '#FFD6C4',
  },
  speedToggleActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  speedToggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  speedToggleTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.xl,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  headerBlock: {
    gap: Spacing.lg,
  },
  sandhiCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  sandhiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sandhiCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  presetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  presetBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.surfaceMuted,
  },
  presetBtnActive: {
    backgroundColor: Colors.primary,
  },
  presetBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  presetBtnTextActive: {
    color: '#FFFFFF',
  },
  sandhiBreakdownRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  sandhiCharBox: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: Radii.md,
    alignItems: 'center',
    gap: 3,
  },
  sandhiChar: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sandhiWritten: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  sandhiSpoken: {
    fontSize: 13,
    fontWeight: '800',
  },
  sandhiRuleNote: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  filterScroll: {
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.textPrimary,
    borderColor: Colors.textPrimary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  labCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  labHeader: {
    gap: 2,
  },
  labBase: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  labNotes: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  variantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  variantTile: {
    width: '48%',
    backgroundColor: Colors.background,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 2,
  },
  variantHanzi: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  variantPinyin: {
    fontSize: 15,
    fontWeight: '800',
  },
  variantMeaning: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  pressed: {
    opacity: 0.78,
  },
});
