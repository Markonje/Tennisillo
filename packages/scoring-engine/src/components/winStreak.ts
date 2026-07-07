/**
 * B_COSTANZA — win streak part (spec §8.6).
 * The streak only counts consecutive wins against DISTINCT opponents; beating
 * an opponent already in the streak restarts it at 1 (no bonus). Sparring
 * neither feeds nor breaks the streak (application-layer guarantee).
 *
 * currentStreak / streakOpponentIds describe the state BEFORE this win.
 */
export function winStreakBonus(
  currentStreak: number,
  streakOpponentIds: string[],
  beatenOpponentId: string,
): number {
  if (streakOpponentIds.includes(beatenOpponentId)) return 0;

  const newStreak = currentStreak + 1;
  if (newStreak >= 4) return 30;
  if (newStreak === 3) return 20;
  if (newStreak === 2) return 10;
  return 0;
}
