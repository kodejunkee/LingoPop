import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { SpeakingDrillStep } from '../curriculum/types';
import { stopMandarinSpeech } from '../engines/audioService';
import {
  triggerErrorHaptic,
  triggerSuccessHaptic,
  triggerTapHaptic,
} from '../engines/haptics';
import {
  evaluateMandarinSpeech,
  type SpeechEvaluationResult,
} from '../engines/speechEvaluation';
import { Colors, Radii, Spacing } from '../theme/tokens';
import { AudioControlRow } from './AudioControlRow';

interface SpeakingDrillViewProps {
  step: SpeakingDrillStep;
  selectedAnswer: string | null;
  isChecked: boolean;
  onSelectAnswer: (answer: string) => void;
}

export function SpeakingDrillView({
  step,
  selectedAnswer,
  isChecked,
  onSelectAnswer,
}: SpeakingDrillViewProps) {
  const [recognizing, setRecognizing] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<SpeechEvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      try {
        ExpoSpeechRecognitionModule.abort();
      } catch {
        // Ignore cleanup abort errors
      }
    };
  }, [step.id]);

  useSpeechRecognitionEvent('start', () => {
    setRecognizing(true);
    setErrorMsg(null);
  });

  useSpeechRecognitionEvent('end', () => {
    setRecognizing(false);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcripts = event.results.map((r) => r.transcript);
    const primary = transcripts[0] ?? '';
    setLiveTranscript(primary);

    const evalRes = evaluateMandarinSpeech(transcripts, step.targetHanzi);
    setEvaluation(evalRes);

    if (event.isFinal) {
      if (evalRes.matched) {
        triggerSuccessHaptic();
        onSelectAnswer('passed');
      } else {
        triggerErrorHaptic();
      }
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setRecognizing(false);
    if (event.error === 'not-allowed') {
      setErrorMsg('Microphone permission is disabled. Allow mic access or tap Skip below.');
    } else if (event.error === 'language-not-supported') {
      setErrorMsg('Mandarin speech model (zh-CN) is unavailable on this device. You can skip below.');
    } else if (event.error === 'no-speech' || event.error === 'speech-timeout') {
      setErrorMsg('No speech detected — tap the mic and speak clearly near the microphone.');
    } else {
      setErrorMsg(`Speech error (${event.error}). Try again or tap Skip below.`);
    }
  });

  const handleToggleMic = async () => {
    if (isChecked) return;
    triggerTapHaptic();
    await stopMandarinSpeech();

    if (recognizing) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }

    try {
      const perm = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!perm.granted) {
        setErrorMsg('Microphone permission denied. Tap Skip below if you can’t speak right now.');
        return;
      }

      setLiveTranscript('');
      setEvaluation(null);
      setErrorMsg(null);

      ExpoSpeechRecognitionModule.start({
        lang: 'zh-CN',
        interimResults: true,
        maxAlternatives: 5,
        contextualStrings: [step.targetHanzi],
      });
    } catch {
      setErrorMsg('Speech recognition is unavailable here. Tap Skip below to continue.');
    }
  };

  const targetChars = Array.from(evaluation?.normalizedTarget || step.targetHanzi);

  return (
    <View style={styles.section}>
      <View style={styles.badgePill}>
        <Ionicons name="mic-outline" size={14} color={Colors.info} />
        <Text style={styles.badgeText}>Mandarin Speaking Drill</Text>
      </View>

      <Text style={styles.prompt}>{step.prompt}</Text>

      <View style={styles.audioStageCard}>
        {/* Highlight character-by-character alignment once evaluated */}
        <View style={styles.charRow}>
          {targetChars.map((ch, idx) => {
            const matched = evaluation?.charMatchedMask[idx];
            return (
              <Text
                key={`${ch}-${idx}`}
                style={[
                  styles.targetChar,
                  evaluation
                    ? matched
                      ? { color: Colors.success }
                      : { color: Colors.primary }
                    : undefined,
                ]}
              >
                {ch}
              </Text>
            );
          })}
        </View>

        <Text style={styles.targetPinyin}>{step.targetPinyin}</Text>
        <Text style={styles.targetMeaning}>&ldquo;{step.meaning}&rdquo;</Text>

        <AudioControlRow hanziText={step.targetHanzi} label="Hear Model" />

        {step.hint ? <Text style={styles.hintText}>{step.hint}</Text> : null}
      </View>

      {/* Microphone Control */}
      <View style={styles.micContainer}>
        <Pressable
          disabled={isChecked}
          onPress={handleToggleMic}
          style={[
            styles.micButton,
            recognizing && styles.micButtonActive,
            selectedAnswer === 'passed' && styles.micButtonPassed,
          ]}
        >
          <Ionicons
            name={
              selectedAnswer === 'passed'
                ? 'checkmark-circle'
                : recognizing
                  ? 'stop'
                  : 'mic'
            }
            size={28}
            color="#FFFFFF"
          />
          <Text style={styles.micButtonText}>
            {selectedAnswer === 'passed'
              ? `Great Pronunciation (${evaluation?.score ?? 100}%)`
              : recognizing
                ? 'Listening... Tap to Stop'
                : 'Tap to Speak Mandarin'}
          </Text>
        </Pressable>

        {liveTranscript ? (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>Heard:</Text>
            <Text style={styles.transcriptText}>{liveTranscript}</Text>
          </View>
        ) : null}

        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        {!isChecked && selectedAnswer !== 'passed' ? (
          <Pressable
            onPress={() => {
              triggerTapHaptic();
              if (recognizing) ExpoSpeechRecognitionModule.abort();
              onSelectAnswer('skipped');
            }}
            style={styles.skipBtn}
          >
            <Text
              style={[
                styles.skipBtnText,
                selectedAnswer === 'skipped' && { color: Colors.primary },
              ]}
            >
              {selectedAnswer === 'skipped'
                ? 'Marked as Skipped — Tap Check Answer Below'
                : 'Can’t speak right now (Skip)'}
            </Text>
          </Pressable>
        ) : null}
      </View>
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
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  audioStageCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  charRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  targetChar: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  targetPinyin: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.info,
    textAlign: 'center',
  },
  targetMeaning: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  hintText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  micContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  micButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.info,
    paddingVertical: 16,
    borderRadius: Radii.xl,
  },
  micButtonActive: {
    backgroundColor: Colors.error,
  },
  micButtonPassed: {
    backgroundColor: Colors.success,
  },
  micButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  transcriptBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  transcriptText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    textAlign: 'center',
    lineHeight: 19,
  },
  skipBtn: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  skipBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
});
