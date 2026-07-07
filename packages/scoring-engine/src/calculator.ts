import type {
  PlayerScoreResult,
  ScoreBreakdown,
  ScoreCalculationInput,
  ScoreCalculationOutput,
} from './types';
import { basePoints } from './components/base';
import { levelMultiplier } from './components/levelMultiplier';
import { loserResistanceBonus, winnerResultMultiplier } from './components/resultMultiplier';
import { consistencyBonus } from './components/consistency';
import { winStreakBonus } from './components/winStreak';
import { diversityBonus, firstMeetingBonus } from './components/diversity';
import { headToHeadBonus } from './components/headToHead';
import { repeatPenalty } from './components/repeatPenalty';
import { decayPenalty } from './components/decay';

function round(n: number): number {
  return Math.round(n);
}

function toResult(breakdown: ScoreBreakdown): PlayerScoreResult {
  const raw =
    breakdown.base +
    breakdown.levelMult +
    breakdown.resultMult +
    breakdown.consistency +
    breakdown.diversity +
    breakdown.h2h -
    breakdown.repeatPenalty -
    breakdown.decay;
  return { deltaTotal: Math.max(0, round(raw)), breakdown };
}

/**
 * Computes the points delta for winner and loser of a VALIDATED competitive
 * match (spec §8.1):
 *
 *   ΔP = P_BASE × M_LIVELLO × M_RISULTATO
 *        + B_COSTANZA + B_DIVERSIFICAZIONE + B_RIVALSA
 *        - MALUS_RIPETIZIONE - DECAY_INATTIVITÀ
 *
 * PRECONDITIONS (caller responsibility):
 * - The match is VALIDATED and is NOT a TrainingSession (those use
 *   training-engine).
 * - matchesLast4Weeks, weeksInactiveConsecutive and
 *   matchesBetweenPairThisSeason count ONLY competitive matches (no Sparring).
 *
 * OUTPUT:
 * - deltaTotal >= 0 guaranteed (clamped).
 * - Fully deterministic: same input → same output. No Date.now() — the match
 *   date arrives as input.
 *
 * Breakdown fields hold POINT CONTRIBUTIONS: multiplier entries store the
 * points added/removed relative to the running product, penalties store
 * positive magnitudes.
 */
export function calculateMatchScore(input: ScoreCalculationInput): ScoreCalculationOutput {
  const { config, winner, loser, h2h, sets, matchDate, activePlayersInSeason } = input;

  // repeat penalty applies to the pair, symmetric for both players
  const pairPenalty = repeatPenalty(
    h2h.matchesBetweenPairThisSeason,
    activePlayersInSeason,
    config.maxMatchesPerPair,
  );

  // ── Winner ────────────────────────────────────────────────────────────────
  const wBase = basePoints(true, config);
  const wLevelMult = levelMultiplier(winner.level, loser.level, true, config.levelMultiplierMode);
  const afterLevel = wBase * wLevelMult;
  const wResultMult = winnerResultMultiplier(sets);
  const afterResult = afterLevel * wResultMult;

  const wConsistency = config.bonusConsistencyEnabled
    ? consistencyBonus(winner.matchesLast4Weeks) +
      winStreakBonus(winner.currentWinStreak, winner.winStreakOpponentIds, loser.seasonPlayerId)
    : 0;

  const wDiversity = config.bonusDiversityEnabled
    ? diversityBonus(
        winner.uniqueOpponentsThisSeason.length,
        winner.totalMatchesThisSeason,
        activePlayersInSeason,
      ) + firstMeetingBonus(h2h.matchesBetweenPairThisSeason)
    : 0;

  const h2hResult = config.headToHeadEnabled
    ? headToHeadBonus(winner.seasonPlayerId, h2h, matchDate, config.rivalCooldownDays)
    : { points: 0, applied: false };

  const winnerBreakdown: ScoreBreakdown = {
    base: wBase,
    levelMult: round(afterLevel - wBase),
    resultMult: round(afterResult - afterLevel),
    consistency: wConsistency,
    diversity: wDiversity,
    h2h: h2hResult.points,
    repeatPenalty: pairPenalty,
    decay: decayPenalty(winner.weeksInactiveConsecutive, config),
  };

  // ── Loser ─────────────────────────────────────────────────────────────────
  const lBase = basePoints(false, config);
  const lLevelMult = levelMultiplier(loser.level, winner.level, false, config.levelMultiplierMode);
  const afterLevelLoser = lBase * lLevelMult;

  const lConsistency = config.bonusConsistencyEnabled
    ? consistencyBonus(loser.matchesLast4Weeks)
    : 0;

  const lDiversity = config.bonusDiversityEnabled
    ? diversityBonus(
        loser.uniqueOpponentsThisSeason.length,
        loser.totalMatchesThisSeason,
        activePlayersInSeason,
      ) + firstMeetingBonus(h2h.matchesBetweenPairThisSeason)
    : 0;

  const loserBreakdown: ScoreBreakdown = {
    base: lBase,
    levelMult: round(afterLevelLoser - lBase),
    resultMult: loserResistanceBonus(sets),
    consistency: lConsistency,
    diversity: lDiversity,
    h2h: 0,
    repeatPenalty: pairPenalty,
    decay: decayPenalty(loser.weeksInactiveConsecutive, config),
  };

  return {
    winner: toResult(winnerBreakdown),
    loser: toResult(loserBreakdown),
    rivalBonusApplied: h2hResult.applied,
  };
}
