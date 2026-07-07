/**
 * XP → global rating delta with diminishing returns (spec 02 §5.4):
 *   factor(x) = 0.5  if x < 100
 *             = 0.3  if x < 500
 *             = 0.15 if x < 1500
 *             = 0.05 if x >= 1500
 * Levelling up through lessons is much slower than through competitive play.
 */
export function xpToGlobalRatingDelta(xpAwarded: number, currentXp: number): number {
  let factor: number;
  if (currentXp < 100) factor = 0.5;
  else if (currentXp < 500) factor = 0.3;
  else if (currentXp < 1500) factor = 0.15;
  else factor = 0.05;
  return Math.round(xpAwarded * factor * 100) / 100; // 2 decimals
}
