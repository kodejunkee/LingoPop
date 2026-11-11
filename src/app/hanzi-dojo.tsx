import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioControlRow } from '@/components/AudioControlRow';
import { HanziCanvas } from '@/components/HanziCanvas';
import { DOJO_CHARACTERS, type HanziCharacterDef } from '@/curriculum/hanziData';
import { stopMandarinSpeech } from '@/engines/audioService';
import { triggerTapHaptic } from '@/engines/haptics';
import { Colors, Radii, Spacing, ToneColors } from '@/theme/tokens';

export default function HanziDojoScreen() {
  const [selectedChar, setSelectedChar] = useState<HanziCharacterDef>(DOJO_CHARACTERS[0]);

  useEffect(() => {
    return () => {
      stopMandarinSpeech();
    };
  }, []);

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
            Practice guided stroke order or test yourself in Memory Mode
          </Text>
        </View>
      </View>

      {/* Virtualized Horizontal Character Picker */}
      <View style={styles.pickerContainer}>
        <FlatList
          horizontal
          data={DOJO_CHARACTERS}
          keyExtractor={(item) => item.char}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerList}
          renderItem={({ item }) => {
            const active = item.char === selectedChar.char;
            return (
              <Pressable
                onPress={() => {
                  triggerTapHaptic();
                  setSelectedChar(item);
                }}
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
                  {item.pinyin}
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
  },
  pickerList: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
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
