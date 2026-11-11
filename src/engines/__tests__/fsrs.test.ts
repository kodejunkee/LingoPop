/// <reference types="node" />
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  computeRetrievability,
  createNewFSRSCard,
  formatDaysLabel,
  scheduleFSRSCard,
} from '../fsrs';

describe('FSRS spaced repetition scheduler', () => {
  const BASE_TIME = 1_700_000_000_000;
  const DAY_MS = 24 * 60 * 60 * 1000;

  it('schedules a new card sensibly across Again / Hard / Good / Easy ratings', () => {
    const card = createNewFSRSCard('vocab', '我', BASE_TIME);

    const again = scheduleFSRSCard(card, 1, BASE_TIME);
    assert.equal(again.card.state, 1);
    assert.equal(again.intervalLabel, '1m');

    const hard = scheduleFSRSCard(card, 2, BASE_TIME);
    assert.equal(hard.card.state, 1);
    assert.equal(hard.intervalLabel, '10m');

    const good = scheduleFSRSCard(card, 3, BASE_TIME);
    assert.equal(good.card.state, 2);
    assert.ok(good.card.scheduledDays >= 1);

    const easy = scheduleFSRSCard(card, 4, BASE_TIME);
    assert.equal(easy.card.state, 2);
    assert.ok(easy.card.scheduledDays > good.card.scheduledDays);
  });

  it('grows stability and interval over repeated Good reviews', () => {
    let card = createNewFSRSCard('vocab', '好', BASE_TIME);

    const first = scheduleFSRSCard(card, 3, BASE_TIME);
    card = first.card;
    const t2 = BASE_TIME + card.scheduledDays * DAY_MS;

    const second = scheduleFSRSCard(card, 3, t2);
    assert.ok(second.card.stability > first.card.stability);
    assert.ok(second.card.scheduledDays > first.card.scheduledDays);
    assert.equal(second.card.reps, 2);
  });

  it('handles lapses by incrementing lapses, switching to Relearning, and shrinking stability', () => {
    let card = createNewFSRSCard('vocab', '书', BASE_TIME);
    card = scheduleFSRSCard(card, 4, BASE_TIME).card;
    const prevStability = card.stability;

    const lapsed = scheduleFSRSCard(
      card,
      1,
      BASE_TIME + card.scheduledDays * DAY_MS
    );
    assert.equal(lapsed.card.state, 3);
    assert.equal(lapsed.card.lapses, 1);
    assert.equal(lapsed.intervalLabel, '10m');
    assert.ok(lapsed.card.stability <= prevStability);
  });

  it('computes retrievability decay and human-friendly interval labels', () => {
    assert.equal(computeRetrievability(0, 10), 1);
    const rAtStability = computeRetrievability(10, 10);
    assert.ok(Math.abs(rAtStability - 0.9) < 0.01);

    assert.equal(formatDaysLabel(5), '5d');
    assert.equal(formatDaysLabel(60), '2mo');
    assert.equal(formatDaysLabel(365), '1.0y');
  });
});
