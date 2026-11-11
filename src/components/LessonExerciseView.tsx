import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getHanziDef } from '../curriculum/hanziData';
import type {
  ClozeBlankStep,
  ConceptStep,
  LessonStep,
  MinimalPairStep,
  PinyinBuilderStep,
  RadicalBreakdownStep,
  SentenceScrambleStep,
  StrokeOrderRuleStep,
  StrokeTraceStep,
  ToneContourStep,
  ToneSandhiStep,
} from '../curriculum/types';
import { speakMandarin } from '../engines/audioService';
import { triggerTapHaptic } from '../engines/haptics';
import { numberedToMarkedPinyin } from '../engines/pinyin';
import { Colors, Radii, Spacing, ToneColors, ToneLabels, type ToneNumber } from '../theme/tokens';
import { AudioControlRow } from './AudioControlRow';
import { ChoiceOptionList } from './ChoiceOptionList';
import { DialogueReadView } from './DialogueReadView';
import { HanziCanvas } from './HanziCanvas';
import { SpeakingDrillView } from './SpeakingDrillView';
import { ToneContourSvg } from './ToneContourSvg';

interface LessonExerciseViewProps {
  step: LessonStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  isCorrect: boolean;
  onSelectAnswer: (answer: string) => void;
}

export function LessonExerciseView({
  step,
  selectedAnswer,
  isChecked,
  isCorrect,
  onSelectAnswer,
}: LessonExerciseViewProps) {
  switch (step.type) {
    case 'concept':
      return <ConceptView step={step} />;
    case 'tone_contour':
      return (
        <ToneContourView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          isCorrect={isCorrect}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'minimal_pair':
      return (
        <MinimalPairView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'tone_sandhi_lab':
      return (
        <ToneSandhiView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'pinyin_builder':
      return (
        <PinyinBuilderView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'stroke_trace':
      return (
        <StrokeTraceView
          step={step}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'radical_breakdown':
      return (
        <RadicalBreakdownView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'stroke_order_rule':
      return (
        <StrokeOrderRuleView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'sentence_scramble':
      return (
        <SentenceScrambleView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'cloze_blank':
      return (
        <ClozeBlankView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'dialogue_read':
      return (
        <DialogueReadView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      );
    case 'speaking_drill':
      return (
        <SpeakingDrillView
          step={step}
          selectedAnswer={selectedAnswer}
          isChecked={isChecked}
          onSelectAnswer={onSelectAnswer}
        />
      );
  }
}

function ConceptView({ step }: { step: ConceptStep }) {
  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="book-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Core Concept</Text>
      </View>

      <Text style={styles.title}>{step.title}</Text>
      <Text style={styles.body}>{step.body}</Text>

      {step.tip ? (
        <View style={styles.tipBox}>
          <Ionicons name="bulb-outline" size={18} color={Colors.primary} />
          <Text style={styles.tipText}>{step.tip}</Text>
        </View>
      ) : null}

      <View style={styles.examplesList}>
        {step.examples.map((ex, idx) => {
          const toneColor = ToneColors[ex.tone];
          return (
            <Pressable
              key={`${ex.hanzi}-${idx}`}
              onPress={() => {
                triggerTapHaptic();
                speakMandarin(ex.hanzi);
              }}
              style={({ pressed }) => [styles.exampleCard, pressed && styles.pressed]}
            >
              <View style={styles.exampleLeft}>
                <Text style={styles.exampleHanzi}>{ex.hanzi}</Text>
                <View style={styles.exampleMeta}>
                  <Text style={[styles.examplePinyin, { color: toneColor }]}>
                    {ex.pinyin}
                  </Text>
                  <Text style={styles.exampleMeaning}>{ex.meaning}</Text>
                  {ex.note ? <Text style={styles.exampleNote}>{ex.note}</Text> : null}
                </View>
              </View>
              <View style={styles.exampleRight}>
                <ToneContourSvg tone={ex.tone} width={60} height={36} />
                <Ionicons name="volume-medium" size={20} color={Colors.primary} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToneContourView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: {
  step: ToneContourStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  isCorrect: boolean;
  onSelectAnswer: (answer: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="ear-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Tone Ear Training</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <View style={styles.audioStageCard}>
        <Text style={styles.targetMeaningHint}>Meaning: &ldquo;{step.meaning}&rdquo;</Text>
        {isChecked ? (
          <View style={styles.revealedTarget}>
            <Text style={styles.revealedHanzi}>{step.targetHanzi}</Text>
            <Text style={[styles.revealedPinyin, { color: ToneColors[step.targetTone] }]}>
              {step.targetPinyin}
            </Text>
          </View>
        ) : (
          <Text style={styles.hiddenPinyin}>{step.targetBasePinyin}?</Text>
        )}
        <AudioControlRow hanziText={step.targetHanzi} label="Play Audio" />
      </View>

      <View style={styles.gridTwo}>
        {step.availableTones.map((tone) => {
          const isSelected = selectedAnswer === String(tone);
          const isTarget = tone === step.targetTone;
          const markedSample = numberedToMarkedPinyin(`${step.targetBasePinyin}${tone}`);
          const toneInfo = ToneLabels[tone];

          let borderColor: string = Colors.border;
          let bgColor: string = Colors.surface;

          if (isChecked) {
            if (isTarget) {
              borderColor = Colors.success;
              bgColor = Colors.successSoft;
            } else if (isSelected) {
              borderColor = Colors.error;
              bgColor = Colors.errorSoft;
            }
          } else if (isSelected) {
            borderColor = ToneColors[tone];
            bgColor = `${ToneColors[tone]}12`;
          }

          return (
            <Pressable
              key={tone}
              disabled={isChecked}
              onPress={() => {
                triggerTapHaptic();
                onSelectAnswer(String(tone));
              }}
              style={[styles.toneOptionCard, { borderColor, backgroundColor: bgColor }]}
            >
              <ToneContourSvg tone={tone} width={88} height={46} />
              <Text style={[styles.toneOptionPinyin, { color: ToneColors[tone] }]}>
                {markedSample}
              </Text>
              <Text style={styles.toneOptionName}>{toneInfo.name}</Text>
              <Text style={styles.toneOptionDesc}>{toneInfo.shortDesc}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MinimalPairView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: {
  step: MinimalPairStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}) {
  const targetOption = useMemo(
    () => step.options.find((o) => o.id === step.targetOptionId) ?? step.options[0],
    [step]
  );

  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="git-compare-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Sound Contrast Drill</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <View style={styles.audioStageCard}>
        <AudioControlRow hanziText={targetOption.hanzi} label="Listen to Target" />
        <Text style={styles.subHint}>
          Tap an option to select it (after checking, tap any card to compare sounds).
        </Text>
      </View>

      <View style={styles.optionsColumn}>
        {step.options.map((opt) => {
          const isSelected = selectedAnswer === opt.id;
          const isTarget = opt.id === step.targetOptionId;

          let borderColor: string = Colors.border;
          let bgColor: string = Colors.surface;

          if (isChecked) {
            if (isTarget) {
              borderColor = Colors.success;
              bgColor = Colors.successSoft;
            } else if (isSelected) {
              borderColor = Colors.error;
              bgColor = Colors.errorSoft;
            }
          } else if (isSelected) {
            borderColor = Colors.primary;
            bgColor = Colors.primarySoft;
          }

          return (
            <Pressable
              key={opt.id}
              onPress={() => {
                triggerTapHaptic();
                if (isChecked) {
                  speakMandarin(opt.hanzi);
                } else {
                  onSelectAnswer(opt.id);
                }
              }}
              style={[styles.choiceRow, { borderColor, backgroundColor: bgColor }]}
            >
              <View style={styles.choiceLeft}>
                <Text style={styles.choiceHanzi}>{opt.hanzi}</Text>
                <View>
                  <Text style={[styles.choicePinyin, { color: ToneColors[opt.tone] }]}>
                    {opt.pinyin}
                  </Text>
                  <Text style={styles.choiceMeaning}>{opt.meaning}</Text>
                </View>
              </View>
              {isChecked ? (
                <Ionicons name="volume-medium" size={22} color={Colors.textSecondary} />
              ) : (
                <ToneContourSvg tone={opt.tone} width={62} height={36} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ToneSandhiView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: {
  step: ToneSandhiStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="swap-horizontal-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Tone Sandhi Lab</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <View style={styles.audioStageCard}>
        <Text style={styles.sandhiHanzi}>{step.hanziPhrase}</Text>
        <Text style={styles.sandhiWritten}>Dictionary tones: {step.writtenPinyin}</Text>
        <Text style={styles.targetMeaningHint}>Meaning: &ldquo;{step.meaning}&rdquo;</Text>
        <AudioControlRow hanziText={step.hanziPhrase} label="Hear Spoken Phrase" />
      </View>

      <View style={styles.optionsColumn}>
        {step.options.map((opt) => {
          const isSelected = selectedAnswer === opt.id;
          const isTarget = opt.id === step.targetOptionId;

          let borderColor: string = Colors.border;
          let bgColor: string = Colors.surface;

          if (isChecked) {
            if (isTarget) {
              borderColor = Colors.success;
              bgColor = Colors.successSoft;
            } else if (isSelected) {
              borderColor = Colors.error;
              bgColor = Colors.errorSoft;
            }
          } else if (isSelected) {
            borderColor = Colors.primary;
            bgColor = Colors.primarySoft;
          }

          return (
            <Pressable
              key={opt.id}
              disabled={isChecked}
              onPress={() => {
                triggerTapHaptic();
                onSelectAnswer(opt.id);
              }}
              style={[styles.choiceRow, { borderColor, backgroundColor: bgColor }]}
            >
              <View>
                <Text style={styles.sandhiOptionPinyin}>{opt.spokenPinyin}</Text>
                <Text style={styles.choiceMeaning}>{opt.tonePatternLabel}</Text>
              </View>
              <Ionicons
                name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                size={22}
                color={isSelected ? Colors.primary : Colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function PinyinBuilderView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: {
  step: PinyinBuilderStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}) {
  const parts = selectedAnswer ? selectedAnswer.split('|') : ['', '', ''];
  const selInitial = parts[0] || '';
  const selFinal = parts[1] || '';
  const selTone = parts[2] ? (Number(parts[2]) as ToneNumber) : null;

  const updatePart = (idx: 0 | 1 | 2, val: string) => {
    const next = [selInitial, selFinal, selTone ? String(selTone) : ''];
    next[idx] = val;
    onSelectAnswer(next.join('|'));
  };

  const previewPinyin =
    selInitial && selFinal && selTone
      ? numberedToMarkedPinyin(`${selInitial}${selFinal}${selTone}`)
      : `${selInitial || '—'} + ${selFinal || '—'} + ${selTone ? `${selTone}°` : 'Tone'}`;

  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="construct-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Phonetic Builder</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <View style={styles.audioStageCard}>
        <Text style={styles.revealedHanzi}>{step.targetHanzi}</Text>
        <Text style={styles.targetMeaningHint}>Meaning: &ldquo;{step.meaning}&rdquo;</Text>
        <View style={styles.previewChip}>
          <Text
            style={[
              styles.previewPinyinText,
              selTone ? { color: ToneColors[selTone] } : undefined,
            ]}
          >
            {previewPinyin}
          </Text>
        </View>
        <AudioControlRow hanziText={step.targetHanzi} label="Hear Syllable" />
      </View>

      <Text style={styles.builderLabel}>1. Initial (Starting Consonant)</Text>
      <View style={styles.chipRow}>
        {step.initialsPool.map((init) => {
          const active = selInitial === init;
          return (
            <Pressable
              key={init}
              disabled={isChecked}
              onPress={() => {
                triggerTapHaptic();
                updatePart(0, init);
              }}
              style={[styles.tileChip, active && styles.tileChipActive]}
            >
              <Text style={[styles.tileText, active && styles.tileTextActive]}>{init}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.builderLabel}>2. Final (Vowel Ending)</Text>
      <View style={styles.chipRow}>
        {step.finalsPool.map((fin) => {
          const active = selFinal === fin;
          return (
            <Pressable
              key={fin}
              disabled={isChecked}
              onPress={() => {
                triggerTapHaptic();
                updatePart(1, fin);
              }}
              style={[styles.tileChip, active && styles.tileChipActive]}
            >
              <Text style={[styles.tileText, active && styles.tileTextActive]}>{fin}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.builderLabel}>3. Tone Pitch</Text>
      <View style={styles.chipRow}>
        {step.tonesPool.map((tone) => {
          const active = selTone === tone;
          return (
            <Pressable
              key={tone}
              disabled={isChecked}
              onPress={() => {
                triggerTapHaptic();
                updatePart(2, String(tone));
              }}
              style={[
                styles.tileChip,
                active && { borderColor: ToneColors[tone], backgroundColor: `${ToneColors[tone]}15` },
              ]}
            >
              <Text style={[styles.tileText, { color: ToneColors[tone] }]}>
                {ToneLabels[tone].name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function StrokeTraceView({
  step,
  onSelectAnswer,
}: {
  step: StrokeTraceStep;
  onSelectAnswer: (answer: string) => void;
}) {
  const charDef = useMemo(() => getHanziDef(step.targetChar), [step.targetChar]);

  if (!charDef) {
    return <Text style={styles.body}>Character definition not found: {step.targetChar}</Text>;
  }

  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="brush-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Guided Writing</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <HanziCanvas
        character={charDef}
        size={256}
        initialShowGuide={step.showGuide ?? true}
        allowGuideToggle={false}
        onComplete={() => onSelectAnswer('completed')}
      />
    </View>
  );
}

function RadicalBreakdownView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: {
  step: RadicalBreakdownStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="extension-puzzle-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Character Anatomy</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <View style={styles.audioStageCard}>
        <Text style={styles.sandhiHanzi}>{step.targetChar}</Text>
        <View style={styles.anatomyRow}>
          <View style={styles.anatomyChip}>
            <Text style={styles.anatomyChar}>{step.radicalPart}</Text>
            <Text style={styles.anatomyLabel}>Radical</Text>
          </View>
          <Ionicons name="add" size={20} color={Colors.textMuted} />
          <View style={styles.anatomyChip}>
            <Text style={styles.anatomyChar}>{step.otherPart}</Text>
            <Text style={styles.anatomyLabel}>Part</Text>
          </View>
        </View>
        <Text style={[styles.choicePinyin, { color: ToneColors[step.tone] }]}>
          {step.pinyin} · &ldquo;{step.meaning}&rdquo;
        </Text>
        <AudioControlRow hanziText={step.targetChar} label="Hear Character" />
      </View>

      <ChoiceOptionList
        options={step.options}
        targetOptionId={step.targetOptionId}
        selectedAnswer={selectedAnswer}
        isChecked={isChecked}
        onSelectAnswer={onSelectAnswer}
      />
    </View>
  );
}

function StrokeOrderRuleView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: {
  step: StrokeOrderRuleStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="layers-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Stroke Order Rule</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <View style={styles.audioStageCard}>
        <Text style={styles.sandhiHanzi}>{step.targetChar}</Text>
        <Text style={[styles.choicePinyin, { color: ToneColors[step.tone] }]}>
          {step.pinyin} · &ldquo;{step.meaning}&rdquo;
        </Text>
        <AudioControlRow hanziText={step.targetChar} label="Hear Character" />
      </View>

      <ChoiceOptionList
        options={step.options}
        targetOptionId={step.targetOptionId}
        selectedAnswer={selectedAnswer}
        isChecked={isChecked}
        onSelectAnswer={onSelectAnswer}
      />
    </View>
  );
}

function SentenceScrambleView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: {
  step: SentenceScrambleStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}) {
  const placedIds = useMemo(
    () => (selectedAnswer ? selectedAnswer.split('|').filter(Boolean) : []),
    [selectedAnswer]
  );

  const placedTiles = useMemo(
    () =>
      placedIds
        .map((id) => step.tiles.find((t) => t.id === id))
        .filter((t): t is NonNullable<typeof t> => Boolean(t)),
    [placedIds, step.tiles]
  );

  const addTile = (tileId: string, hanzi: string) => {
    if (isChecked || placedIds.includes(tileId)) return;
    triggerTapHaptic();
    speakMandarin(hanzi);
    onSelectAnswer([...placedIds, tileId].join('|'));
  };

  const removeTile = (tileId: string) => {
    if (isChecked) return;
    triggerTapHaptic();
    onSelectAnswer(placedIds.filter((id) => id !== tileId).join('|'));
  };

  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="apps-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Sentence Builder</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <View style={styles.audioStageCard}>
        <Text style={styles.englishPromptText}>&ldquo;{step.englishPrompt}&rdquo;</Text>
        {isChecked ? (
          <AudioControlRow
            hanziText={step.targetHanziSentence}
            label="Hear Full Sentence"
          />
        ) : null}
      </View>

      {/* Answer Tray */}
      <View style={styles.scrambleTray}>
        {placedTiles.length === 0 ? (
          <Text style={styles.scramblePlaceholder}>Tap word blocks below in order...</Text>
        ) : (
          placedTiles.map((tile) => (
            <Pressable
              key={`placed-${tile.id}`}
              disabled={isChecked}
              onPress={() => removeTile(tile.id)}
              style={[styles.wordTile, styles.wordTilePlaced]}
            >
              <Text style={styles.wordTileHanzi}>{tile.hanzi}</Text>
              <Text style={styles.wordTilePinyin}>{tile.pinyin}</Text>
            </Pressable>
          ))
        )}
      </View>

      {/* Tile Bank */}
      <View style={styles.tileBank}>
        {step.tiles.map((tile) => {
          const used = placedIds.includes(tile.id);
          return (
            <Pressable
              key={`bank-${tile.id}`}
              disabled={isChecked || used}
              onPress={() => addTile(tile.id, tile.hanzi)}
              style={[styles.wordTile, used && styles.wordTileUsed]}
            >
              <Text style={[styles.wordTileHanzi, used && styles.wordTileTextUsed]}>
                {tile.hanzi}
              </Text>
              <Text style={[styles.wordTilePinyin, used && styles.wordTileTextUsed]}>
                {tile.pinyin}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function ClozeBlankView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: {
  step: ClozeBlankStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="create-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Grammar Fill-In</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <View style={styles.audioStageCard}>
        <Text style={styles.clozeSentence}>
          {step.sentenceBefore}
          <Text style={styles.clozeBlankPill}> ___ </Text>
          {step.sentenceAfter}
        </Text>
        <Text style={styles.clozePinyin}>{step.pinyinHint}</Text>
        <Text style={styles.targetMeaningHint}>&ldquo;{step.englishTranslation}&rdquo;</Text>
        {isChecked ? (
          <AudioControlRow hanziText={step.fullTargetSentence} label="Hear Complete" />
        ) : null}
      </View>

      <ChoiceOptionList
        options={step.options}
        targetOptionId={step.targetOptionId}
        selectedAnswer={selectedAnswer}
        isChecked={isChecked}
        onSelectAnswer={onSelectAnswer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.lg,
  },
  badgePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.infoSoft,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.info,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    lineHeight: 28,
  },
  body: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 23,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primarySoft,
    padding: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#FFD6C4',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 19,
  },
  examplesList: {
    gap: Spacing.sm,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exampleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  exampleHanzi: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.textPrimary,
    minWidth: 44,
    textAlign: 'center',
  },
  exampleMeta: {
    flex: 1,
    gap: 2,
  },
  examplePinyin: {
    fontSize: 17,
    fontWeight: '800',
  },
  exampleMeaning: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  exampleNote: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  exampleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  prompt: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  audioStageCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.md,
  },
  targetMeaningHint: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  hiddenPinyin: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  revealedTarget: {
    alignItems: 'center',
    gap: 2,
  },
  revealedHanzi: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  revealedPinyin: {
    fontSize: 22,
    fontWeight: '800',
  },
  subHint: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  toneOptionCard: {
    width: '48%',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 2,
    gap: 4,
  },
  toneOptionPinyin: {
    fontSize: 22,
    fontWeight: '800',
  },
  toneOptionName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  toneOptionDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  optionsColumn: {
    gap: Spacing.md,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 2,
  },
  choiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  choiceHanzi: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  choicePinyin: {
    fontSize: 18,
    fontWeight: '800',
  },
  choiceMeaning: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sandhiHanzi: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  sandhiWritten: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sandhiOptionPinyin: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  previewChip: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
  },
  previewPinyinText: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  builderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: Spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tileChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  tileChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  tileText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tileTextActive: {
    color: Colors.primary,
  },
  radicalOptionBody: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  radicalOptionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  anatomyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  anatomyChip: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  anatomyChar: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  anatomyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  englishPromptText: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  scrambleTray: {
    minHeight: 74,
    backgroundColor: Colors.surface,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    padding: Spacing.md,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  scramblePlaceholder: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tileBank: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  wordTile: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  wordTilePlaced: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  wordTileUsed: {
    backgroundColor: Colors.surfaceMuted,
    borderColor: Colors.surfaceMuted,
  },
  wordTileHanzi: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  wordTilePinyin: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  wordTileTextUsed: {
    color: 'transparent',
  },
  clozeSentence: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
  },
  clozeBlankPill: {
    color: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  clozePinyin: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pressed: {
    opacity: 0.85,
  },
});
