export type PlayerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type FrequencyStatus = 'green' | 'yellow' | 'red' | 'unknown';

export interface Player {
  id: string;
  name: string;
  initials: string;
  hue: string;
  level: PlayerLevel;
  points: number;
  ranking: number;
  variation: number;
  winRate: number;
  matches: number;
  wins: number;
  losses: number;
}

export interface PlayerStatus {
  freq: FrequencyStatus;
  weeklyPlayed: number;
  weeklyMax: number;
  hot: boolean;
}
