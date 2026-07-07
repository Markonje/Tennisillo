import type { ScoringConfig } from '../types';

/**
 * DECAY_INATTIVITÀ (spec §8.10), returned as a positive magnitude.
 * weeksInactive counts ONLY weeks without competitive validated matches —
 * Sparring and Master Lessons never protect from decay.
 *
 * Default table (decayStartWeek=3, decayPointsPerWeek=[5, 15, 25]):
 *   0-2 weeks → 0 · 3 weeks → 5 · 4 weeks → 15 · 5+ weeks → 25 (cap)
 */
export function decayPenalty(weeksInactive: number, config: ScoringConfig): number {
  if (!config.decayEnabled) return 0;
  if (weeksInactive < config.decayStartWeek) return 0;

  const index = Math.min(
    weeksInactive - config.decayStartWeek,
    config.decayPointsPerWeek.length - 1,
  );
  return config.decayPointsPerWeek[index] ?? 0;
}
