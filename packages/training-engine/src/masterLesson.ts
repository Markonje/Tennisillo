import type { MasterLessonCalculationInput, MasterLessonCalculationOutput } from './types';
import { xpToGlobalRatingDelta } from './xpCurve';

/**
 * Master lesson XP (spec 01 §9.2): fixed XP per validated session, feeding
 * ONLY the global profile (rating/level). Never touches SeasonRanking,
 * league rating or any seasonal counter.
 */
export function calculateMasterLesson(
  input: MasterLessonCalculationInput,
): MasterLessonCalculationOutput {
  const { config, playerCurrentXp } = input;
  const xpAwarded = config.xpPerSession;
  const globalRatingDelta = xpToGlobalRatingDelta(xpAwarded, playerCurrentXp);
  return { xpAwarded, globalRatingDelta };
}
