// packages/matchmaking-engine/src/index.ts
// Pure, deterministic Smart Match engine.
// See: docs/specs/02_specifiche_sviluppo.md §6

export type {
  PlayerLevel,
  TimeSlot,
  SpecificOverride,
  AbsoluteSlot,
  CandidateContext,
  RequesterContext,
  MatchmakingConfig,
  CandidateResult,
  FrequencyStatus,
} from './types';
export { DEFAULT_WEIGHTS } from './types';

export { findCandidates } from './matcher';
export { aggregate } from './aggregator';
export { scoreLevel } from './scorers/levelScorer';
export { scoreDiversity } from './scorers/diversityScorer';
export { scoreAvailability } from './scorers/availabilityScorer';
export { scoreFrequency } from './scorers/frequencyScorer';
export { scoreGeo, haversineKm } from './scorers/geoScorer';
export {
  materializeSlots,
  mergeSlots,
  subtractSlots,
  intersectSlots,
} from './utils/slotIntersection';
