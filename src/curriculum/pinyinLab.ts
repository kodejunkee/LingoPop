import type { ToneNumber } from '../theme/tokens';

export interface LabToneVariant {
  tone: ToneNumber;
  pinyin: string;
  hanzi: string;
  meaning: string;
}

export interface LabSyllableEntry {
  base: string;
  category: 'core_tones' | 'vowels' | 'aspirated' | 'palatal' | 'retroflex' | 'dental';
  notes: string;
  variants: LabToneVariant[];
}

export const LAB_CATEGORIES: { id: LabSyllableEntry['category']; title: string; desc: string }[] = [
  { id: 'core_tones', title: 'Core Tones', desc: 'Classic 4-tone contrasts' },
  { id: 'vowels', title: 'Tricky Vowels', desc: 'e ("uh"), u vs ü' },
  { id: 'aspirated', title: 'b/p · d/t · g/k', desc: 'No puff vs puff of air' },
  { id: 'palatal', title: 'j / q / x', desc: 'Smile + tongue behind lower teeth' },
  { id: 'retroflex', title: 'zh / ch / sh / r', desc: 'Tongue tip curled upward' },
  { id: 'dental', title: 'z / c / s', desc: 'Tongue flat behind top teeth' },
];

export const PINYIN_LAB_DATA: LabSyllableEntry[] = [
  {
    base: 'ma',
    category: 'core_tones',
    notes: 'The classic 5-tone demonstration syllable.',
    variants: [
      { tone: 1, pinyin: 'mā', hanzi: '妈', meaning: 'mother' },
      { tone: 2, pinyin: 'má', hanzi: '麻', meaning: 'hemp' },
      { tone: 3, pinyin: 'mǎ', hanzi: '马', meaning: 'horse' },
      { tone: 4, pinyin: 'mà', hanzi: '骂', meaning: 'scold' },
      { tone: 5, pinyin: 'ma', hanzi: '吗', meaning: 'question tag' },
    ],
  },
  {
    base: 'ba',
    category: 'core_tones',
    notes: 'Unaspirated b (like p in "spin") across tones.',
    variants: [
      { tone: 1, pinyin: 'bā', hanzi: '八', meaning: 'eight' },
      { tone: 2, pinyin: 'bá', hanzi: '拔', meaning: 'pull out' },
      { tone: 3, pinyin: 'bǎ', hanzi: '把', meaning: 'hold / grasp' },
      { tone: 4, pinyin: 'bà', hanzi: '爸', meaning: 'dad' },
    ],
  },
  {
    base: 'e',
    category: 'vowels',
    notes: 'Back unrounded vowel ("uh"), never English "eh".',
    variants: [
      { tone: 1, pinyin: 'ē', hanzi: '阿', meaning: 'prefix / flatter' },
      { tone: 2, pinyin: 'é', hanzi: '鹅', meaning: 'goose' },
      { tone: 3, pinyin: 'ě', hanzi: '恶', meaning: 'nauseous' },
      { tone: 4, pinyin: 'è', hanzi: '饿', meaning: 'hungry' },
    ],
  },
  {
    base: 'lü / lu',
    category: 'vowels',
    notes: 'Compare ü (tight rounded "ee") vs u (regular "oo").',
    variants: [
      { tone: 3, pinyin: 'lǚ', hanzi: '旅', meaning: 'travel' },
      { tone: 4, pinyin: 'lǜ', hanzi: '绿', meaning: 'green' },
      { tone: 3, pinyin: 'lǔ', hanzi: '鲁', meaning: 'rude / Shandong' },
      { tone: 4, pinyin: 'lù', hanzi: '路', meaning: 'road' },
    ],
  },
  {
    base: 'pa',
    category: 'aspirated',
    notes: 'Strong burst of air on p (contrast with bā).',
    variants: [
      { tone: 1, pinyin: 'pā', hanzi: '趴', meaning: 'lie down' },
      { tone: 2, pinyin: 'pá', hanzi: '爬', meaning: 'climb' },
      { tone: 4, pinyin: 'pà', hanzi: '怕', meaning: 'afraid' },
    ],
  },
  {
    base: 'da / ta',
    category: 'aspirated',
    notes: 'Unaspirated d vs breathy t.',
    variants: [
      { tone: 3, pinyin: 'dǎ', hanzi: '打', meaning: 'hit / call' },
      { tone: 4, pinyin: 'dà', hanzi: '大', meaning: 'big' },
      { tone: 1, pinyin: 'tā', hanzi: '他', meaning: 'he / him' },
      { tone: 4, pinyin: 'tà', hanzi: '踏', meaning: 'step' },
    ],
  },
  {
    base: 'ge / ke',
    category: 'aspirated',
    notes: 'Unaspirated g vs breathy k.',
    variants: [
      { tone: 1, pinyin: 'gē', hanzi: '哥', meaning: 'older brother' },
      { tone: 4, pinyin: 'gè', hanzi: '个', meaning: 'general measure word' },
      { tone: 1, pinyin: 'kē', hanzi: '科', meaning: 'branch / subject' },
      { tone: 4, pinyin: 'kè', hanzi: '课', meaning: 'class / lesson' },
    ],
  },
  {
    base: 'ji / qi / xi',
    category: 'palatal',
    notes: 'Smile and anchor tongue behind lower teeth.',
    variants: [
      { tone: 1, pinyin: 'jī', hanzi: '机', meaning: 'machine' },
      { tone: 1, pinyin: 'qī', hanzi: '七', meaning: 'seven' },
      { tone: 1, pinyin: 'xī', hanzi: '西', meaning: 'west' },
      { tone: 4, pinyin: 'xiè', hanzi: '谢', meaning: 'thank' },
    ],
  },
  {
    base: 'zhi / chi / shi / ri',
    category: 'retroflex',
    notes: 'Curl tongue tip up; "i" here is a buzzed continuation of the consonant.',
    variants: [
      { tone: 1, pinyin: 'zhī', hanzi: '知', meaning: 'know' },
      { tone: 1, pinyin: 'chī', hanzi: '吃', meaning: 'eat' },
      { tone: 1, pinyin: 'shī', hanzi: '师', meaning: 'teacher' },
      { tone: 4, pinyin: 'rì', hanzi: '日', meaning: 'sun / day' },
    ],
  },
  {
    base: 'zao / cai / si',
    category: 'dental',
    notes: 'Flat tongue behind top teeth: z="ds", c="ts", s="s".',
    variants: [
      { tone: 3, pinyin: 'zǎo', hanzi: '早', meaning: 'early' },
      { tone: 4, pinyin: 'cài', hanzi: '菜', meaning: 'dish / vegetable' },
      { tone: 1, pinyin: 'sān', hanzi: '三', meaning: 'three' },
      { tone: 4, pinyin: 'sì', hanzi: '四', meaning: 'four' },
    ],
  },
];
