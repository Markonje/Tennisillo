// packages/scoring-engine/src/types.ts
// Source: docs/specs/02_specifiche_sviluppo.md §4.2 + docs/specs/01_analisi_funzionale.md §8

// 1 = ROOKIE … 7 = ELITE (mirrors PlayerLevel enum in DB)
export type PlayerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type LevelMultiplierMode = 'OFF' | 'SOFT' | 'NORMAL' | 'HARD';

export interface ScoringConfig {
  pointsWin: number; // default: 100
  pointsLoss: number; // default: 30
  levelMultiplierMode: LevelMultiplierMode;
  bonusConsistencyEnabled: boolean;
  bonusDiversityEnabled: boolean;
  headToHeadEnabled: boolean;
  decayEnabled: boolean;
  /** First inactive week that triggers decay (spec §8.10: week 3) */
  decayStartWeek: number;
  /** Points removed per inactive week starting at decayStartWeek, last value = cap */
  decayPointsPerWeek: number[];
  /** Rival/dominance bonus cooldown in days (spec §8.8: 21) */
  rivalCooldownDays: number;
  /**
   * Admin override for the per-pair match limit (spec §8.9 allows ±1 on the
   * dynamic value). 0 or undefined → dynamic limit from activePlayersInSeason.
   */
  maxMatchesPerPair: number;
}

/**
 * One set from the WINNER's perspective.
 * superTiebreak marks a 10-point deciding tiebreak (counted as a set).
 */
export interface SetFromWinner {
  winnerGames: number;
  loserGames: number;
  superTiebreak?: boolean;
}

// CRITICAL: matchesLast4Weeks and weeksInactiveConsecutive count ONLY competitive
// validated Match records. TrainingSession (Sparring / MasterLesson) must never
// be included in these counters at the application layer.
//
// COUNTER SEMANTICS (fixed by the §8.12 worked example):
// - matchesLast4Weeks, totalMatchesThisSeason, uniqueOpponentsThisSeason:
//   INCLUDE the match being scored (it is a played match inside the window).
// - currentWinStreak / winStreakOpponentIds: state BEFORE this match; the
//   engine extends the streak internally for the winner.
// - weeksInactiveConsecutive: full weeks without a competitive match BEFORE
//   this one.
export interface PlayerSeasonContext {
  seasonPlayerId: string;
  level: PlayerLevel;
  rating: number;
  matchesLast4Weeks: number; // competitive Match only — NOT TrainingSession
  uniqueOpponentsThisSeason: string[];
  totalMatchesThisSeason: number;
  currentWinStreak: number;
  winStreakOpponentIds: string[];
  weeksInactiveConsecutive: number; // competitive Match only — NOT TrainingSession
  pausesUsed: number;
}

// CRITICAL: matchesBetweenPairThisSeason counts ONLY competitive Match records
// BEFORE the match being scored. Sparring does NOT increment this counter.
export interface HeadToHeadContext {
  matchesBetweenPairThisSeason: number; // competitive only — NOT Sparring
  lastWinnerId: string | null; // seasonPlayerId of the last pair-match winner
  lastRivalBonusAt: Date | null;
}

export interface ScoreCalculationInput {
  matchId: string;
  winnerId: string;
  loserId: string;
  config: ScoringConfig;
  winner: PlayerSeasonContext;
  loser: PlayerSeasonContext;
  h2h: HeadToHeadContext;
  matchDate: Date;
  /** Sets from the winner's perspective — drives M_RISULTATO */
  sets: SetFromWinner[];
  /** Active (eligible) players in the season — drives diversity + pair limit */
  activePlayersInSeason: number;
}

/**
 * Every field is the POINT CONTRIBUTION of that component to deltaTotal
 * (multipliers are expressed as the points they add/remove), so that
 * base + levelMult + resultMult + consistency + diversity + h2h
 * - repeatPenalty - decay === deltaTotal (before the >= 0 clamp).
 * repeatPenalty and decay are stored as positive magnitudes.
 */
export interface ScoreBreakdown {
  base: number;
  levelMult: number;
  resultMult: number;
  consistency: number;
  diversity: number;
  h2h: number;
  repeatPenalty: number;
  decay: number;
}

export interface PlayerScoreResult {
  deltaTotal: number; // always >= 0 (clamped)
  breakdown: ScoreBreakdown;
}

export interface ScoreCalculationOutput {
  winner: PlayerScoreResult;
  loser: PlayerScoreResult;
  /** True when the winner's rival/dominance bonus was applied (cooldown bookkeeping) */
  rivalBonusApplied: boolean;
}
