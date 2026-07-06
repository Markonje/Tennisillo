export type MatchStatusValue =
  | 'PENDING_ACCEPTANCE'
  | 'SCHEDULED'
  | 'PENDING_RESULT'
  | 'PENDING_VALIDATION'
  | 'DISPUTED'
  | 'VALIDATED'
  | 'CANCELLED'
  | 'WALKOVER';

export type MatchFormatValue = 'BEST_OF_1' | 'BEST_OF_3' | 'SUPER_TIEBREAK' | 'CUSTOM';

export type DisputeStatusValue = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export interface MatchPlayerDto {
  id: string;
  memberId: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface SetScoreDto {
  p1: number;
  p2: number;
}

export interface MatchDto {
  id: string;
  seasonId: string;
  leagueId: string;
  status: MatchStatusValue;
  format: MatchFormatValue;
  challengerId: string;
  player1: MatchPlayerDto;
  player2: MatchPlayerDto;
  scheduledAt: string | null;
  venue: { id: string; name: string; address: string; bookingUrl: string | null } | null;
  venueTextFallback: string | null;
  completedAt: string | null;
  resultWindowExpiresAt: string | null;
  createdAt: string;
  result: {
    sets: SetScoreDto[];
    winnerId: string;
    submittedById: string;
    submittedAt: string;
    plausibilityPassed: boolean;
    plausibilityNotes: string | null;
  } | null;
  validation: {
    validatedById: string;
    validatedAt: string;
    autoValidated: boolean;
  } | null;
  dispute: {
    status: DisputeStatusValue;
    openedById: string;
    resolvedById: string | null;
    resolution: string | null;
    createdAt: string;
  } | null;
  scoreDeltas: ScoreDeltaDto[];
}

export interface ScoreBreakdownDto {
  base: number;
  levelMult: number;
  resultMult: number;
  consistency: number;
  diversity: number;
  h2h: number;
  repeatPenalty: number;
  decay: number;
}

export interface ScoreDeltaDto {
  playerId: string;
  deltaPoints: number;
  breakdown: ScoreBreakdownDto;
  computedAt: string;
}

export function formatSets(sets: SetScoreDto[]): string {
  return sets.map((s) => `${s.p1}-${s.p2}`).join(' ');
}
