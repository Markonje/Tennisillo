import type { CandidateContext, RequesterContext } from '../types';

const EARTH_RADIUS_KM = 6371;

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}

/**
 * Geographic proximity between favorite venues (spec 01 §6.3, optional).
 * Missing coordinates on either side → neutral 50.
 * Distance steps: ≤5km 100 · ≤15km 75 · ≤30km 50 · ≤50km 25 · else 10.
 */
export function scoreGeo(requester: RequesterContext, candidate: CandidateContext): number {
  if (
    requester.favoriteVenueLat === undefined ||
    requester.favoriteVenueLng === undefined ||
    candidate.favoriteVenueLat === undefined ||
    candidate.favoriteVenueLng === undefined
  ) {
    return 50;
  }

  const km = haversineKm(
    requester.favoriteVenueLat,
    requester.favoriteVenueLng,
    candidate.favoriteVenueLat,
    candidate.favoriteVenueLng,
  );
  if (km <= 5) return 100;
  if (km <= 15) return 75;
  if (km <= 30) return 50;
  if (km <= 50) return 25;
  return 10;
}
