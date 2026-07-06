/**
 * B_DIVERSIFICAZIONE (spec §8.7), normalized for small leagues:
 *   index = uniqueOpponents / MIN(totalMatches, N-1)
 *
 * Thresholds (normative table §8.7 — NOTE: the worked example §8.12 shows
 * +15 for index 0.75, which contradicts this table; the table wins, see FAQ):
 *   >= 0.8 → +15 · >= 0.6 → +8 · >= 0.4 → +3 · else 0
 *
 * Counters INCLUDE the match being scored.
 */
export function diversityBonus(
  uniqueOpponents: number,
  totalMatches: number,
  activePlayersInSeason: number,
): number {
  const denominator = Math.min(totalMatches, Math.max(1, activePlayersInSeason - 1));
  if (denominator <= 0 || totalMatches <= 0) return 0;

  const index = uniqueOpponents / denominator;
  if (index >= 0.8) return 15;
  if (index >= 0.6) return 8;
  if (index >= 0.4) return 3;
  return 0;
}

/** First meeting between the pair this season: +10 fixed (spec §8.7). */
export function firstMeetingBonus(matchesBetweenPairBefore: number): number {
  return matchesBetweenPairBefore === 0 ? 10 : 0;
}
