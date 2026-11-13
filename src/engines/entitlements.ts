import type { AccessTier, LessonDefinition } from '../curriculum/types';

export type EntitlementReason =
  | 'free_tier'
  | 'open_beta_default'
  | 'pro_subscription'
  | 'ad_unlocked'
  | 'locked';

export type UnlockOption = 'rewarded_ad_lesson_pass' | 'pro_subscription';

export interface LessonEntitlementStatus {
  lessonId: string;
  courseId: string;
  tier: AccessTier;
  accessible: boolean;
  reason: EntitlementReason;
  unlockOptions: UnlockOption[];
}

export interface EntitlementConfig {
  /** Free stages count from stage 0 (stages 0..freeStageCutoff are always free). */
  freeStageCutoff: number;
  /** When false (current open beta), all lessons remain accessible without paywalls/ads. */
  commercialGatingEnabled: boolean;
}

export const DEFAULT_ENTITLEMENT_CONFIG: EntitlementConfig = {
  freeStageCutoff: 3,
  commercialGatingEnabled: false,
};

export interface EntitlementProvider {
  readonly id: string;
  getLessonAccess(
    lesson: Pick<LessonDefinition, 'id' | 'courseId' | 'stage' | 'accessTier'>,
    config?: EntitlementConfig
  ): LessonEntitlementStatus;
}

/** Resolves a lesson's default access tier when not explicitly overridden. */
export function resolveLessonAccessTier(
  lesson: Pick<LessonDefinition, 'stage' | 'accessTier'>,
  freeStageCutoff: number = DEFAULT_ENTITLEMENT_CONFIG.freeStageCutoff
): AccessTier {
  if (lesson.accessTier) {
    return lesson.accessTier;
  }
  return lesson.stage <= freeStageCutoff ? 'free' : 'unlockable';
}

/**
 * Default open-access provider active until commercial monetization (subscriptions /
 * rewarded-ad lesson passes / user accounts) is explicitly enabled in a future milestone.
 */
export const OpenAccessEntitlementProvider: EntitlementProvider = {
  id: 'open_access',
  getLessonAccess(lesson, config = DEFAULT_ENTITLEMENT_CONFIG) {
    const courseId = lesson.courseId ?? 'zh-CN';
    const tier = resolveLessonAccessTier(lesson, config.freeStageCutoff);
    return {
      lessonId: lesson.id,
      courseId,
      tier,
      accessible: true,
      reason: tier === 'free' ? 'free_tier' : 'open_beta_default',
      unlockOptions: tier === 'free' ? [] : ['rewarded_ad_lesson_pass', 'pro_subscription'],
    };
  },
};

let activeProvider: EntitlementProvider = OpenAccessEntitlementProvider;

/** Swaps the active entitlement provider at startup (pure JS/TS seam). */
export function setEntitlementProvider(provider: EntitlementProvider): void {
  activeProvider = provider;
}

/** Returns whether a lesson is accessible under the currently registered entitlement policy. */
export function canAccessLesson(
  lesson: Pick<LessonDefinition, 'id' | 'courseId' | 'stage' | 'accessTier'>,
  config: EntitlementConfig = DEFAULT_ENTITLEMENT_CONFIG
): LessonEntitlementStatus {
  return activeProvider.getLessonAccess(lesson, config);
}
