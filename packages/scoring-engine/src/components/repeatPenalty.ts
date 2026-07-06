import { pairMatchLimit } from '../utils/pairLimit';

/**
 * MALUS_RIPETIZIONE (spec §8.9), returned as a positive magnitude.
 * Piecewise per the spec labels for match n of limit L (n includes the match
 * being scored: n = matchesBetweenPairBefore + 1):
 *   first (n=1)        → 0
 *   last (n>=L)        → 30
 *   penultimate (L-1)  → 18
 *   other intermediate → 8
 * Sparring never counts toward n (application-layer guarantee).
 */
export function repeatPenalty(
  matchesBetweenPairBefore: number,
  activePlayersInSeason: number,
  maxMatchesPerPairOverride: number,
): number {
  const limit =
    maxMatchesPerPairOverride > 0
      ? maxMatchesPerPairOverride
      : pairMatchLimit(activePlayersInSeason);

  const n = matchesBetweenPairBefore + 1;
  if (n <= 1) return 0;
  if (n >= limit) return 30;
  if (n === limit - 1) return 18;
  return 8;
}
