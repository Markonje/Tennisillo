import type { SparringCalculationInput, SparringCalculationOutput } from './types';

/**
 * Sparring points (spec 01 §9.1): fixed reward per player, no multipliers,
 * no bonuses, hard weekly cap. NEVER feeds ScoreDelta, HeadToHead, win
 * streaks or the competitive counters — application-layer invariant.
 */
export function calculateSparring(input: SparringCalculationInput): SparringCalculationOutput {
  const { config, player1SparringThisWeek, player2SparringThisWeek } = input;

  if (player1SparringThisWeek >= config.weeklyCapPerPlayer) {
    return { accepted: false, rejectionReason: 'CAP_REACHED_P1', pointsP1: 0, pointsP2: 0 };
  }
  if (player2SparringThisWeek >= config.weeklyCapPerPlayer) {
    return { accepted: false, rejectionReason: 'CAP_REACHED_P2', pointsP1: 0, pointsP2: 0 };
  }

  return {
    accepted: true,
    pointsP1: config.pointsPerPlayer,
    pointsP2: config.pointsPerPlayer,
  };
}
