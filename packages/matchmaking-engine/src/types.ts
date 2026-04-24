// packages/matchmaking-engine/src/types.ts
// Implementation deferred to Sprint 5.
// See: docs/specs/02_specifiche_sviluppo.md §6

export interface AvailabilitySlot {
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday
  startMinute: number; // 0-1439
  endMinute: number;   // 0-1439
}

export interface CandidateInput {
  requesterId: string; // LeagueMember.id of the player seeking a match
  leagueId: string;
  seasonId: string;
  requesterLevel: number;        // 1-7
  requesterSlots: AvailabilitySlot[];
  requesterIdealFrequency: number;
  requesterFrequencyUnit: 'WEEKLY' | 'MONTHLY';
  requesterMatchesThisPeriod: number;
  requesterFavoriteVenueIds: string[];
  excludePlayerIds: string[];    // already challenged / pending
  asOfDate: Date;
}

export interface CandidateScorer {
  playerId: string; // LeagueMember.id
  level: number;
  slots: AvailabilitySlot[];
  matchesThisPeriod: number;
  maxFrequency: number;
  favoriteVenueIds: string[];
  uniqueOpponentsThisSeason: string[];
  totalOpponentsInLeague: number;
}

export interface CandidateScore {
  playerId: string;
  totalScore: number; // 0-100 normalised
  breakdown: {
    levelCompatibility: number;
    availabilityOverlap: number;
    diversityBonus: number;
    frequencyFit: number;
    venueProximity: number;
  };
}

export interface MatchmakingOutput {
  candidates: CandidateScore[]; // sorted by totalScore desc
}
