/**
 * Diversity (spec 01 §6.3): favours opponents with few or no precedents in
 * the current season. The spec gives no numeric table — decreasing steps
 * chosen symmetrical to the level scorer.
 */
export function scoreDiversity(matchesWithRequesterThisSeason: number): number {
  if (matchesWithRequesterThisSeason === 0) return 100;
  if (matchesWithRequesterThisSeason === 1) return 60;
  if (matchesWithRequesterThisSeason === 2) return 30;
  return 10;
}
