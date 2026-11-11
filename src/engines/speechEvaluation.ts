/**
 * Normalizes Mandarin Chinese text by removing whitespace and punctuation.
 */
export function normalizeChinese(text: string): string {
  return text
    .trim()
    .replace(/[\s，。？！、；：“”‘’（）,.?!;:'"()\-]/g, '');
}

export interface SpeechEvaluationResult {
  matched: boolean;
  score: number;
  bestTranscript: string;
  /** Per-character match flags aligned to normalized targetHanzi */
  charMatchedMask: boolean[];
  normalizedTarget: string;
}

/**
 * Evaluates speech-recognition transcripts against a target Mandarin phrase.
 * Supports multiple recognition alternatives and highlights exact matched characters.
 */
export function evaluateMandarinSpeech(
  transcripts: string[],
  targetHanzi: string
): SpeechEvaluationResult {
  const normalizedTarget = normalizeChinese(targetHanzi);
  const targetChars = Array.from(normalizedTarget);

  if (targetChars.length === 0) {
    return {
      matched: true,
      score: 100,
      bestTranscript: transcripts[0] ?? '',
      charMatchedMask: [],
      normalizedTarget: '',
    };
  }

  let bestScore = -1;
  let bestTranscript = transcripts[0] ?? '';
  let bestMask: boolean[] = targetChars.map(() => false);

  for (const candidate of transcripts) {
    const normCand = normalizeChinese(candidate);
    if (!normCand) continue;

    // Exact match check
    if (normCand === normalizedTarget) {
      return {
        matched: true,
        score: 100,
        bestTranscript: candidate,
        charMatchedMask: targetChars.map(() => true),
        normalizedTarget,
      };
    }

    // Greedy forward character alignment preserving sequence order
    const candChars = Array.from(normCand);
    const mask: boolean[] = new Array(targetChars.length).fill(false);
    let searchFrom = 0;
    let hits = 0;

    for (let i = 0; i < targetChars.length; i++) {
      const idx = candChars.indexOf(targetChars[i], searchFrom);
      if (idx !== -1) {
        mask[i] = true;
        hits += 1;
        searchFrom = idx + 1;
      }
    }

    const score = Math.round((hits / targetChars.length) * 100);
    if (score > bestScore) {
      bestScore = score;
      bestTranscript = candidate;
      bestMask = mask;
    }
  }

  const finalScore = Math.max(0, bestScore);
  // Accept >= 75% character overlap as a pass (accommodates slight homophones/ASR quirks)
  return {
    matched: finalScore >= 75,
    score: finalScore,
    bestTranscript,
    charMatchedMask: bestMask,
    normalizedTarget,
  };
}
