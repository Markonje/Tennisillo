import { calculateSparring } from '../sparring';
import { calculateMasterLesson } from '../masterLesson';
import { xpToGlobalRatingDelta } from '../xpCurve';
import { getIsoWeekBounds, isWithinSparringCap } from '../capChecker';
import type { SparringCalculationInput } from '../types';

const sparringInput = (
  overrides: Partial<SparringCalculationInput> = {},
): SparringCalculationInput => ({
  config: { pointsPerPlayer: 12, weeklyCapPerPlayer: 2 },
  player1Id: 'p1',
  player2Id: 'p2',
  player1SparringThisWeek: 0,
  player2SparringThisWeek: 0,
  ...overrides,
});

describe('calculateSparring (spec 01 §9.1)', () => {
  it('awards the fixed reward to both players, no multipliers', () => {
    expect(calculateSparring(sparringInput())).toEqual({
      accepted: true,
      pointsP1: 12,
      pointsP2: 12,
    });
  });

  it('rejects when P1 reached the weekly cap', () => {
    const out = calculateSparring(sparringInput({ player1SparringThisWeek: 2 }));
    expect(out).toEqual({
      accepted: false,
      rejectionReason: 'CAP_REACHED_P1',
      pointsP1: 0,
      pointsP2: 0,
    });
  });

  it('rejects when P2 reached the weekly cap', () => {
    const out = calculateSparring(sparringInput({ player2SparringThisWeek: 2 }));
    expect(out.rejectionReason).toBe('CAP_REACHED_P2');
  });

  it('respects extreme point configurations (5 and 15)', () => {
    expect(
      calculateSparring(
        sparringInput({ config: { pointsPerPlayer: 5, weeklyCapPerPlayer: 2 } }),
      ).pointsP1,
    ).toBe(5);
    expect(
      calculateSparring(
        sparringInput({ config: { pointsPerPlayer: 15, weeklyCapPerPlayer: 2 } }),
      ).pointsP2,
    ).toBe(15);
  });

  it('cap 1 rejects the second weekly sparring', () => {
    const out = calculateSparring(
      sparringInput({
        config: { pointsPerPlayer: 12, weeklyCapPerPlayer: 1 },
        player1SparringThisWeek: 1,
      }),
    );
    expect(out.accepted).toBe(false);
  });
});

describe('xpToGlobalRatingDelta (spec 02 §5.4)', () => {
  it.each([
    [0, 10], // < 100 → 0.5
    [99, 10],
    [100, 6], // < 500 → 0.3
    [499, 6],
    [500, 3], // < 1500 → 0.15
    [1499, 3],
    [1500, 1], // >= 1500 → 0.05
    [5000, 1],
  ])('currentXp %i → delta %d for 20 XP', (currentXp, expected) => {
    expect(xpToGlobalRatingDelta(20, currentXp)).toBe(expected);
  });

  it('rounds to 2 decimals', () => {
    expect(xpToGlobalRatingDelta(13, 0)).toBe(6.5);
    expect(xpToGlobalRatingDelta(13, 200)).toBe(3.9);
  });
});

describe('calculateMasterLesson', () => {
  it('awards configured XP and the curve-adjusted rating delta', () => {
    const out = calculateMasterLesson({
      config: { xpPerSession: 20 },
      playerId: 'p1',
      masterId: 'm1',
      playerCurrentXp: 0,
    });
    expect(out).toEqual({ xpAwarded: 20, globalRatingDelta: 10 });
  });

  it('diminishing returns across the 4 bands', () => {
    const at = (xp: number) =>
      calculateMasterLesson({
        config: { xpPerSession: 20 },
        playerId: 'p1',
        masterId: 'm1',
        playerCurrentXp: xp,
      }).globalRatingDelta;
    expect(at(0)).toBeGreaterThan(at(100));
    expect(at(100)).toBeGreaterThan(at(500));
    expect(at(500)).toBeGreaterThan(at(1500));
  });
});

describe('isWithinSparringCap', () => {
  it('true below the cap, false at the cap', () => {
    expect(isWithinSparringCap(0, 2)).toBe(true);
    expect(isWithinSparringCap(1, 2)).toBe(true);
    expect(isWithinSparringCap(2, 2)).toBe(false);
  });
});

describe('getIsoWeekBounds', () => {
  it('returns Monday 00:00 to Sunday 23:59:59.999 local time', () => {
    // Wednesday 2026-06-03
    const { start, end } = getIsoWeekBounds(new Date(2026, 5, 3, 15, 30));
    expect(start).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2026, 5, 7, 23, 59, 59, 999));
  });

  it('handles the Sunday edge (still the same ISO week)', () => {
    const { start } = getIsoWeekBounds(new Date(2026, 5, 7, 10, 0));
    expect(start).toEqual(new Date(2026, 5, 1, 0, 0, 0, 0));
  });

  it('handles the Monday edge (starts a new ISO week)', () => {
    const { start } = getIsoWeekBounds(new Date(2026, 5, 8, 0, 0));
    expect(start).toEqual(new Date(2026, 5, 8, 0, 0, 0, 0));
  });
});

describe('determinism', () => {
  it('same input → same output for 1000 invocations', () => {
    const input = sparringInput({ player1SparringThisWeek: 1 });
    const first = calculateSparring(input);
    const lesson = {
      config: { xpPerSession: 25 },
      playerId: 'p1',
      masterId: 'm1',
      playerCurrentXp: 300,
    };
    const firstLesson = calculateMasterLesson(lesson);
    for (let i = 0; i < 1000; i++) {
      expect(calculateSparring(input)).toEqual(first);
      expect(calculateMasterLesson(lesson)).toEqual(firstLesson);
    }
  });
});
