import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GradedReaderSegment, GradedReaderStep } from '../curriculum/types';
import { speakMandarin, stopMandarinSpeech } from '../engines/audioService';
import { triggerSuccessHaptic, triggerTapHaptic } from '../engines/haptics';
import { formatHskBandLabel, lookupWordByHanzi } from '../storage/corpusQueries';
import { enqueueVocabForSRS, type DictionaryRow } from '../storage/srs';
import { Colors, Radii, Spacing, ToneColors, type ToneNumber } from '../theme/tokens';
import { ChoiceOptionList } from './ChoiceOptionList';

interface GradedReaderViewProps {
  step: GradedReaderStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}

export function GradedReaderView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: GradedReaderViewProps) {
  const [showPinyin, setShowPinyin] = useState(false);
  const [showEnglish, setShowEnglish] = useState(false);
  const [activeParaIdx, setActiveParaIdx] = useState<number | null>(null);
  const [selectedSeg, setSelectedSeg] = useState<GradedReaderSegment | null>(null);
  const [lookupResult, setLookupResult] = useState<DictionaryRow | null>(null);
  const [lookupBusy, setLookupBusy] = useState(false);
  const [lookupMissing, setLookupMissing] = useState(false);

  const playbackCancelledRef = useRef(false);
  const activeLookupTokenRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      playbackCancelledRef.current = true;
      stopMandarinSpeech();
    };
  }, [step.id]);

  const playParagraph = (paraIdx: number) => {
    playbackCancelledRef.current = true;
    triggerTapHaptic();
    const text = step.paragraphs[paraIdx].segments.map((s) => s.text).join('');
    setActiveParaIdx(paraIdx);
    speakMandarin(text, {
      onDone: () => setActiveParaIdx(null),
      onError: () => setActiveParaIdx(null),
    });
  };

  const playAllParagraphs = () => {
    triggerTapHaptic();
    playbackCancelledRef.current = false;

    const speakNext = (idx: number) => {
      if (playbackCancelledRef.current || idx >= step.paragraphs.length) {
        setActiveParaIdx(null);
        return;
      }
      setActiveParaIdx(idx);
      const text = step.paragraphs[idx].segments.map((s) => s.text).join('');
      speakMandarin(text, {
        onDone: () => {
          if (!playbackCancelledRef.current) {
            speakNext(idx + 1);
          }
        },
        onError: () => setActiveParaIdx(null),
      });
    };

    speakNext(0);
  };

  const handleTapWord = async (seg: GradedReaderSegment) => {
    if (seg.isPunctuation) return;
    triggerTapHaptic();
    playbackCancelledRef.current = true;
    setSelectedSeg(seg);
    setLookupMissing(false);
    setLookupBusy(true);
    activeLookupTokenRef.current = seg.text;

    speakMandarin(seg.text);

    try {
      const entry = await lookupWordByHanzi(seg.text);
      if (activeLookupTokenRef.current !== seg.text) return;
      setLookupResult(entry);
      setLookupMissing(!entry);
    } catch {
      if (activeLookupTokenRef.current === seg.text) {
        setLookupResult(null);
        setLookupMissing(true);
      }
    } finally {
      if (activeLookupTokenRef.current === seg.text) {
        setLookupBusy(false);
      }
    }
  };

  const handleAddToReview = async () => {
    if (!lookupResult || lookupResult.isEnrolled) return;
    triggerSuccessHaptic();
    await enqueueVocabForSRS([lookupResult.simplified]);
    setLookupResult((prev) => (prev ? { ...prev, isEnrolled: true } : prev));
  };

  const toneNum = lookupResult ? Number(lookupResult.tonePattern.split('-')[0]) : 1;
  const wordToneColor = ToneColors[(toneNum >= 1 && toneNum <= 5 ? toneNum : 1) as ToneNumber];

  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="reader-outline" size={14} color="#0284C7" />
        <Text style={styles.badgeText}>
          {step.hskBadge} · {step.title}
        </Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>
      <Text style={styles.tapHint}>Tap any Chinese word below for instant offline dictionary lookup.</Text>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable onPress={playAllParagraphs} style={styles.playAllBtn}>
          <Ionicons name="play" size={15} color="#FFFFFF" />
          <Text style={styles.playAllText}>Read Passage</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setShowPinyin((v) => !v);
          }}
          style={[styles.toggleChip, showPinyin && styles.toggleChipActive]}
        >
          <Text style={[styles.toggleText, showPinyin && styles.toggleTextActive]}>
            {showPinyin ? 'Pinyin On' : 'Hanzi Only'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setShowEnglish((v) => !v);
          }}
          style={[styles.toggleChip, showEnglish && styles.toggleChipActive]}
        >
          <Text style={[styles.toggleText, showEnglish && styles.toggleTextActive]}>
            {showEnglish ? 'Hide English' : 'Translation'}
          </Text>
        </Pressable>
      </View>

      {/* Graded Reading Card */}
      <View style={styles.passageCard}>
        {step.paragraphs.map((para, pIdx) => {
          const isSpeakingPara = activeParaIdx === pIdx;
          return (
            <View
              key={pIdx}
              style={[styles.paraBlock, isSpeakingPara && styles.paraBlockActive]}
            >
              <View style={styles.paraHeader}>
                <Text style={styles.paraIndex}>Paragraph {pIdx + 1}</Text>
                <Pressable
                  onPress={() => playParagraph(pIdx)}
                  hitSlop={8}
                  style={styles.paraAudioBtn}
                >
                  <Ionicons
                    name={isSpeakingPara ? 'volume-high' : 'volume-medium-outline'}
                    size={16}
                    color={Colors.info}
                  />
                </Pressable>
              </View>

              <View style={styles.segmentsWrap}>
                {para.segments.map((seg, sIdx) => {
                  if (seg.isPunctuation) {
                    return (
                      <Text key={`${pIdx}-${sIdx}`} style={styles.punctToken}>
                        {seg.text}
                      </Text>
                    );
                  }
                  const isSelected = selectedSeg?.text === seg.text;
                  return (
                    <Pressable
                      key={`${pIdx}-${sIdx}`}
                      onPress={() => handleTapWord(seg)}
                      style={[styles.wordToken, isSelected && styles.wordTokenActive]}
                    >
                      {showPinyin && seg.pinyin ? (
                        <Text
                          style={[
                            styles.tokenPinyin,
                            isSelected && styles.tokenPinyinActive,
                          ]}
                        >
                          {seg.pinyin}
                        </Text>
                      ) : null}
                      <Text
                        style={[
                          styles.tokenHanzi,
                          isSelected && styles.tokenHanziActive,
                        ]}
                      >
                        {seg.text}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {showEnglish ? <Text style={styles.paraEnglish}>{para.english}</Text> : null}
            </View>
          );
        })}
      </View>

      {/* Tap-to-Lookup Popover Card */}
      {selectedSeg ? (
        <View style={styles.lookupCard}>
          {lookupBusy ? (
            <Text style={styles.lookupLoading}>Looking up &ldquo;{selectedSeg.text}&rdquo;...</Text>
          ) : lookupResult ? (
            <>
              <View style={styles.lookupTopRow}>
                <View style={styles.lookupTitleGroup}>
                  <Text style={styles.lookupHanzi}>{lookupResult.simplified}</Text>
                  <Text style={[styles.lookupPinyin, { color: wordToneColor }]}>
                    {lookupResult.pinyin}
                  </Text>
                </View>

                <View style={styles.lookupBadges}>
                  <View style={styles.hskTag}>
                    <Text style={styles.hskTagText}>
                      {formatHskBandLabel(lookupResult.hskLevel)}
                    </Text>
                  </View>
                  {lookupResult.partOfSpeech ? (
                    <Text style={styles.posTag}>{lookupResult.partOfSpeech}</Text>
                  ) : null}
                </View>
              </View>

              <Text style={styles.lookupEnglish}>{lookupResult.english}</Text>

              <View style={styles.lookupActions}>
                <Pressable
                  onPress={() => {
                    triggerTapHaptic();
                    speakMandarin(lookupResult.simplified);
                  }}
                  style={styles.lookupAudioBtn}
                >
                  <Ionicons name="volume-high-outline" size={16} color={Colors.info} />
                  <Text style={styles.lookupAudioText}>Pronounce</Text>
                </Pressable>

                <Pressable
                  onPress={handleAddToReview}
                  disabled={lookupResult.isEnrolled}
                  style={[
                    styles.enrollBtn,
                    lookupResult.isEnrolled && styles.enrollBtnDone,
                  ]}
                >
                  <Ionicons
                    name={lookupResult.isEnrolled ? 'checkmark-circle' : 'add-circle-outline'}
                    size={16}
                    color={lookupResult.isEnrolled ? Colors.success : '#FFFFFF'}
                  />
                  <Text
                    style={[
                      styles.enrollBtnText,
                      lookupResult.isEnrolled && styles.enrollBtnTextDone,
                    ]}
                  >
                    {lookupResult.isEnrolled ? 'In Review Deck' : 'Add to Review'}
                  </Text>
                </Pressable>
              </View>
            </>
          ) : lookupMissing ? (
            <View style={styles.lookupFallbackRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lookupHanzi}>{selectedSeg.text}</Text>
                {selectedSeg.pinyin ? (
                  <Text style={styles.lookupFallbackSub}>{selectedSeg.pinyin}</Text>
                ) : null}
                <Text style={styles.lookupFallbackHint}>
                  Proper noun or phrase context token (tap Audio to hear it).
                </Text>
              </View>
              <Pressable
                onPress={() => speakMandarin(selectedSeg.text)}
                style={styles.lookupAudioBtn}
              >
                <Ionicons name="volume-high-outline" size={16} color={Colors.info} />
                <Text style={styles.lookupAudioText}>Speak</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Comprehension Check */}
      <View style={styles.questionBox}>
        <Text style={styles.questionLabel}>Comprehension Check</Text>
        <Text style={styles.questionText}>{step.question}</Text>
        <ChoiceOptionList
          options={step.options}
          selectedAnswer={selectedAnswer}
          targetOptionId={step.targetOptionId}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.md,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.pill,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  prompt: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  tapHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -6,
  },
  toolbar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  playAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  toggleChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radii.pill,
  },
  toggleChipActive: {
    backgroundColor: '#E0F2FE',
    borderColor: '#0284C7',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: '#0369A1',
  },
  passageCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  paraBlock: {
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Radii.md,
    backgroundColor: Colors.background,
  },
  paraBlockActive: {
    backgroundColor: '#EFF6FF',
  },
  paraHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paraIndex: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paraAudioBtn: {
    padding: 4,
  },
  segmentsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    rowGap: 6,
    columnGap: 3,
  },
  wordToken: {
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: Radii.sm,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(148, 163, 184, 0.35)',
  },
  wordTokenActive: {
    backgroundColor: '#0284C7',
    borderBottomColor: '#0284C7',
  },
  tokenPinyin: {
    fontSize: 10,
    color: Colors.textSecondary,
    lineHeight: 13,
  },
  tokenPinyinActive: {
    color: '#E0F2FE',
  },
  tokenHanzi: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  tokenHanziActive: {
    color: '#FFFFFF',
  },
  punctToken: {
    fontSize: 18,
    color: Colors.textSecondary,
    lineHeight: 24,
    paddingBottom: 3,
  },
  paraEnglish: {
    marginTop: 6,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  lookupCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: '#0284C7',
    padding: Spacing.md,
    gap: 8,
  },
  lookupLoading: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  lookupTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lookupTitleGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  lookupHanzi: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  lookupPinyin: {
    fontSize: 15,
    fontWeight: '700',
  },
  lookupBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hskTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  hskTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#4338CA',
  },
  posTag: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  lookupEnglish: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  lookupActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  lookupAudioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  lookupAudioText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info,
  },
  enrollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  enrollBtnDone: {
    backgroundColor: '#DCFCE7',
  },
  enrollBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  enrollBtnTextDone: {
    color: Colors.success,
  },
  lookupFallbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lookupFallbackSub: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.info,
  },
  lookupFallbackHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  questionBox: {
    gap: Spacing.sm,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
});
