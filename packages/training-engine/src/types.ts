// packages/training-engine/src/types.ts
// Implementation deferred to Sprint 6.
// See: docs/specs/02_specifiche_sviluppo.md §5

export interface WeekBounds {
  weekStart: Date; // ISO Monday 00:00:00 UTC
  weekEnd: Date;   // ISO Sunday 23:59:59 UTC
}

// CRITICAL: sparring points are awarded independently of the competitive scoring engine.
// They never feed ScoreDelta, HeadToHead, matchesLast4Weeks, or winStreak.
export interface SparringInput {
  leagueId: string;
  seasonId: string;
  player1Id: string;
  player2Id: string;
  completedAt: Date;
  pointsPerPlayer: number; // from LeagueSettings.sparringPointsPerPlayer (default 12)
  weeklyCapPerPlayer: number; // from LeagueSettings.sparringWeeklyCapPerPlayer (default 2)
  sparringsThisWeekP1: number; // count of already-validated sparrings this week for player1
  sparringsThisWeekP2: number; // count for player2
}

export interface SparringOutput {
  allowed: boolean;
  rejectionReason?: 'CAP_EXCEEDED_P1' | 'CAP_EXCEEDED_P2';
  pointsAwarded: number; // 0 if not allowed
}

// XP from master lessons feeds only globalExperiencePoints, never season ranking.
export interface MasterLessonInput {
  leagueId: string;
  playerId: string;
  masterId: string;
  completedAt: Date;
  xpPerSession: number; // from LeagueSettings.masterXpPerSession (default 20)
  currentGlobalXp: number;
}

export interface MasterLessonOutput {
  xpAwarded: number;
  newGlobalXp: number;
  newGlobalRating: number; // after applying diminishing-returns XP curve
}
