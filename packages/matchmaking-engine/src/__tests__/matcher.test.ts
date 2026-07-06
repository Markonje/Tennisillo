import { findCandidates } from '../matcher';
import { scoreLevel } from '../scorers/levelScorer';
import { scoreDiversity } from '../scorers/diversityScorer';
import { scoreFrequency } from '../scorers/frequencyScorer';
import { scoreGeo, haversineKm } from '../scorers/geoScorer';
import { aggregate } from '../aggregator';
import { DEFAULT_WEIGHTS } from '../types';
import type { CandidateContext, MatchmakingConfig, RequesterContext } from '../types';

const MONDAY_8 = new Date(2026, 5, 1, 8, 0, 0, 0);

const config: MatchmakingConfig = {
  horizonDays: 14,
  maxCandidates: 20,
  requireAvailabilityIntersection: false,
  enableGeoScoring: false,
  referenceDate: MONDAY_8,
  weights: DEFAULT_WEIGHTS,
};

const requester: RequesterContext = {
  memberId: 'me',
  level: 3,
  rating: 1700,
  availabilityPattern: [{ dayOfWeek: 2, startMinute: 18 * 60, endMinute: 20 * 60 }],
  availabilityOverrides: [],
};

function candidate(overrides: Partial<CandidateContext> = {}): CandidateContext {
  return {
    memberId: 'cand',
    level: 3,
    rating: 1650,
    availabilityPattern: [{ dayOfWeek: 2, startMinute: 17 * 60, endMinute: 21 * 60 }],
    availabilityOverrides: [],
    hasFrequencyDeclared: true,
    currentPeriodMatches: 0,
    idealFrequency: 2,
    maxFrequency: 3,
    matchesWithRequesterThisSeason: 0,
    lastMatchWithRequesterAt: null,
    maxMatchesPerPair: 4,
    ...overrides,
  };
}

describe('scoreLevel (specs/02 §6.4)', () => {
  it.each([
    [3, 3, 100],
    [3, 4, 80],
    [3, 5, 40],
    [3, 6, 10],
    [1, 7, 10],
  ] as const)('levels %i vs %i → %i', (a, b, expected) => {
    expect(scoreLevel(a, b)).toBe(expected);
  });
});

describe('scoreDiversity', () => {
  it.each([
    [0, 100],
    [1, 60],
    [2, 30],
    [5, 10],
  ])('%i previous pair matches → %i', (matches, expected) => {
    expect(scoreDiversity(matches)).toBe(expected);
  });
});

describe('scoreFrequency', () => {
  it('UNKNOWN when not declared', () => {
    expect(scoreFrequency(candidate({ hasFrequencyDeclared: false }))).toEqual({
      score: 50,
      status: 'UNKNOWN',
      warnings: [],
    });
  });

  it('GREEN under ideal frequency', () => {
    expect(scoreFrequency(candidate({ currentPeriodMatches: 1, idealFrequency: 2 })).status).toBe(
      'GREEN',
    );
  });

  it('YELLOW between ideal and max', () => {
    expect(scoreFrequency(candidate({ currentPeriodMatches: 2 })).status).toBe('YELLOW');
  });

  it('RED at max frequency, with warning', () => {
    const r = scoreFrequency(candidate({ currentPeriodMatches: 3 }));
    expect(r.status).toBe('RED');
    expect(r.warnings).toContain('MAX_FREQUENCY_REACHED');
    expect(r.score).toBe(5);
  });
});

describe('scoreGeo', () => {
  it('neutral 50 when coordinates are missing', () => {
    expect(scoreGeo(requester, candidate())).toBe(50);
  });

  it('haversine distance is sane (Bologna → Modena ≈ 38km)', () => {
    const km = haversineKm(44.4949, 11.3426, 44.6471, 10.9252);
    expect(km).toBeGreaterThan(30);
    expect(km).toBeLessThan(45);
  });

  it('scores by distance band', () => {
    const geoReq = { ...requester, favoriteVenueLat: 44.0, favoriteVenueLng: 11.0 };
    const at = (lat: number) => candidate({ favoriteVenueLat: lat, favoriteVenueLng: 11.0 });
    // 1 degree of latitude ≈ 111 km
    expect(scoreGeo(geoReq, at(44.0))).toBe(100); // 0 km
    expect(scoreGeo(geoReq, at(44.09))).toBe(75); // ~10 km
    expect(scoreGeo(geoReq, at(44.2))).toBe(50); // ~22 km
    expect(scoreGeo(geoReq, at(44.36))).toBe(25); // ~40 km
    expect(scoreGeo(geoReq, at(45.0))).toBe(10); // ~111 km
  });
});

describe('aggregate', () => {
  it('is a weighted mean normalized on weight sum', () => {
    expect(
      aggregate({ level: 100, diversity: 100, avail: 100, freq: 100, geo: 100 }, DEFAULT_WEIGHTS),
    ).toBe(100);
    expect(
      aggregate({ level: 0, diversity: 0, avail: 0, freq: 0, geo: 0 }, DEFAULT_WEIGHTS),
    ).toBe(0);
  });

  it('degenerate zero weights return 0', () => {
    expect(
      aggregate(
        { level: 100, diversity: 100, avail: 100, freq: 100, geo: 100 },
        { level: 0, diversity: 0, availability: 0, frequency: 0, geo: 0 },
      ),
    ).toBe(0);
  });
});

describe('findCandidates', () => {
  it('excludes the requester and pairs at the match limit', () => {
    const results = findCandidates(
      requester,
      [
        candidate({ memberId: 'me' }),
        candidate({ memberId: 'maxed', matchesWithRequesterThisSeason: 4 }),
        candidate({ memberId: 'ok' }),
      ],
      config,
    );
    expect(results.map((r) => r.memberId)).toEqual(['ok']);
  });

  it('ranks the ideal candidate first', () => {
    const results = findCandidates(
      requester,
      [
        candidate({ memberId: 'perfect' }),
        candidate({ memberId: 'wrong-level', level: 6 }),
        candidate({ memberId: 'saturated', currentPeriodMatches: 3 }),
        candidate({ memberId: 'repeat', matchesWithRequesterThisSeason: 2 }),
      ],
      config,
    );
    expect(results[0]?.memberId).toBe('perfect');
    expect(results[0]?.finalScore).toBeGreaterThan(results[1]?.finalScore ?? 0);
  });

  it('suggests top intersection slots', () => {
    const results = findCandidates(requester, [candidate()], config);
    expect(results[0]?.suggestedSlots.length).toBeGreaterThan(0);
    const slot = results[0]?.suggestedSlots[0];
    // Tuesday 18:00-20:00 is the common window
    expect(slot?.startsAt.getHours()).toBe(18);
    expect(slot?.endsAt.getHours()).toBe(20);
  });

  it('asymmetric matching: candidate without calendar is kept with reduced score', () => {
    const results = findCandidates(
      requester,
      [
        candidate({ memberId: 'with-cal' }),
        candidate({ memberId: 'no-cal', availabilityPattern: [], availabilityOverrides: [] }),
      ],
      config,
    );
    expect(results.map((r) => r.memberId)).toEqual(['with-cal', 'no-cal']);
    const noCal = results.find((r) => r.memberId === 'no-cal');
    expect(noCal?.breakdown.availability).toBe(35);
  });

  it('requireAvailabilityIntersection drops zero-intersection candidates', () => {
    const results = findCandidates(
      requester,
      [
        candidate({
          memberId: 'incompatible',
          availabilityPattern: [{ dayOfWeek: 5, startMinute: 8 * 60, endMinute: 9 * 60 }],
        }),
      ],
      { ...config, requireAvailabilityIntersection: true },
    );
    expect(results).toEqual([]);
  });

  it('respects maxCandidates', () => {
    const many = Array.from({ length: 30 }, (_, i) => candidate({ memberId: `c${i}` }));
    const results = findCandidates(requester, many, { ...config, maxCandidates: 5 });
    expect(results).toHaveLength(5);
  });

  it('is deterministic', () => {
    const cands = [candidate({ memberId: 'a' }), candidate({ memberId: 'b', level: 4 })];
    const first = findCandidates(requester, cands, config);
    for (let i = 0; i < 100; i++) {
      expect(findCandidates(requester, cands, config)).toEqual(first);
    }
  });

  it('geo scoring participates when enabled', () => {
    const geoReq = { ...requester, favoriteVenueLat: 44.0, favoriteVenueLng: 11.0 };
    const results = findCandidates(
      geoReq,
      [candidate({ favoriteVenueLat: 44.0, favoriteVenueLng: 11.0 })],
      { ...config, enableGeoScoring: true },
    );
    expect(results[0]?.breakdown.geo).toBe(100);
  });

  it('requester without calendar gets neutral availability against declared candidates', () => {
    const noCalRequester = {
      ...requester,
      availabilityPattern: [],
      availabilityOverrides: [],
    };
    const results = findCandidates(noCalRequester, [candidate()], config);
    expect(results[0]?.breakdown.availability).toBe(50);
    expect(results[0]?.suggestedSlots).toEqual([]);
  });
});
