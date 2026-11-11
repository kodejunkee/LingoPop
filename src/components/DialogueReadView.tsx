import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DialogueReadStep } from '../curriculum/types';
import { speakMandarin, stopMandarinSpeech } from '../engines/audioService';
import { triggerTapHaptic } from '../engines/haptics';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { ChoiceOptionList } from './ChoiceOptionList';

interface DialogueReadViewProps {
  step: DialogueReadStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}

export function DialogueReadView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: DialogueReadViewProps) {
  const [showPinyin, setShowPinyin] = useState(true);
  const [showEnglish, setShowEnglish] = useState(false);
  const [activeLineIdx, setActiveLineIdx] = useState<number | null>(null);
  const playbackCancelledRef = useRef(false);

  useEffect(() => {
    return () => {
      playbackCancelledRef.current = true;
      stopMandarinSpeech();
    };
  }, [step.id]);

  const playSingleLine = (idx: number) => {
    playbackCancelledRef.current = true;
    triggerTapHaptic();
    setActiveLineIdx(idx);
    speakMandarin(step.lines[idx].hanzi, {
      onDone: () => setActiveLineIdx(null),
      onError: () => setActiveLineIdx(null),
    });
  };

  const playWholeDialogue = () => {
    triggerTapHaptic();
    playbackCancelledRef.current = false;

    const speakNext = (idx: number) => {
      if (playbackCancelledRef.current || idx >= step.lines.length) {
        setActiveLineIdx(null);
        return;
      }
      setActiveLineIdx(idx);
      speakMandarin(step.lines[idx].hanzi, {
        onDone: () => {
          if (!playbackCancelledRef.current) {
            speakNext(idx + 1);
          }
        },
        onError: () => setActiveLineIdx(null),
      });
    };

    speakNext(0);
  };

  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="chatbubbles-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Immersion Dialogue · {step.sceneTitle}</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      {/* Controls Bar */}
      <View style={styles.toolbar}>
        <Pressable onPress={playWholeDialogue} style={styles.playAllBtn}>
          <Ionicons name="play" size={16} color="#FFFFFF" />
          <Text style={styles.playAllText}>Play All</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            triggerTapHaptic();
            setShowPinyin((p) => !p);
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
            setShowEnglish((e) => !e);
          }}
          style={[styles.toggleChip, showEnglish && styles.toggleChipActive]}
        >
          <Text style={[styles.toggleText, showEnglish && styles.toggleTextActive]}>
            {showEnglish ? 'Hide Hint' : 'Translate'}
          </Text>
        </Pressable>
      </View>

      {/* Dialogue Bubbles */}
      <View style={styles.bubblesList}>
        {step.lines.map((line, idx) => {
          const isSpeaking = activeLineIdx === idx;
          const isEven = idx % 2 === 0;
          return (
            <Pressable
              key={`${step.id}-line-${idx}`}
              onPress={() => playSingleLine(idx)}
              style={[
                styles.bubble,
                isEven ? styles.bubbleLeft : styles.bubbleRight,
                isSpeaking && styles.bubbleSpeaking,
              ]}
            >
              <View style={styles.bubbleHeader}>
                <Text style={styles.speakerName}>{line.speaker}</Text>
                <Ionicons
                  name={isSpeaking ? 'volume-high' : 'volume-medium-outline'}
                  size={16}
                  color={isSpeaking ? Colors.primary : Colors.textMuted}
                />
              </View>
              <Text style={styles.lineHanzi}>{line.hanzi}</Text>
              {showPinyin ? <Text style={styles.linePinyin}>{line.pinyin}</Text> : null}
              {showEnglish ? <Text style={styles.lineEnglish}>{line.english}</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.questionTitle}>{step.question}</Text>

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
    letterSpacing: 0.4,
  },
  prompt: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.pill,
  },
  playAllText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  toggleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: Radii.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleChipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: '#FFD6C4',
  },
  toggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  toggleTextActive: {
    color: Colors.primary,
  },
  bubblesList: {
    gap: Spacing.sm,
  },
  bubble: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 3,
  },
  bubbleLeft: {
    backgroundColor: Colors.surface,
    marginRight: Spacing.lg,
  },
  bubbleRight: {
    backgroundColor: '#F8FAFC',
    marginLeft: Spacing.lg,
  },
  bubbleSpeaking: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  speakerName: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  lineHanzi: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  linePinyin: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.info,
  },
  lineEnglish: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  questionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
});
