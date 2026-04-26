export type MatchStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'disputed';
export type MatchResult = 'win' | 'loss';
export type MatchType = 'match' | 'sparring';

export interface UpcomingMatch {
  id: string;
  date: string;
  month: string;
  opponentId: string;
  status: MatchStatus;
  time: string;
  venue: string;
}

export interface RecentMatch {
  id: string;
  date: string;
  opponentId: string;
  score: string;
  result: MatchResult;
}

export type Match = UpcomingMatch | RecentMatch;

export function isUpcomingMatch(m: Match): m is UpcomingMatch {
  return 'status' in m && 'month' in m;
}
