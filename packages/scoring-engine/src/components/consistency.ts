/**
 * B_COSTANZA — regularity part (spec §8.6).
 * matchesLast4Weeks counts ONLY competitive validated matches (never
 * TrainingSession) and INCLUDES the match being scored.
 */
export function consistencyBonus(matchesLast4Weeks: number): number {
  if (matchesLast4Weeks >= 4) return 20;
  if (matchesLast4Weeks === 3) return 10;
  if (matchesLast4Weeks === 2) return 5;
  return 0;
}
