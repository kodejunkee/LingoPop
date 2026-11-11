import type { ToneNumber } from '../theme/tokens';

const TONE_MARKS: Record<string, [string, string, string, string, string]> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
  A: ['Ā', 'Á', 'Ǎ', 'À', 'A'],
  E: ['Ē', 'É', 'Ě', 'È', 'E'],
  I: ['Ī', 'Í', 'Ǐ', 'Ì', 'I'],
  O: ['Ō', 'Ó', 'Ǒ', 'Ò', 'O'],
  U: ['Ū', 'Ú', 'Ǔ', 'Ù', 'U'],
  Ü: ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü'],
};

const MARK_TO_BASE: Record<string, { base: string; tone: ToneNumber }> = {};
for (const [base, forms] of Object.entries(TONE_MARKS)) {
  forms.forEach((char, idx) => {
    const tone = (idx + 1) as ToneNumber;
    if (tone !== 5) {
      MARK_TO_BASE[char] = { base, tone };
    }
  });
}

/**
 * Converts numbered pinyin (e.g. "hao3", "lv4", "ni3") into tone-marked pinyin ("hǎo", "lǜ", "nǐ").
 * Follows standard Mandarin tone-mark placement rules:
 * 1. 'a' or 'e' always takes the tone mark.
 * 2. 'ou' puts the mark on 'o'.
 * 3. Otherwise, the final vowel in the syllable takes the mark.
 */
export function numberedToMarkedPinyin(numbered: string): string {
  const normalized = numbered.trim().replace(/u:|v/gi, (match) =>
    match === 'V' || match === 'U:' ? 'Ü' : 'ü'
  );
  const match = /^([a-zA-ZüÜ]+)([1-5])?$/.exec(normalized);
  if (!match) {
    return normalized;
  }

  const [, rawSyllable, toneStr] = match;
  const tone = (toneStr ? Number(toneStr) : 5) as ToneNumber;
  if (tone === 5) {
    return rawSyllable;
  }

  const lower = rawSyllable.toLowerCase();
  let targetIndex = -1;

  if (lower.includes('a')) {
    targetIndex = lower.indexOf('a');
  } else if (lower.includes('e')) {
    targetIndex = lower.indexOf('e');
  } else if (lower.includes('ou')) {
    targetIndex = lower.indexOf('o');
  } else {
    for (let i = lower.length - 1; i >= 0; i--) {
      if ('iouü'.includes(lower[i])) {
        targetIndex = i;
        break;
      }
    }
  }

  if (targetIndex === -1) {
    return rawSyllable;
  }

  const vowel = rawSyllable[targetIndex];
  const replacement = TONE_MARKS[vowel]?.[tone - 1] ?? vowel;
  return (
    rawSyllable.slice(0, targetIndex) +
    replacement +
    rawSyllable.slice(targetIndex + 1)
  );
}

/**
 * Extracts the tone number (1-5) from a single marked pinyin syllable.
 */
export function getToneFromPinyin(syllable: string): ToneNumber {
  for (const ch of syllable) {
    const entry = MARK_TO_BASE[ch];
    if (entry) {
      return entry.tone;
    }
  }
  return 5;
}

/**
 * Strips tone marks from a marked syllable and returns base letters + tone number.
 */
export function stripToneMarks(syllable: string): { base: string; tone: ToneNumber } {
  let tone: ToneNumber = 5;
  let base = '';
  for (const ch of syllable) {
    const entry = MARK_TO_BASE[ch];
    if (entry) {
      tone = entry.tone;
      base += entry.base;
    } else {
      base += ch;
    }
  }
  return { base, tone };
}

/**
 * Replaces the tone on an existing marked or unmarked pinyin syllable.
 */
export function setSyllableTone(syllable: string, newTone: ToneNumber): string {
  const { base } = stripToneMarks(syllable);
  return numberedToMarkedPinyin(`${base}${newTone}`);
}

export interface SandhiSyllable {
  hanzi: string;
  basePinyin: string;
  citationTone: ToneNumber;
}

export interface SandhiResult {
  hanzi: string;
  writtenPinyin: string;
  spokenPinyin: string;
  citationTone: ToneNumber;
  spokenTone: ToneNumber;
  changed: boolean;
  ruleApplied?: string;
}

/**
 * Applies core Mandarin Tone Sandhi rules to a sequence of syllables:
 * 1. Third-Tone Sandhi: 3 + 3 -> 2 + 3 (e.g. nǐ hǎo -> ní hǎo)
 * 2. 不 (bù) Sandhi: bù (4) before tone 4 -> bú (2) (e.g. bù shì -> bú shì)
 * 3. 一 (yī) Sandhi:
 *    - yī (1) before tone 4 -> yí (2) (e.g. yī gè -> yí gè)
 *    - yī (1) before tone 1, 2, or 3 -> yì (4) (e.g. yī tiān -> yì tiān)
 */
export function analyzeToneSandhi(syllables: SandhiSyllable[]): SandhiResult[] {
  const results: SandhiResult[] = syllables.map((s) => ({
    hanzi: s.hanzi,
    writtenPinyin: setSyllableTone(s.basePinyin, s.citationTone),
    spokenPinyin: setSyllableTone(s.basePinyin, s.citationTone),
    citationTone: s.citationTone,
    spokenTone: s.citationTone,
    changed: false,
  }));

  for (let i = 0; i < results.length - 1; i++) {
    const curr = results[i];
    const next = results[i + 1];

    // Rule 2: 不 (bù) before a 4th tone shifts to 2nd tone (bú)
    if (curr.hanzi === '不' && curr.citationTone === 4 && next.citationTone === 4) {
      curr.spokenTone = 2;
      curr.spokenPinyin = setSyllableTone(syllables[i].basePinyin, 2);
      curr.changed = true;
      curr.ruleApplied = '不 (bù) shifts to 2nd tone (bú) before a 4th tone.';
      continue;
    }

    // Rule 3: 一 (yī) before 4th tone -> yí (2); before 1st/2nd/3rd -> yì (4)
    if (curr.hanzi === '一' && curr.citationTone === 1) {
      if (next.citationTone === 4) {
        curr.spokenTone = 2;
        curr.spokenPinyin = setSyllableTone(syllables[i].basePinyin, 2);
        curr.changed = true;
        curr.ruleApplied = '一 (yī) shifts to 2nd tone (yí) before a 4th tone.';
        continue;
      }
      if (next.citationTone === 1 || next.citationTone === 2 || next.citationTone === 3) {
        curr.spokenTone = 4;
        curr.spokenPinyin = setSyllableTone(syllables[i].basePinyin, 4);
        curr.changed = true;
        curr.ruleApplied = '一 (yī) shifts to 4th tone (yì) before 1st, 2nd, or 3rd tones.';
        continue;
      }
    }

    // Rule 1: Two 3rd tones in a row -> first becomes 2nd tone
    if (curr.citationTone === 3 && next.citationTone === 3) {
      curr.spokenTone = 2;
      curr.spokenPinyin = setSyllableTone(syllables[i].basePinyin, 2);
      curr.changed = true;
      curr.ruleApplied = 'Two 3rd tones in a row: the first shifts up to a 2nd tone.';
    }
  }

  return results;
}
