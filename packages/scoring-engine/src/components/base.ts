import type { ScoringConfig } from '../types';

/** P_BASE (spec §8.3): participation is always rewarded. */
export function basePoints(isWinner: boolean, config: ScoringConfig): number {
  return isWinner ? config.pointsWin : config.pointsLoss;
}
