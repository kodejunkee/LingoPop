/// <reference types="node" />
import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  canAccessLesson,
  OpenAccessEntitlementProvider,
  resolveLessonAccessTier,
  setEntitlementProvider,
  type EntitlementProvider,
} from '../entitlements';

describe('entitlements boundary (Stages 0-3 free, Stage 4+ future hybrid gate)', () => {
  afterEach(() => {
    setEntitlementProvider(OpenAccessEntitlementProvider);
  });

  it('defaults Stages 0-3 to free and Stage 4+ to unlockable metadata', () => {
    assert.equal(resolveLessonAccessTier({ stage: 0 }), 'free');
    assert.equal(resolveLessonAccessTier({ stage: 3 }), 'free');
    assert.equal(resolveLessonAccessTier({ stage: 4 }), 'unlockable');
    assert.equal(resolveLessonAccessTier({ stage: 6 }), 'unlockable');
  });

  it('keeps all lessons accessible in open-access beta mode while exposing future options', () => {
    const freeStage = canAccessLesson({ id: 'stage0-tones', stage: 0 });
    assert.equal(freeStage.accessible, true);
    assert.equal(freeStage.tier, 'free');
    assert.equal(freeStage.reason, 'free_tier');
    assert.deepEqual(freeStage.unlockOptions, []);

    const stage5 = canAccessLesson({ id: 'stage5-passive-complements', stage: 5 });
    assert.equal(stage5.accessible, true);
    assert.equal(stage5.tier, 'unlockable');
    assert.equal(stage5.reason, 'open_beta_default');
    assert.deepEqual(stage5.unlockOptions, ['rewarded_ad_lesson_pass', 'pro_subscription']);
  });

  it('supports swapping in a future commercial provider without touching UI/curriculum', () => {
    const mockPaidProvider: EntitlementProvider = {
      id: 'mock_commercial',
      getLessonAccess(lesson) {
        const tier = resolveLessonAccessTier(lesson);
        const isFree = tier === 'free';
        return {
          lessonId: lesson.id,
          courseId: lesson.courseId ?? 'zh-CN',
          tier,
          accessible: isFree,
          reason: isFree ? 'free_tier' : 'locked',
          unlockOptions: isFree ? [] : ['rewarded_ad_lesson_pass', 'pro_subscription'],
        };
      },
    };

    setEntitlementProvider(mockPaidProvider);

    assert.equal(canAccessLesson({ id: 'stage3-conv', stage: 3 }).accessible, true);
    const blocked = canAccessLesson({ id: 'stage4-exp', stage: 4 });
    assert.equal(blocked.accessible, false);
    assert.equal(blocked.reason, 'locked');
  });
});
