/**
 * Dynamic per-pair match limit (spec §8.9):
 *   LIMIT = ROUND(MAX(2, MIN(5, 10 / sqrt(N))))
 * Clamped to [2, 5]; N <= 0 falls back to the strictest limit.
 */
export function pairMatchLimit(activePlayersInSeason: number): number {
  if (activePlayersInSeason <= 0) return 2;
  const raw = 10 / Math.sqrt(activePlayersInSeason);
  return Math.round(Math.max(2, Math.min(5, raw)));
}
