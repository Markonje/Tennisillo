// packages/scoring-engine/src/index.ts
// Pure, deterministic scoring engine for validated competitive matches.
// See: docs/specs/02_specifiche_sviluppo.md §4 + docs/specs/01 §8

export type {
  PlayerLevel,
  LevelMultiplierMode,
  ScoringConfig,
  PlayerSeasonContext,
  HeadToHeadContext,
  SetFromWinner,
  ScoreCalculationInput,
  ScoreCalculationOutput,
  ScoreBreakdown,
  PlayerScoreResult,
} from './types';

export { calculateMatchScore } from './calculator';
export { basePoints } from './components/base';
export { levelMultiplier } from './components/levelMultiplier';
export { winnerResultMultiplier, loserResistanceBonus } from './components/resultMultiplier';
export { consistencyBonus } from './components/consistency';
export { winStreakBonus } from './components/winStreak';
export { diversityBonus, firstMeetingBonus } from './components/diversity';
export { headToHeadBonus } from './components/headToHead';
export { repeatPenalty } from './components/repeatPenalty';
export { decayPenalty } from './components/decay';
export { pairMatchLimit } from './utils/pairLimit';
