import type { ToneNumber } from '../theme/tokens';

export interface SoundExample {
  hanzi: string;
  pinyin: string;
  tone: ToneNumber;
  meaning: string;
  note?: string;
}

export interface ConceptStep {
  id: string;
  type: 'concept';
  title: string;
  body: string;
  tip?: string;
  examples: SoundExample[];
}

export interface ToneContourStep {
  id: string;
  type: 'tone_contour';
  prompt: string;
  targetHanzi: string;
  targetPinyin: string;
  targetBasePinyin: string;
  targetTone: ToneNumber;
  meaning: string;
  availableTones: ToneNumber[];
  explanation: string;
}

export interface MinimalPairOption {
  id: string;
  hanzi: string;
  pinyin: string;
  tone: ToneNumber;
  meaning: string;
  hint?: string;
}

export interface MinimalPairStep {
  id: string;
  type: 'minimal_pair';
  prompt: string;
  targetOptionId: string;
  options: MinimalPairOption[];
  explanation: string;
}

export interface ToneSandhiOption {
  id: string;
  spokenPinyin: string;
  tonePatternLabel: string;
}

export interface ToneSandhiStep {
  id: string;
  type: 'tone_sandhi_lab';
  prompt: string;
  hanziPhrase: string;
  writtenPinyin: string;
  meaning: string;
  targetOptionId: string;
  options: ToneSandhiOption[];
  explanation: string;
}

export interface PinyinBuilderStep {
  id: string;
  type: 'pinyin_builder';
  prompt: string;
  targetHanzi: string;
  targetInitial: string;
  targetFinal: string;
  targetTone: ToneNumber;
  targetPinyin: string;
  meaning: string;
  initialsPool: string[];
  finalsPool: string[];
  tonesPool: ToneNumber[];
  explanation: string;
}

export interface StrokeTraceStep {
  id: string;
  type: 'stroke_trace';
  prompt: string;
  targetChar: string;
  showGuide?: boolean;
  explanation: string;
}

export interface RadicalOption {
  id: string;
  label: string;
  sublabel?: string;
}

export interface RadicalBreakdownStep {
  id: string;
  type: 'radical_breakdown';
  prompt: string;
  targetChar: string;
  pinyin: string;
  tone: ToneNumber;
  meaning: string;
  radicalPart: string;
  otherPart: string;
  targetOptionId: string;
  options: RadicalOption[];
  explanation: string;
}

export interface StrokeOrderRuleStep {
  id: string;
  type: 'stroke_order_rule';
  prompt: string;
  targetChar: string;
  pinyin: string;
  tone: ToneNumber;
  meaning: string;
  targetOptionId: string;
  options: RadicalOption[];
  explanation: string;
}

export interface SentenceTile {
  id: string;
  hanzi: string;
  pinyin: string;
}

export interface SentenceScrambleStep {
  id: string;
  type: 'sentence_scramble';
  prompt: string;
  englishPrompt: string;
  targetHanziSentence: string;
  expectedTileIds: string[];
  tiles: SentenceTile[];
  explanation: string;
}

export interface ClozeBlankStep {
  id: string;
  type: 'cloze_blank';
  prompt: string;
  sentenceBefore: string;
  sentenceAfter: string;
  pinyinHint: string;
  englishTranslation: string;
  fullTargetSentence: string;
  targetOptionId: string;
  options: RadicalOption[];
  explanation: string;
}

export interface DialogueLine {
  speaker: string;
  hanzi: string;
  pinyin: string;
  english: string;
}

export interface DialogueReadStep {
  id: string;
  type: 'dialogue_read';
  prompt: string;
  sceneTitle: string;
  lines: DialogueLine[];
  question: string;
  targetOptionId: string;
  options: RadicalOption[];
  explanation: string;
}

export interface SpeakingDrillStep {
  id: string;
  type: 'speaking_drill';
  prompt: string;
  targetHanzi: string;
  targetPinyin: string;
  meaning: string;
  hint?: string;
  explanation: string;
}

export type LessonStep =
  | ConceptStep
  | ToneContourStep
  | MinimalPairStep
  | ToneSandhiStep
  | PinyinBuilderStep
  | StrokeTraceStep
  | RadicalBreakdownStep
  | StrokeOrderRuleStep
  | SentenceScrambleStep
  | ClozeBlankStep
  | DialogueReadStep
  | SpeakingDrillStep;

export interface LessonDefinition {
  id: string;
  stage: number;
  order: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  xpReward: number;
  goalSummary: string;
  /** Vocabulary items enrolled into FSRS spaced repetition upon completing this lesson */
  vocabRewards?: string[];
  steps: LessonStep[];
}

export function isGradedStep(step: LessonStep): boolean {
  return step.type !== 'concept';
}
