import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LessonExerciseView } from '@/components/LessonExerciseView';
import { getLessonById } from '@/curriculum';
import type { LessonStep } from '@/curriculum/types';
import { speakMandarin, stopMandarinSpeech } from '@/engines/audioService';
import {
  triggerErrorHaptic,
  triggerSuccessHaptic,
  triggerTapHaptic,
} from '@/engines/haptics';
import {
  createInitialLessonState,
  evaluateStepAnswer,
  getAccuracyPercent,
  lessonReducer,
} from '@/engines/lessonStateMachine';
import { recordLessonCompletion } from '@/storage/progress';
import { Colors, Radii, Spacing } from '@/theme/tokens';

function getStepTargetAudioText(step: LessonStep): string | null {
  switch (step.type) {
    case 'tone_contour':
      return step.targetHanzi;
    case 'minimal_pair':
      return (
        step.options.find((o) => o.id === step.targetOptionId)?.hanzi ?? null
      );
    case 'pinyin_builder':
      return step.targetHanzi;
    default:
      return null;
  }
}

function isSelectionReady(step: LessonStep, selected: string | null): boolean {
  if (step.type === 'concept') return true;
  if (!selected) return false;
  if (step.type === 'pinyin_builder') {
    const parts = selected.split('|');
    return Boolean(parts[0] && parts[1] && parts[2]);
  }
  return true;
}

export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const lesson = useMemo(() => getLessonById(id ?? ''), [id]);

  if (!lesson) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>Lesson not found</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.back()}>
            <Text style={styles.primaryButtonText}>Back to Roadmap</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return <LessonSessionRunner lesson={lesson} />;
}

function LessonSessionRunner({
  lesson,
}: {
  lesson: NonNullable<ReturnType<typeof getLessonById>>;
}) {
  const [state, dispatch] = useReducer(
    lessonReducer,
    lesson,
    createInitialLessonState
  );
  const [savedStats, setSavedStats] = useState<{
    totalXp: number;
    streakDays: number;
    enrolledCount: number;
  } | null>(null);
  const hasRecordedRef = useRef(false);

  const currentStepIndex = state.queue[state.queuePosition] ?? 0;
  const currentStep = lesson.steps[currentStepIndex];

  // Auto-play audio prompt when entering listening steps, and clean up on unmount
  useEffect(() => {
    if (state.phase !== 'prompt' || !currentStep) {
      return;
    }
    const audioText = getStepTargetAudioText(currentStep);
    if (audioText) {
      const timer = setTimeout(() => {
        speakMandarin(audioText);
      }, 220);
      return () => {
        clearTimeout(timer);
        stopMandarinSpeech();
      };
    }
    return () => {
      stopMandarinSpeech();
    };
  }, [state.phase, state.queuePosition, currentStep]);

  // Persist completion once when reaching summary
  useEffect(() => {
    if (state.phase !== 'summary' || hasRecordedRef.current) {
      return;
    }
    hasRecordedRef.current = true;
    const accuracy = getAccuracyPercent(state);
    recordLessonCompletion(
      lesson.id,
      accuracy,
      state.xpAwarded,
      lesson.vocabRewards ?? []
    )
      .then((res) => setSavedStats(res))
      .catch((err) => console.warn('Failed to save lesson progress:', err));
  }, [state, lesson.id, lesson.vocabRewards]);

  // Ensure speech stops when user leaves the screen
  useEffect(() => {
    return () => {
      stopMandarinSpeech();
    };
  }, []);

  if (state.phase === 'summary') {
    const accuracy = getAccuracyPercent(state);
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.summaryContainer}>
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={52} color="#FFB703" />
          </View>
          <Text style={styles.summaryTitle}>Lesson Complete!</Text>
          <Text style={styles.summarySubtitle}>{lesson.title}</Text>

          <View style={styles.summaryStatsRow}>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatValue}>+{state.xpAwarded}</Text>
              <Text style={styles.summaryStatLabel}>XP Earned</Text>
            </View>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatValue}>{accuracy}%</Text>
              <Text style={styles.summaryStatLabel}>Accuracy</Text>
            </View>
            <View style={styles.summaryStatBox}>
              <Text style={styles.summaryStatValue}>{state.maxCombo}x</Text>
              <Text style={styles.summaryStatLabel}>Best Combo</Text>
            </View>
          </View>

          {savedStats ? (
            <View style={{ alignItems: 'center', gap: Spacing.sm }}>
              <View style={styles.streakBanner}>
                <Ionicons name="flame" size={20} color={Colors.primary} />
                <Text style={styles.streakBannerText}>
                  {savedStats.streakDays}-day streak · {savedStats.totalXp} Total XP
                </Text>
              </View>
              {savedStats.enrolledCount > 0 ? (
                <Text style={styles.enrolledNote}>
                  +{savedStats.enrolledCount} new words added to Daily FSRS Review!
                </Text>
              ) : null}
            </View>
          ) : null}

          <Pressable
            onPress={() => {
              triggerTapHaptic();
              router.back();
            }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Continue Roadmap</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const progressRatio = (state.queuePosition + 1) / state.queue.length;
  const isRetriedItem = Boolean(
    currentStep && state.retriedStepIds[currentStep.id] && state.phase === 'prompt'
  );
  const canCheck = currentStep
    ? isSelectionReady(currentStep, state.selectedAnswer)
    : false;

  const handlePrimaryPress = () => {
    if (!currentStep) return;

    if (currentStep.type === 'concept' || state.phase === 'checked') {
      triggerTapHaptic();
      stopMandarinSpeech();
      dispatch({ type: 'ADVANCE', lesson });
      return;
    }

    // Evaluate graded prompt
    const willBeCorrect = evaluateStepAnswer(currentStep, state.selectedAnswer);
    dispatch({ type: 'SUBMIT_CHECK', step: currentStep });

    if (willBeCorrect) {
      triggerSuccessHaptic();
    } else {
      triggerErrorHaptic();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Progress Bar */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            stopMandarinSpeech();
            router.back();
          }}
          hitSlop={10}
          accessibilityLabel="Exit lesson"
        >
          <Ionicons name="close" size={26} color={Colors.textSecondary} />
        </Pressable>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.round(progressRatio * 100))}%` },
            ]}
          />
        </View>

        <View style={styles.comboPill}>
          <Ionicons name="flame" size={14} color={Colors.primary} />
          <Text style={styles.comboText}>{state.combo}</Text>
        </View>
      </View>

      {isRetriedItem ? (
        <View style={styles.retryBanner}>
          <Ionicons name="refresh" size={14} color={Colors.primary} />
          <Text style={styles.retryText}>Reviewing one you missed earlier</Text>
        </View>
      ) : null}

      {/* Scrollable Exercise Stage */}
      <ScrollView
        scrollEnabled={currentStep?.type !== 'stroke_trace'}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep ? (
          <LessonExerciseView
            step={currentStep}
            selectedAnswer={state.selectedAnswer}
            isChecked={state.phase === 'checked'}
            isCorrect={state.isCurrentCorrect}
            onSelectAnswer={(answer) =>
              dispatch({ type: 'SELECT_ANSWER', answer })
            }
          />
        ) : null}
      </ScrollView>

      {/* Bottom Feedback & Action Footer */}
      <View
        style={[
          styles.footer,
          state.phase === 'checked' &&
            (state.isCurrentCorrect ? styles.footerCorrect : styles.footerWrong),
        ]}
      >
        {state.phase === 'checked' && currentStep && currentStep.type !== 'concept' ? (
          <View style={styles.feedbackBox}>
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={state.isCurrentCorrect ? 'checkmark-circle' : 'information-circle'}
                size={22}
                color={state.isCurrentCorrect ? Colors.success : Colors.error}
              />
              <Text
                style={[
                  styles.feedbackTitle,
                  { color: state.isCurrentCorrect ? Colors.success : Colors.error },
                ]}
              >
                {state.isCurrentCorrect
                  ? 'Spot on!'
                  : 'Not quite — we’ll revisit this soon'}
              </Text>
            </View>
            <Text style={styles.feedbackExplanation}>{currentStep.explanation}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={currentStep?.type !== 'concept' && state.phase === 'prompt' && !canCheck}
          onPress={handlePrimaryPress}
          style={[
            styles.primaryButton,
            currentStep?.type !== 'concept' &&
              state.phase === 'prompt' &&
              !canCheck &&
              styles.primaryButtonDisabled,
            state.phase === 'checked' &&
              !state.isCurrentCorrect &&
              styles.retryActionButton,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {currentStep?.type === 'concept'
              ? 'Got It, Continue'
              : state.phase === 'checked'
                ? 'Continue'
                : currentStep?.type === 'stroke_trace'
                  ? canCheck
                    ? 'Verify Writing'
                    : 'Trace All Strokes Above'
                  : currentStep?.type === 'speaking_drill' && !canCheck
                    ? 'Speak Above or Skip'
                    : 'Check Answer'}
          </Text>
        </Pressable>
      </View>
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
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  progressTrack: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: Radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radii.pill,
  },
  comboPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radii.pill,
  },
  comboText: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.primary,
  },
  retryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    backgroundColor: Colors.primarySoft,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  footer: {
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  footerCorrect: {
    backgroundColor: Colors.successSoft,
    borderTopColor: '#BBF7D0',
  },
  footerWrong: {
    backgroundColor: Colors.errorSoft,
    borderTopColor: '#FECACA',
  },
  feedbackBox: {
    gap: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  feedbackExplanation: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.lg,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#CBD5E1',
  },
  retryActionButton: {
    backgroundColor: Colors.error,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  summaryContainer: {
    flex: 1,
    padding: Spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  trophyCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFE082',
  },
  summaryTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summarySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  summaryStatBox: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
  },
  summaryStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primarySoft,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.pill,
  },
  streakBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  enrolledNote: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
