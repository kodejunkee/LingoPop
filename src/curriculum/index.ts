import { HSK1_LESSONS } from './hsk1';
import { HSK1_VOCAB, type VocabEntry } from './hsk1Vocab';
import { HSK2_LESSONS } from './hsk2';
import { HSK2_3_VOCAB } from './hsk2Vocab';
import { HSK3_LESSONS } from './hsk3';
import { HSK4_LESSONS } from './hsk4';
import { HSK5_LESSONS } from './hsk5';
import { HSK6_LESSONS } from './hsk6';
import { HSK7_9_LESSONS } from './hsk7_9';
import { HSK4_5_LESSONS } from './hsk4_5';
import { HSK6_9_LESSONS } from './hsk6_9';
import { STAGE_5_6_VOCAB } from './hskAdvancedVocab';
import type { LessonDefinition } from './types';

export const ALL_LESSONS: LessonDefinition[] = [
  ...HSK1_LESSONS,
  ...HSK2_LESSONS,
  ...HSK3_LESSONS,
  ...HSK4_LESSONS,
  ...HSK5_LESSONS,
  ...HSK6_LESSONS,
  ...HSK7_9_LESSONS,
];

export const ALL_VOCAB: VocabEntry[] = [...HSK1_VOCAB, ...HSK2_3_VOCAB, ...STAGE_5_6_VOCAB];

export function getLessonById(id: string): LessonDefinition | undefined {
  return ALL_LESSONS.find((lesson) => lesson.id === id);
}

export {
  HSK1_LESSONS,
  HSK2_LESSONS,
  HSK3_LESSONS,
  HSK4_LESSONS,
  HSK5_LESSONS,
  HSK6_LESSONS,
  HSK7_9_LESSONS,
  HSK4_5_LESSONS,
  HSK6_9_LESSONS,
};

// Aliases for backwards compatibility with any legacy test references
export const STAGE_0_LESSONS = HSK1_LESSONS.slice(0, 2);
export const STAGE_1_LESSONS = HSK1_LESSONS;
export const STAGE_2_LESSONS = HSK2_LESSONS;
export const STAGE_3_LESSONS = HSK3_LESSONS;
export const STAGE_4_LESSONS = HSK4_LESSONS;
export const STAGE_5_LESSONS = HSK5_LESSONS;
export const STAGE_6_LESSONS = HSK6_LESSONS;
export const STAGE_7_LESSONS = HSK7_9_LESSONS;
