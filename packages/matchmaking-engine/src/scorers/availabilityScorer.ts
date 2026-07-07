import type { AbsoluteSlot, CandidateContext, RequesterContext } from '../types';
import { intersectSlots, materializeSlots } from '../utils/slotIntersection';

export interface AvailabilityScore {
  score: number;
  topSlots: AbsoluteSlot[];
}

/**
 * Calendar slot intersection (specs/02 §6.4). Asymmetric matching: a
 * candidate with no declared availability gets a reduced but non-zero score
 * (spec 01 §10.2 — never exclude players who do not use the calendar).
 */
export function scoreAvailability(
  requester: RequesterContext,
  candidate: CandidateContext,
  horizonDays: number,
  referenceDate: Date,
): AvailabilityScore {
  if (
    candidate.availabilityPattern.length === 0 &&
    candidate.availabilityOverrides.length === 0
  ) {
    return { score: 35, topSlots: [] };
  }

  // a requester without declared slots cannot intersect: neutral score
  if (
    requester.availabilityPattern.length === 0 &&
    requester.availabilityOverrides.length === 0
  ) {
    return { score: 50, topSlots: [] };
  }

  const requesterSlots = materializeSlots(requester, horizonDays, referenceDate);
  const candidateSlots = materializeSlots(candidate, horizonDays, referenceDate);
  const intersection = intersectSlots(requesterSlots, candidateSlots);

  if (intersection.length === 0) {
    return { score: 0, topSlots: [] };
  }

  const totalHours = intersection.reduce(
    (sum, s) => sum + (s.endsAt.getTime() - s.startsAt.getTime()) / 3_600_000,
    0,
  );
  return {
    score: Math.min(100, totalHours * 10),
    topSlots: intersection.slice(0, 3),
  };
}
