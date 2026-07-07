// packages/training-engine/src/types.ts
// Source: docs/specs/02_specifiche_sviluppo.md §5.2

export interface SparringConfig {
  pointsPerPlayer: number; // default 12, range 5-15
  weeklyCapPerPlayer: number; // default 2, range 1-2
}

export interface SparringCalculationInput {
  config: SparringConfig;
  player1Id: string;
  player2Id: string;
  // validated sparring count in the current ISO week for each player
  player1SparringThisWeek: number;
  player2SparringThisWeek: number;
}

export type SparringRejectionReason =
  | 'CAP_REACHED_P1'
  | 'CAP_REACHED_P2'
  | 'SPARRING_DISABLED';

export interface SparringCalculationOutput {
  accepted: boolean;
  rejectionReason?: SparringRejectionReason;
  pointsP1: number;
  pointsP2: number;
}

export interface MasterLessonConfig {
  xpPerSession: number; // default 20, range 10-30
}

export interface MasterLessonCalculationInput {
  config: MasterLessonConfig;
  playerId: string;
  masterId: string;
  // total XP already accumulated by the player (diminishing returns curve)
  playerCurrentXp: number;
}

export interface MasterLessonCalculationOutput {
  xpAwarded: number;
  globalRatingDelta: number; // XP contribution to the global rating
}
