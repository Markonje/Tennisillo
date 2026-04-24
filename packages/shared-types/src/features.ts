// packages/shared-types/src/features.ts
// Source: docs/specs/02_specifiche_sviluppo.md §10.1

export const FEATURE_FLAGS = {
  // FREE tier
  CREATE_LEAGUE: 'create_league',
  JOIN_LEAGUES: 'join_leagues',
  BASIC_STATS: 'basic_stats',
  BASIC_RANKING: 'basic_ranking',
  // FREE [NEW-v2] — available in free tier
  SPARRING: 'sparring',
  AVAILABILITY_BASIC: 'availability_basic',
  FREQUENCY: 'frequency',
  VENUES_BASIC: 'venues_basic',

  // PREMIUM USER
  CREATE_UNLIMITED_LEAGUES: 'create_unlimited_leagues',
  JOIN_UNLIMITED_LEAGUES: 'join_unlimited_leagues',
  ADVANCED_STATS: 'advanced_stats',
  EXPORT_STATS: 'export_stats',
  NO_ADS: 'no_ads',
  PRIORITY_MATCHMAKING: 'priority_matchmaking',
  // PREMIUM USER [NEW-v2]
  CALENDAR_EXTERNAL_SYNC: 'calendar_external_sync',

  // PREMIUM LEAGUE
  LEAGUE_PLAYOFFS: 'league_playoffs',
  LEAGUE_CUSTOM_SCORING: 'league_custom_scoring',
  LEAGUE_GEO_VERIFICATION: 'league_geo_verification',
  LEAGUE_ADVANCED_ANTICHEAT: 'league_advanced_anticheat',
  LEAGUE_EXPORT: 'league_export',
  LEAGUE_UNLIMITED_MEMBERS: 'league_unlimited_members',
  // PREMIUM LEAGUE [NEW-v2]
  LEAGUE_MASTER_MODULE: 'league_master_module',
  LEAGUE_VENUES_ADVANCED: 'league_venues_advanced',

  // ADS
  SHOW_ADS: 'show_ads',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
