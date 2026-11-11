import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { scheduleOnRN } from 'react-native-worklets';

import type { HanziCharacterDef, Point } from '../curriculum/hanziData';
import { speakMandarin } from '../engines/audioService';
import {
  pointsToSvgPath,
  validateStroke,
  type StrokeValidationFailure,
} from '../engines/hanziStroke';
import {
  triggerErrorHaptic,
  triggerSuccessHaptic,
  triggerTapHaptic,
} from '../engines/haptics';
import { Colors, Radii, Spacing, ToneColors } from '../theme/tokens';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface HanziCanvasProps {
  character: HanziCharacterDef;
  size?: number;
  initialShowGuide?: boolean;
  allowGuideToggle?: boolean;
  onComplete?: (mistakesCount: number) => void;
}

const FAILURE_MESSAGES: Record<StrokeValidationFailure, string> = {
  too_short: 'Draw the full stroke smoothly from start to finish.',
  wrong_direction: 'Wrong direction! Start at the orange dot and follow the stroke.',
  wrong_position: 'Try starting closer to the orange dot and tracing the outline.',
  wrong_shape: 'Follow the stroke shape closely—tap "Demo" if you want to watch it.',
};

export function HanziCanvas(props: HanziCanvasProps) {
  return (
    <HanziCanvasSession
      key={`${props.character.char}-${props.initialShowGuide ?? true}`}
      {...props}
    />
  );
}

function HanziCanvasSession({
  character,
  size = 260,
  initialShowGuide = true,
  allowGuideToggle = true,
  onComplete,
}: HanziCanvasProps) {
  const [completedCount, setCompletedCount] = useState(0);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [showGuide, setShowGuide] = useState(initialShowGuide);
  const [replayStrokeIndex, setReplayStrokeIndex] = useState<number | null>(null);
  const replayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'neutral' | 'error' | 'success';
    text: string;
  }>({
    type: 'neutral',
    text: character.strokes[0]?.name ?? 'Trace the character',
  });

  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    };
  }, []);

  const isDone = completedCount >= character.strokes.length;
  const activeStroke = !isDone ? character.strokes[completedCount] : null;

  // Shared values updated purely on the UI thread during finger movement
  const activePathD = useSharedValue('');
  const drawnPoints = useSharedValue<Point[]>([]);
  const demoProgress = useSharedValue(0);

  const scaleToNorm = useCallback(
    (px: number, py: number): Point => {
      'worklet';
      const clampedX = Math.max(0, Math.min(100, (px / size) * 100));
      const clampedY = Math.max(0, Math.min(100, (py / size) * 100));
      return { x: clampedX, y: clampedY };
    },
    [size]
  );

  const handleStrokeFinished = useCallback(
    (points: Point[]) => {
      if (isDone || !activeStroke) return;

      const result = validateStroke(points, activeStroke.points);
      if (result.matched) {
        const nextCount = completedCount + 1;
        setCompletedCount(nextCount);

        if (nextCount >= character.strokes.length) {
          triggerSuccessHaptic();
          speakMandarin(character.char);
          setFeedback({
            type: 'success',
            text: `Great! ${character.char} (${character.pinyin}) completed in proper stroke order.`,
          });
          onComplete?.(mistakesCount);
        } else {
          triggerTapHaptic();
          setFeedback({
            type: 'neutral',
            text: character.strokes[nextCount].name,
          });
        }
      } else {
        triggerErrorHaptic();
        setMistakesCount((prev) => prev + 1);
        const reasonText = result.failureReason
          ? FAILURE_MESSAGES[result.failureReason]
          : activeStroke.hint;
        setFeedback({
          type: 'error',
          text:
            result.failureReason === 'wrong_direction'
              ? `${activeStroke.hint} (${FAILURE_MESSAGES.wrong_direction})`
              : reasonText,
        });
      }
    },
    [isDone, activeStroke, completedCount, character, mistakesCount, onComplete]
  );

  const panGesture = usePanGesture({
    minDistance: 0,
    enabled: !isDone,
    onBegin: (event) => {
      'worklet';
      const norm = scaleToNorm(event.x, event.y);
      drawnPoints.value = [norm];
      activePathD.value = `M ${event.x.toFixed(1)} ${event.y.toFixed(1)}`;
    },
    onUpdate: (event) => {
      'worklet';
      const norm = scaleToNorm(event.x, event.y);
      drawnPoints.value = [...drawnPoints.value, norm];
      activePathD.value = `${activePathD.value} L ${event.x.toFixed(1)} ${event.y.toFixed(1)}`;
    },
    onFinalize: () => {
      'worklet';
      const snapshot = drawnPoints.value;
      activePathD.value = '';
      drawnPoints.value = [];
      if (snapshot.length >= 2) {
        scheduleOnRN(handleStrokeFinished, snapshot);
      }
    },
  });

  const liveStrokeProps = useAnimatedProps(() => ({
    d: activePathD.value,
  }));

  const demoStrokeProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - demoProgress.value) * 300,
    opacity: demoProgress.value > 0 && demoProgress.value < 1 ? 0.9 : 0,
  }));

  const triggerDemo = () => {
    if (!activeStroke) return;
    triggerTapHaptic();
    demoProgress.value = 0;
    demoProgress.value = withTiming(1, { duration: 750 });
  };

  const triggerPlayAll = () => {
    if (character.strokes.length === 0) return;
    triggerTapHaptic();
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);

    const stepStroke = (idx: number) => {
      if (idx >= character.strokes.length) {
        setReplayStrokeIndex(null);
        return;
      }
      setReplayStrokeIndex(idx);
      demoProgress.value = 0;
      demoProgress.value = withTiming(1, { duration: 680 });
      replayTimerRef.current = setTimeout(() => {
        stepStroke(idx + 1);
      }, 760);
    };

    stepStroke(0);
  };

  const resetCanvas = () => {
    triggerTapHaptic();
    if (replayTimerRef.current) clearTimeout(replayTimerRef.current);
    setReplayStrokeIndex(null);
    setCompletedCount(0);
    setMistakesCount(0);
    setFeedback({
      type: 'neutral',
      text: character.strokes[0]?.name ?? 'Trace the character',
    });
  };

  const strokePaths = useMemo(
    () => character.strokes.map((s) => pointsToSvgPath(s.points, size)),
    [character.strokes, size]
  );

  const activeStartPixel = useMemo(() => {
    if (!activeStroke || activeStroke.points.length === 0) return null;
    const p = activeStroke.points[0];
    return { x: (p.x / 100) * size, y: (p.y / 100) * size };
  }, [activeStroke, size]);

  return (
    <View style={styles.wrapper}>
      {/* Character Header */}
      <View style={styles.headerRow}>
        <View style={styles.charInfo}>
          <Text style={styles.hanziTitle}>{character.char}</Text>
          <View>
            <Text style={[styles.pinyinText, { color: ToneColors[character.tone] }]}>
              {character.pinyin}
            </Text>
            <Text style={styles.meaningText}>{character.meaning}</Text>
          </View>
        </View>

        <View style={styles.strokeProgressPill}>
          <Text style={styles.strokeProgressText}>
            Stroke {Math.min(completedCount + (isDone ? 0 : 1), character.strokes.length)} /{' '}
            {character.strokes.length}
          </Text>
        </View>
      </View>

      {/* Traditional Tianzige Writing Square */}
      <GestureDetector gesture={panGesture}>
        <View style={[styles.canvasFrame, { width: size, height: size }]}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {/* Rice-grid dashed guidelines */}
            <Line
              x1={size / 2}
              y1={0}
              x2={size / 2}
              y2={size}
              stroke="#E2E8F0"
              strokeWidth={1.5}
              strokeDasharray="6 6"
            />
            <Line
              x1={0}
              y1={size / 2}
              x2={size}
              y2={size / 2}
              stroke="#E2E8F0"
              strokeWidth={1.5}
              strokeDasharray="6 6"
            />
            <Line
              x1={0}
              y1={0}
              x2={size}
              y2={size}
              stroke="#F1F5F9"
              strokeWidth={1}
              strokeDasharray="5 5"
            />
            <Line
              x1={size}
              y1={0}
              x2={0}
              y2={size}
              stroke="#F1F5F9"
              strokeWidth={1}
              strokeDasharray="5 5"
            />

            {/* Ghost template strokes */}
            {showGuide &&
              strokePaths.map((d, idx) => {
                if (idx < completedCount) return null;
                const isActive = idx === completedCount;
                return (
                  <Path
                    key={`ghost-${idx}`}
                    d={d}
                    stroke={isActive ? '#FF6B3540' : '#E2E8F0'}
                    strokeWidth={size * 0.065}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                );
              })}

            {/* Animated Demo / Play-All Ghost Stroke */}
            {replayStrokeIndex !== null ? (
              <>
                {strokePaths.slice(0, replayStrokeIndex).map((d, idx) => (
                  <Path
                    key={`replay-done-${idx}`}
                    d={d}
                    stroke="#3A86FF"
                    strokeWidth={size * 0.062}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                ))}
                <AnimatedPath
                  d={strokePaths[replayStrokeIndex]}
                  stroke={Colors.primary}
                  strokeWidth={size * 0.065}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="300 300"
                  fill="none"
                  animatedProps={demoStrokeProps}
                />
              </>
            ) : activeStroke ? (
              <AnimatedPath
                d={strokePaths[completedCount]}
                stroke={Colors.primary}
                strokeWidth={size * 0.055}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="300 300"
                fill="none"
                animatedProps={demoStrokeProps}
              />
            ) : null}

            {/* Already Completed Ink Strokes */}
            {replayStrokeIndex === null &&
              strokePaths.slice(0, completedCount).map((d, idx) => (
                <Path
                  key={`done-${idx}`}
                  d={d}
                  stroke="#0F172A"
                  strokeWidth={size * 0.072}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}

            {/* Active Start Dot Cue with Stroke Order Number */}
            {showGuide && activeStartPixel && !isDone && replayStrokeIndex === null ? (
              <>
                <Circle
                  cx={activeStartPixel.x}
                  cy={activeStartPixel.y}
                  r={10}
                  fill={Colors.primary}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                <SvgText
                  x={activeStartPixel.x}
                  y={activeStartPixel.y + 4}
                  fontSize="11"
                  fontWeight="800"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  {completedCount + 1}
                </SvgText>
              </>
            ) : null}

            {/* Live Finger Trail (UI thread worklet) */}
            <AnimatedPath
              stroke="#1E293B"
              strokeWidth={size * 0.075}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              animatedProps={liveStrokeProps}
            />
          </Svg>
        </View>
      </GestureDetector>

      {/* Feedback Banner */}
      <View
        style={[
          styles.feedbackPill,
          feedback.type === 'error' && styles.feedbackError,
          feedback.type === 'success' && styles.feedbackSuccess,
        ]}
      >
        <Ionicons
          name={
            feedback.type === 'success'
              ? 'checkmark-circle'
              : feedback.type === 'error'
                ? 'alert-circle'
                : 'brush-outline'
          }
          size={17}
          color={
            feedback.type === 'success'
              ? Colors.success
              : feedback.type === 'error'
                ? Colors.error
                : Colors.textSecondary
          }
        />
        <Text
          style={[
            styles.feedbackText,
            feedback.type === 'error' && { color: Colors.error },
            feedback.type === 'success' && { color: Colors.success },
          ]}
        >
          {feedback.text}
        </Text>
      </View>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable onPress={triggerDemo} disabled={isDone} style={styles.toolBtn}>
          <Ionicons
            name="play-circle-outline"
            size={18}
            color={isDone ? Colors.textMuted : Colors.primary}
          />
          <Text style={[styles.toolText, isDone && { color: Colors.textMuted }]}>
            Hint
          </Text>
        </Pressable>

        <Pressable onPress={triggerPlayAll} style={styles.toolBtn}>
          <Ionicons name="film-outline" size={18} color={Colors.info} />
          <Text style={[styles.toolText, { color: Colors.info }]}>Play All</Text>
        </Pressable>

        {allowGuideToggle ? (
          <Pressable
            onPress={() => {
              triggerTapHaptic();
              setShowGuide((prev) => !prev);
            }}
            style={styles.toolBtn}
          >
            <Ionicons
              name={showGuide ? 'eye-outline' : 'eye-off-outline'}
              size={18}
              color={Colors.textPrimary}
            />
            <Text style={styles.toolText}>{showGuide ? 'Guide On' : 'Memory Mode'}</Text>
          </Pressable>
        ) : null}

        <Pressable onPress={resetCanvas} style={styles.toolBtn}>
          <Ionicons name="refresh" size={18} color={Colors.textPrimary} />
          <Text style={styles.toolText}>Reset</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  charInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  hanziTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  pinyinText: {
    fontSize: 17,
    fontWeight: '800',
  },
  meaningText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  strokeProgressPill: {
    backgroundColor: Colors.surfaceMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radii.pill,
  },
  strokeProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  canvasFrame: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radii.xl,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  feedbackPill: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  feedbackError: {
    backgroundColor: Colors.errorSoft,
    borderColor: '#FECACA',
  },
  feedbackSuccess: {
    backgroundColor: Colors.successSoft,
    borderColor: '#BBF7D0',
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  toolbar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radii.pill,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
});
