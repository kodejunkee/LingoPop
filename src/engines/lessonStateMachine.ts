import { isGradedStep, type LessonDefinition, type LessonStep } from '../curriculum/types';

export type LessonPhase = 'prompt' | 'checked' | 'summary';

export interface LessonSessionState {
  lessonId: string;
  phase: LessonPhase;
  /** Queue of step indices into lesson.steps; missed graded items are re-queued once */
  queue: number[];
  queuePosition: number;
  retriedStepIds: Record<string, boolean>;
  /** User's current selection (serialized answer key depending on step type) */
  selectedAnswer: string | null;
  isCurrentCorrect: boolean;
  combo: number;
  maxCombo: number;
  mistakesCount: number;
  totalGradedSteps: number;
  answeredCorrectlyFirstTry: Record<string, boolean>;
  xpAwarded: number;
}

export type LessonAction =
  | { type: 'SELECT_ANSWER'; answer: string }
  | { type: 'SUBMIT_CHECK'; step: LessonStep }
  | { type: 'ADVANCE'; lesson: LessonDefinition };

export function createInitialLessonState(lesson: LessonDefinition): LessonSessionState {
  const queue = lesson.steps.map((_, idx) => idx);
  const totalGradedSteps = lesson.steps.filter(isGradedStep).length;

  return {
    lessonId: lesson.id,
    phase: 'prompt',
    queue,
    queuePosition: 0,
    retriedStepIds: {},
    selectedAnswer: null,
    isCurrentCorrect: false,
    combo: 0,
    maxCombo: 0,
    mistakesCount: 0,
    totalGradedSteps,
    answeredCorrectlyFirstTry: {},
    xpAwarded: 0,
  };
}

export function evaluateStepAnswer(step: LessonStep, answer: string | null): boolean {
  if (step.type === 'concept') {
    return true;
  }
  if (!answer) {
    return false;
  }

  switch (step.type) {
    case 'tone_contour':
      return Number(answer) === step.targetTone;
    case 'minimal_pair':
      return answer === step.targetOptionId;
    case 'tone_sandhi_lab':
      return answer === step.targetOptionId;
    case 'pinyin_builder': {
      // Expected format: `${initial}|${final}|${tone}`
      const expected = `${step.targetInitial}|${step.targetFinal}|${step.targetTone}`;
      return answer === expected;
    }
    case 'stroke_trace':
      return answer === 'completed';
    case 'radical_breakdown':
    case 'stroke_order_rule':
    case 'cloze_blank':
    case 'dialogue_read':
      return answer === step.targetOptionId;
    case 'sentence_scramble':
      return answer === step.expectedTileIds.join('|');
    case 'speaking_drill':
      return answer === 'passed' || answer === 'skipped';
  }
}

export function lessonReducer(
  state: LessonSessionState,
  action: LessonAction
): LessonSessionState {
  switch (action.type) {
    case 'SELECT_ANSWER': {
      if (state.phase !== 'prompt') {
        return state;
      }
      return {
        ...state,
        selectedAnswer: action.answer,
      };
    }

    case 'SUBMIT_CHECK': {
      if (state.phase !== 'prompt') {
        return state;
      }

      const { step } = action;
      if (step.type === 'concept') {
        return state;
      }

      const correct = evaluateStepAnswer(step, state.selectedAnswer);
      const alreadyRetried = Boolean(state.retriedStepIds[step.id]);

      if (correct) {
        const nextCombo = state.combo + 1;
        const nextFirstTry = { ...state.answeredCorrectlyFirstTry };
        if (!alreadyRetried) {
          nextFirstTry[step.id] = true;
        }
        return {
          ...state,
          phase: 'checked',
          isCurrentCorrect: true,
          combo: nextCombo,
          maxCombo: Math.max(state.maxCombo, nextCombo),
          answeredCorrectlyFirstTry: nextFirstTry,
        };
      }

      // Wrong answer: reset combo and re-queue once so learner reinforces before finishing
      const currentStepIndex = state.queue[state.queuePosition];
      const nextQueue = alreadyRetried ? state.queue : [...state.queue, currentStepIndex];

      return {
        ...state,
        phase: 'checked',
        isCurrentCorrect: false,
        combo: 0,
        mistakesCount: state.mistakesCount + 1,
        queue: nextQueue,
        retriedStepIds: {
          ...state.retriedStepIds,
          [step.id]: true,
        },
      };
    }

    case 'ADVANCE': {
      const currentStepIndex = state.queue[state.queuePosition];
      const currentStep = action.lesson.steps[currentStepIndex];

      // Concept steps advance directly from 'prompt'; graded steps advance after 'checked'
      if (currentStep.type !== 'concept' && state.phase !== 'checked') {
        return state;
      }

      const nextPos = state.queuePosition + 1;
      if (nextPos >= state.queue.length) {
        const firstTryCount = Object.keys(state.answeredCorrectlyFirstTry).length;
        const accuracyRatio =
          state.totalGradedSteps > 0 ? firstTryCount / state.totalGradedSteps : 1;
        const bonus = accuracyRatio >= 0.9 ? 5 : 0;
        return {
          ...state,
          phase: 'summary',
          selectedAnswer: null,
          isCurrentCorrect: false,
          xpAwarded: action.lesson.xpReward + bonus,
        };
      }

      return {
        ...state,
        phase: 'prompt',
        queuePosition: nextPos,
        selectedAnswer: null,
        isCurrentCorrect: false,
      };
    }
  }
}

export function getAccuracyPercent(state: LessonSessionState): number {
  if (state.totalGradedSteps === 0) return 100;
  const firstTryCount = Object.keys(state.answeredCorrectlyFirstTry).length;
  return Math.round((firstTryCount / state.totalGradedSteps) * 100);
}
