export type SeasonStatus =
  | 'DRAFT'
  | 'REGISTRATION'
  | 'ACTIVE'
  | 'PLAYOFFS'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface SeasonSummary {
  id: string;
  leagueId: string;
  name: string;
  status: SeasonStatus;
  startsAt: string | null;
  endsAt: string | null;
  maxPlayers: number | null;
  plannedDurationWeeks: number | null;
  playerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SeasonPlayerEntry {
  id: string;
  memberId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  currentPoints: number;
  currentRank: number | null;
  matchesPlayed: number;
  wins: number;
  losses: number;
  isEligible: boolean;
  joinedAt: string;
}

export interface SeasonRankingEntry {
  id: string;
  playerId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  points: number;
  rank: number | null;
  computedAt: string;
}
