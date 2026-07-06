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
}

export function formatSets(sets: SetScoreDto[]): string {
  return sets.map((s) => `${s.p1}-${s.p2}`).join(' ');
}
