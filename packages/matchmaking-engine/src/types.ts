// packages/matchmaking-engine/src/types.ts
// Source: docs/specs/02_specifiche_sviluppo.md §6.2

export type PlayerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TimeSlot {
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  startMinute: number; // 0-1439
  endMinute: number; // 0-1439
}

export interface SpecificOverride {
  type: 'AVAILABLE' | 'UNAVAILABLE';
  startsAt: Date;
  endsAt: Date;
}

export interface AbsoluteSlot {
  startsAt: Date;
  endsAt: Date;
}

export interface CandidateContext {
  memberId: string;
  level: PlayerLevel;
  rating: number;
  availabilityPattern: TimeSlot[]; // may be empty
  availabilityOverrides: SpecificOverride[];
  // Frequency
  hasFrequencyDeclared: boolean;
  currentPeriodMatches: number; // matches already played in the period
  idealFrequency: number;
  maxFrequency: number;
  // Match history (current season)
  matchesWithRequesterThisSeason: number;
  lastMatchWithRequesterAt: Date | null;
  maxMatchesPerPair: number;
  // Geo (optional)
  favoriteVenueLat?: number;
  favoriteVenueLng?: number;
}

export interface RequesterContext {
  memberId: string;
  level: PlayerLevel;
  rating: number;
  // Slots to match against (next N days)
  availabilityPattern: TimeSlot[];
  availabilityOverrides: SpecificOverride[];
  favoriteVenueLat?: number;
  favoriteVenueLng?: number;
}

export interface MatchmakingConfig {
  horizonDays: number; // default 14
  maxCandidates: number; // default 20
  requireAvailabilityIntersection: boolean; // default false
  enableGeoScoring: boolean; // default false
  /**
   * Reference "now" for slot materialization. Required for engine purity
   * (no Date.now() inside the engine) — the API layer passes the request time.
   */
  referenceDate: Date;
  weights: {
    level: number; // default 0.25
    diversity: number; // default 0.20
    availability: number; // default 0.25
    frequency: number; // default 0.20
    geo: number; // default 0.10
  };
}

export type FrequencyStatus = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';

export interface CandidateResult {
  memberId: string;
  finalScore: number; // 0-100
  breakdown: {
    level: number;
    diversity: number;
    availability: number;
    frequency: number;
    geo: number;
  };
  suggestedSlots: AbsoluteSlot[]; // top 3 common slots
  frequencyStatus: FrequencyStatus;
  warnings: string[];
}

export const DEFAULT_WEIGHTS: MatchmakingConfig['weights'] = {
  level: 0.25,
  diversity: 0.2,
  availability: 0.25,
  frequency: 0.2,
  geo: 0.1,
};
