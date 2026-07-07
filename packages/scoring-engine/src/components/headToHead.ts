import type { HeadToHeadContext } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface HeadToHeadBonusResult {
  points: number;
  applied: boolean;
}

/**
 * B_RIVALSA / DOMINANZA (spec §8.8), winner only:
 * - the last pair-match loser wins the rematch  → +25 (revenge)
 * - the last pair-match winner wins again       → +15 (dominance)
 * Anti-abuse: at most once per pair every rivalCooldownDays (default 21).
 *
 * The h2h context describes the state BEFORE this match.
 */
export function headToHeadBonus(
  winnerId: string,
  h2h: HeadToHeadContext,
  matchDate: Date,
  rivalCooldownDays: number,
): HeadToHeadBonusResult {
  if (h2h.lastWinnerId === null) return { points: 0, applied: false };

  if (h2h.lastRivalBonusAt !== null) {
    const daysSince = (matchDate.getTime() - h2h.lastRivalBonusAt.getTime()) / MS_PER_DAY;
    if (daysSince < rivalCooldownDays) return { points: 0, applied: false };
  }

  const points = h2h.lastWinnerId === winnerId ? 15 : 25;
  return { points, applied: true };
}
