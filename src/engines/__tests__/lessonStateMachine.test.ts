/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LessonDefinition } from '../../curriculum/types';
import {
  createInitialLessonState,
  evaluateStepAnswer,
  getAccuracyPercent,
  lessonReducer,
} from '../lessonStateMachine';

const MOCK_LESSON: LessonDefinition = {
  id: 'test-lesson',
  stage: 0,
  order: 1,
  title: 'Test',
  subtitle: 'Test lesson',
  estimatedMinutes: 2,
  xpReward: 20,
  goalSummary: 'Test goals',
  steps: [
    {
      id: 'c1',
      type: 'concept',
      title: 'Intro',
      body: 'Body',
      examples: [],
    },
    {
      id: 'q1',
      type: 'tone_contour',
      prompt: 'Pick tone 1',
      targetHanzi: '妈',
      targetPinyin: 'mā',
      targetBasePinyin: 'ma',
      targetTone: 1,
      meaning: 'mother',
      availableTones: [1, 2, 3, 4],
      explanation: 'Tone 1',
    },
    {
      id: 'q2',
      type: 'pinyin_builder',
      prompt: 'Build lv4',
      targetHanzi: '绿',
      targetInitial: 'l',
      targetFinal: 'ü',
      targetTone: 4,
      targetPinyin: 'lǜ',
      meaning: 'green',
      initialsPool: ['l', 'n'],
      finalsPool: ['u', 'ü'],
      tonesPool: [1, 4],
      explanation: 'lv4',
    },
  ],
};

describe('lessonStateMachine', () => {
  it('re-queues missed graded steps once and computes accuracy & XP bonus cleanly', () => {
    let state = createInitialLessonState(MOCK_LESSON);
    assert.equal(state.totalGradedSteps, 2);

    // Advance past concept c1
    state = lessonReducer(state, { type: 'ADVANCE', lesson: MOCK_LESSON });
    assert.equal(state.queuePosition, 1);

    // Miss q1 on first try
    state = lessonReducer(state, { type: 'SELECT_ANSWER', answer: '3' });
    state = lessonReducer(state, { type: 'SUBMIT_CHECK', step: MOCK_LESSON.steps[1] });
    assert.equal(state.phase, 'checked');
    assert.equal(state.isCurrentCorrect, false);
    assert.equal(state.mistakesCount, 1);
    assert.equal(state.queue.length, 4); // q1 re-queued at end

    // Advance to q2
    state = lessonReducer(state, { type: 'ADVANCE', lesson: MOCK_LESSON });
    assert.equal(state.queuePosition, 2);

    // Answer q2 correctly on first try
    state = lessonReducer(state, { type: 'SELECT_ANSWER', answer: 'l|ü|4' });
    assert.equal(evaluateStepAnswer(MOCK_LESSON.steps[2], state.selectedAnswer), true);
    state = lessonReducer(state, { type: 'SUBMIT_CHECK', step: MOCK_LESSON.steps[2] });
    assert.equal(state.isCurrentCorrect, true);
    assert.equal(state.combo, 1);

    // Advance to re-queued q1
    state = lessonReducer(state, { type: 'ADVANCE', lesson: MOCK_LESSON });
    assert.equal(state.queuePosition, 3);
    assert.equal(state.queue[state.queuePosition], 1);

    // Answer q1 correctly on retry
    state = lessonReducer(state, { type: 'SELECT_ANSWER', answer: '1' });
    state = lessonReducer(state, { type: 'SUBMIT_CHECK', step: MOCK_LESSON.steps[1] });
    assert.equal(state.isCurrentCorrect, true);
    assert.equal(state.combo, 2);

    // Advance to summary
    state = lessonReducer(state, { type: 'ADVANCE', lesson: MOCK_LESSON });
    assert.equal(state.phase, 'summary');
    // 1 of 2 answered on first try -> 50%, no bonus
    assert.equal(getAccuracyPercent(state), 50);
    assert.equal(state.xpAwarded, 20);
  });

  it('awards +5 bonus XP when accuracy is >= 90%', () => {
    let state = createInitialLessonState(MOCK_LESSON);
    state = lessonReducer(state, { type: 'ADVANCE', lesson: MOCK_LESSON });

    state = lessonReducer(state, { type: 'SELECT_ANSWER', answer: '1' });
    state = lessonReducer(state, { type: 'SUBMIT_CHECK', step: MOCK_LESSON.steps[1] });
    state = lessonReducer(state, { type: 'ADVANCE', lesson: MOCK_LESSON });

    state = lessonReducer(state, { type: 'SELECT_ANSWER', answer: 'l|ü|4' });
    state = lessonReducer(state, { type: 'SUBMIT_CHECK', step: MOCK_LESSON.steps[2] });
    state = lessonReducer(state, { type: 'ADVANCE', lesson: MOCK_LESSON });

    assert.equal(state.phase, 'summary');
    assert.equal(getAccuracyPercent(state), 100);
    assert.equal(state.xpAwarded, 25);
  });
});
