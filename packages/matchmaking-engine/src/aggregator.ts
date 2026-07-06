import type { MatchmakingConfig } from './types';

/** Weighted mean of sub-scores, normalized on the weight sum (specs/02 §6.5). */
export function aggregate(
  scores: { level: number; diversity: number; avail: number; freq: number; geo: number },
  weights: MatchmakingConfig['weights'],
): number {
  const weighted =
    scores.level * weights.level +
    scores.diversity * weights.diversity +
    scores.avail * weights.availability +
    scores.freq * weights.frequency +
    scores.geo * weights.geo;

  const sumWeights =
    weights.level + weights.diversity + weights.availability + weights.frequency + weights.geo;
  if (sumWeights <= 0) return 0;
  return Math.round(weighted / sumWeights);
}
