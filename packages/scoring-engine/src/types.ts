// packages/scoring-engine/src/types.ts
// Source: docs/specs/02_specifiche_sviluppo.md §4.2
// Implementation deferred to Sprint 4.

// 1 = ROOKIE … 7 = ELITE (mirrors PlayerLevel enum in DB)
export type PlayerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ScoringConfig {
  pointsWin: number; // default: 100
  pointsLoss: number; // default: 30
  levelMultiplierMode: 'OFF' | 'SOFT' | 'NORMAL' | 'HARD';
  bonusConsistencyEnabled: boolean;
  bonusDiversityEnabled: boolean;
  headToHeadEnabled: boolean;
  decayEnabled: boolean;
  decayStartWeek: number;
  decayPointsPerWeek: number[];
  rivalCooldownDays: number;
  maxMatchesPerPair: number;
}

// CRITICAL: matchesLast4Weeks and weeksInactiveConsecutive count ONLY competitive
// validated Match records. TrainingSession (Sparring / MasterLesson) must never
// be included in these counters at the application layer.
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

// CRITICAL: matchesBetweenPairThisSeason counts ONLY competitive Match records.
// Sparring does NOT increment this counter.
export interface HeadToHeadContext {
  matchesBetweenPairThisSeason: number; // competitive only — NOT Sparring
  lastWinnerId: string | null;
  lastRivalBonusAt: Date | null;
}

// TODO Sprint 4: define ScoreCalculationInput / ScoreCalculationOutput
// by referencing docs/specs/02_specifiche_sviluppo.md §4 (v1.0 types).
export interface ScoreCalculationInput {
  matchId: string;
  winnerId: string;
  loserId: string;
  config: ScoringConfig;
  winner: PlayerSeasonContext;
  loser: PlayerSeasonContext;
  h2h: HeadToHeadContext;
  matchDate: Date;
}

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
}
