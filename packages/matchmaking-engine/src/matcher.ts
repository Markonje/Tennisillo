import type {
  CandidateContext,
  CandidateResult,
  MatchmakingConfig,
  RequesterContext,
} from './types';
import { scoreLevel } from './scorers/levelScorer';
import { scoreDiversity } from './scorers/diversityScorer';
import { scoreAvailability } from './scorers/availabilityScorer';
import { scoreFrequency } from './scorers/frequencyScorer';
import { scoreGeo } from './scorers/geoScorer';
import { aggregate } from './aggregator';

/**
 * Smart Match entry point (specs/02 §6.3): scores every candidate against
 * the requester and returns them sorted by descending acceptance likelihood.
 * Pure and deterministic — the reference time arrives via config.referenceDate.
 */
export function findCandidates(
  requester: RequesterContext,
  candidates: CandidateContext[],
  config: MatchmakingConfig,
): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const cand of candidates) {
    // hard filters
    if (cand.memberId === requester.memberId) continue;
    if (cand.matchesWithRequesterThisSeason >= cand.maxMatchesPerPair) {
      continue; // pair limit reached
    }

    const level = scoreLevel(requester.level, cand.level);
    const diversity = scoreDiversity(cand.matchesWithRequesterThisSeason);
    const avail = scoreAvailability(requester, cand, config.horizonDays, config.referenceDate);
    const freq = scoreFrequency(cand);
    const geo = config.enableGeoScoring ? scoreGeo(requester, cand) : 50;

    if (config.requireAvailabilityIntersection && avail.score === 0) continue;

    const finalScore = aggregate(
      { level, diversity, avail: avail.score, freq: freq.score, geo },
      config.weights,
    );

    results.push({
      memberId: cand.memberId,
      finalScore,
      breakdown: {
        level,
        diversity,
        availability: avail.score,
        frequency: freq.score,
        geo,
      },
      suggestedSlots: avail.topSlots,
      frequencyStatus: freq.status,
      warnings: freq.warnings,
    });
  }

  return results.sort((a, b) => b.finalScore - a.finalScore).slice(0, config.maxCandidates);
}
