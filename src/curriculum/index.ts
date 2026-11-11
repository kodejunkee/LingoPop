import { HSK1_VOCAB, type VocabEntry } from './hsk1Vocab';
import { HSK2_3_VOCAB } from './hsk2Vocab';
import { STAGE_0_LESSONS } from './stage0';
import { STAGE_1_LESSONS } from './stage1';
import { STAGE_2_LESSONS } from './stage2';
import { STAGE_3_LESSONS } from './stage3';
import { STAGE_4_LESSONS } from './stage4';
import type { LessonDefinition } from './types';

export const ALL_LESSONS: LessonDefinition[] = [
  ...STAGE_0_LESSONS,
  ...STAGE_1_LESSONS,
  ...STAGE_2_LESSONS,
  ...STAGE_3_LESSONS,
  ...STAGE_4_LESSONS,
];

export const ALL_VOCAB: VocabEntry[] = [...HSK1_VOCAB, ...HSK2_3_VOCAB];

export function getLessonById(id: string): LessonDefinition | undefined {
  return ALL_LESSONS.find((lesson) => lesson.id === id);
}

export {
  STAGE_0_LESSONS,
  STAGE_1_LESSONS,
  STAGE_2_LESSONS,
  STAGE_3_LESSONS,
  STAGE_4_LESSONS,
};
