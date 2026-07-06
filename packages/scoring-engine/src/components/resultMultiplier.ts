import type { SetFromWinner } from '../types';

/**
 * M_RISULTATO for the winner (spec §8.5).
 *
 * Deterministic precedence (fixed by the §8.12 example, where 6-4 7-6 is
 * treated as a straight-sets ×1.2 win):
 *   1. deciding super tiebreak            → 0.95
 *   2. no set lost                        → 1.2
 *   3. at least one regular tiebreak set  → 1.05
 *   4. otherwise                          → 1.0
 */
export function winnerResultMultiplier(sets: SetFromWinner[]): number {
  const decidedBySuperTiebreak = sets[sets.length - 1]?.superTiebreak === true;
  if (decidedBySuperTiebreak) return 0.95;

  const setsLost = sets.filter((s) => s.loserGames > s.winnerGames).length;
  if (setsLost === 0) return 1.2;

  const hasTiebreakSet = sets.some(
    (s) => !s.superTiebreak && Math.max(s.winnerGames, s.loserGames) === 7 && Math.min(s.winnerGames, s.loserGames) === 6,
  );
  if (hasTiebreakSet) return 1.05;

  return 1.0;
}

/**
 * Fixed resistance bonuses for the loser (spec §8.5):
 * - lost 2-1 (forced a deciding set): +15 ("Combattente")
 * - lost 2-0 but won at least 4 games in total: +5
 */
export function loserResistanceBonus(sets: SetFromWinner[]): number {
  const setsWonByLoser = sets.filter((s) => s.loserGames > s.winnerGames).length;
  if (setsWonByLoser >= 1) return 15;

  const gamesWonByLoser = sets.reduce(
    (sum, s) => sum + (s.superTiebreak ? 0 : s.loserGames),
    0,
  );
  return gamesWonByLoser >= 4 ? 5 : 0;
}
