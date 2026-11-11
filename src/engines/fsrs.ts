/**
 * Free Spaced Repetition Scheduler (FSRS-4.5 model) in pure TypeScript.
 * Predicts memory stability and optimal review intervals locally without network access.
 */

export type CardState = 0 | 1 | 2 | 3; // 0=New, 1=Learning, 2=Review, 3=Relearning
export type FSRSRating = 1 | 2 | 3 | 4; // 1=Again, 2=Hard, 3=Good, 4=Easy

export interface FSRSCard {
  id?: number;
  itemType: 'vocab' | 'hanzi';
  itemId: string;
  state: CardState;
  difficulty: number;
  stability: number;
  elapsedDays: number;
  scheduledDays: number;
  reps: number;
  lapses: number;
  dueAt: number;
  lastReviewAt: number | null;
}

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Empirically calibrated FSRS-4.5 default weights
const W = [
  0.4072, 1.1829, 3.1262, 15.4722, // w0..w3: initial stability for Again/Hard/Good/Easy
  7.2102, 0.5316, 1.0651, 0.0234,  // w4..w7: difficulty weights
  1.616, 0.1544, 1.0824, 1.9813,   // w8..w11: recall & forget stability weights
  0.0953, 0.2975, 2.2042, 0.2407,  // w12..w15: forget & hard/easy multipliers
  2.9466,                          // w16: easy bonus
] as const;

const REQUEST_RETENTION = 0.9;
const DECAY = -0.5;
const FACTOR = Math.pow(REQUEST_RETENTION, 1 / DECAY) - 1; // ~19/81

function clampDifficulty(d: number): number {
  return Math.min(10, Math.max(1, Number(d.toFixed(4))));
}

function clampStability(s: number): number {
  return Math.max(0.1, Number(s.toFixed(4)));
}

export function createNewFSRSCard(
  itemType: 'vocab' | 'hanzi',
  itemId: string,
  nowMs = Date.now()
): FSRSCard {
  return {
    itemType,
    itemId,
    state: 0,
    difficulty: 0,
    stability: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    dueAt: nowMs,
    lastReviewAt: null,
  };
}

/**
 * Predicts current probability of recall (0..1) given elapsed days and stability.
 */
export function computeRetrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0;
  if (elapsedDays <= 0) return 1;
  return Math.pow(1 + FACTOR * (elapsedDays / stability), DECAY);
}

function nextIntervalDays(stability: number): number {
  const interval = (stability / FACTOR) * (Math.pow(REQUEST_RETENTION, 1 / DECAY) - 1);
  return Math.max(1, Math.round(interval));
}

function initStability(rating: FSRSRating): number {
  return clampStability(W[rating - 1]);
}

function initDifficulty(rating: FSRSRating): number {
  return clampDifficulty(W[4] - Math.exp(W[5] * (rating - 1)) + 1);
}

function nextDifficulty(d: number, rating: FSRSRating): number {
  const delta = -W[6] * (rating - 3);
  const nextD = d + delta;
  // Mean reversion toward initial Good difficulty (w4)
  return clampDifficulty(W[7] * initDifficulty(4) + (1 - W[7]) * nextD);
}

function nextRecallStability(
  d: number,
  s: number,
  r: number,
  rating: FSRSRating
): number {
  const hardPenalty = rating === 2 ? W[15] : 1;
  const easyBonus = rating === 4 ? W[16] : 1;
  const multiplier =
    Math.exp(W[8]) *
    (11 - d) *
    Math.pow(s, -W[9]) *
    (Math.exp((1 - r) * W[10]) - 1) *
    hardPenalty *
    easyBonus +
    1;
  return clampStability(s * multiplier);
}

function nextForgetStability(d: number, s: number, r: number): number {
  const nextS =
    W[11] *
    Math.pow(d, -W[12]) *
    (Math.pow(s + 1, W[13]) - 1) *
    Math.exp((1 - r) * W[14]);
  return clampStability(Math.min(s, nextS));
}

export interface ScheduledOutcome {
  card: FSRSCard;
  intervalLabel: string;
}

/**
 * Schedules the next review state for a flashcard using the FSRS memory model.
 */
export function scheduleFSRSCard(
  card: FSRSCard,
  rating: FSRSRating,
  nowMs = Date.now()
): ScheduledOutcome {
  const elapsedDays =
    card.lastReviewAt !== null
      ? Math.max(0, Math.round((nowMs - card.lastReviewAt) / MS_PER_DAY))
      : 0;

  let nextD: number;
  let nextS: number;
  let nextState: CardState;
  let nextLapses = card.lapses;
  let scheduledDays = 0;
  let dueAt = nowMs;
  let intervalLabel = '1d';

  if (card.state === 0) {
    // First-ever exposure
    nextD = initDifficulty(rating);
    nextS = initStability(rating);

    if (rating === 1) {
      nextState = 1;
      dueAt = nowMs + 1 * MS_PER_MINUTE;
      intervalLabel = '1m';
    } else if (rating === 2) {
      nextState = 1;
      dueAt = nowMs + 10 * MS_PER_MINUTE;
      intervalLabel = '10m';
    } else if (rating === 3) {
      nextState = 2;
      scheduledDays = nextIntervalDays(nextS);
      dueAt = nowMs + scheduledDays * MS_PER_DAY;
      intervalLabel = `${scheduledDays}d`;
    } else {
      nextState = 2;
      scheduledDays = Math.max(4, nextIntervalDays(nextS));
      dueAt = nowMs + scheduledDays * MS_PER_DAY;
      intervalLabel = `${scheduledDays}d`;
    }
  } else {
    const r = computeRetrievability(elapsedDays, card.stability);
    nextD = nextDifficulty(card.difficulty, rating);

    if (rating === 1) {
      // Lapse: move to Relearning and shrink stability
      nextLapses += 1;
      nextState = 3;
      nextS = nextForgetStability(nextD, card.stability, r);
      scheduledDays = 0;
      dueAt = nowMs + 10 * MS_PER_MINUTE;
      intervalLabel = '10m';
    } else {
      nextState = 2;
      nextS = nextRecallStability(nextD, card.stability, r, rating);
      scheduledDays = nextIntervalDays(nextS);
      if (rating === 4 && scheduledDays <= card.scheduledDays) {
        scheduledDays = card.scheduledDays + 1;
      }
      dueAt = nowMs + scheduledDays * MS_PER_DAY;
      intervalLabel = formatDaysLabel(scheduledDays);
    }
  }

  return {
    card: {
      ...card,
      state: nextState,
      difficulty: nextD,
      stability: nextS,
      elapsedDays,
      scheduledDays,
      reps: card.reps + 1,
      lapses: nextLapses,
      dueAt,
      lastReviewAt: nowMs,
    },
    intervalLabel,
  };
}

export function formatDaysLabel(days: number): string {
  if (days < 1) return '<1d';
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.round(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}
