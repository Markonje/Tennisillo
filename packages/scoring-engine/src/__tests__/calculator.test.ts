import { calculateMatchScore } from '../calculator';
import type { ScoreCalculationInput, ScoringConfig } from '../types';

const config: ScoringConfig = {
  pointsWin: 100,
  pointsLoss: 30,
  levelMultiplierMode: 'NORMAL',
  bonusConsistencyEnabled: true,
  bonusDiversityEnabled: true,
  headToHeadEnabled: true,
  decayEnabled: true,
  decayStartWeek: 3,
  decayPointsPerWeek: [5, 15, 25],
  rivalCooldownDays: 21,
  maxMatchesPerPair: 0,
};

/**
 * Scenario from spec §8.12: A (Silver, 3) beats B (Gold, 4) 6-4 7-6.
 * A: 3 matches in last 4 weeks, diversity index 0.75, first meeting with B,
 *    3rd consecutive win against distinct opponents.
 * B: 2 matches in last 4 weeks.
 *
 * NOTE — the worked example in the spec contradicts its own normative tables
 * (§8.4, §8.5, §8.7). This test asserts the TABLE-normative values; the
 * discrepancies are documented in docs/context/FAQ.md:
 * - A's diversity: index 0.75 → +8 per the §8.7 table (example says +15).
 * - B lost against an opponent 1 level BELOW → ×0.8 per the §8.4 loser table
 *   (the example applies ×1.1, the "lost against +1" value).
 * - B qualifies for +10 first-meeting (§8.7 is per-player) and +5 resistance
 *   (lost 2-0 winning ≥4 games, §8.5) which the example omits.
 */
function exampleInput(): ScoreCalculationInput {
  return {
    matchId: 'm1',
    winnerId: 'A',
    loserId: 'B',
    config,
    winner: {
      seasonPlayerId: 'A',
      level: 3,
      rating: 1700,
      matchesLast4Weeks: 3,
      // 3 unique opponents / min(4 matches, 15) = 0.75 → +8 per table
      uniqueOpponentsThisSeason: ['X', 'Y', 'B'],
      totalMatchesThisSeason: 4,
      currentWinStreak: 2,
      winStreakOpponentIds: ['X', 'Y'],
      weeksInactiveConsecutive: 0,
      pausesUsed: 0,
    },
    loser: {
      seasonPlayerId: 'B',
      level: 4,
      rating: 2100,
      matchesLast4Weeks: 2,
      uniqueOpponentsThisSeason: ['A'],
      totalMatchesThisSeason: 5,
      currentWinStreak: 0,
      winStreakOpponentIds: [],
      weeksInactiveConsecutive: 0,
      pausesUsed: 0,
    },
    h2h: { matchesBetweenPairThisSeason: 0, lastWinnerId: null, lastRivalBonusAt: null },
    matchDate: new Date('2026-06-01T18:00:00Z'),
    sets: [
      { winnerGames: 6, loserGames: 4 },
      { winnerGames: 7, loserGames: 6 },
    ],
    activePlayersInSeason: 16,
  };
}

describe('calculateMatchScore — spec §8.12 scenario', () => {
  it('computes the winner per the normative tables', () => {
    const out = calculateMatchScore(exampleInput());

    // 100 ×1.5 = 150 ×1.2 = 180 (matches the example exactly)
    expect(out.winner.breakdown.base).toBe(100);
    expect(out.winner.breakdown.levelMult).toBe(50);
    expect(out.winner.breakdown.resultMult).toBe(30);
    // +10 consistency (3 matches) +20 streak (3rd distinct win)
    expect(out.winner.breakdown.consistency).toBe(30);
    // +8 index 0.75 (table §8.7) +10 first meeting
    expect(out.winner.breakdown.diversity).toBe(18);
    expect(out.winner.breakdown.h2h).toBe(0);
    expect(out.winner.breakdown.repeatPenalty).toBe(0);
    expect(out.winner.breakdown.decay).toBe(0);
    // 180 + 30 + 18 = 228 (example says 235 due to its diversity discrepancy)
    expect(out.winner.deltaTotal).toBe(228);
  });

  it('computes the loser per the normative tables', () => {
    const out = calculateMatchScore(exampleInput());

    // 30 ×0.8 = 24 (lost against -1 level, §8.4 loser table) → -6
    expect(out.loser.breakdown.base).toBe(30);
    expect(out.loser.breakdown.levelMult).toBe(-6);
    // lost 2-0 but won 10 games → +5 resistance (§8.5)
    expect(out.loser.breakdown.resultMult).toBe(5);
    // 2 matches in last 4 weeks → +5
    expect(out.loser.breakdown.consistency).toBe(5);
    // 1 unique / min(5, 15) = 0.2 → 0, +10 first meeting
    expect(out.loser.breakdown.diversity).toBe(10);
    expect(out.loser.breakdown.h2h).toBe(0);
    // 24 + 5 + 5 + 10 = 44 (example says 38 — see the header note)
    expect(out.loser.deltaTotal).toBe(44);
  });
});

describe('calculateMatchScore — behaviour', () => {
  it('rival bonus is reported for cooldown bookkeeping', () => {
    const input = exampleInput();
    input.h2h = {
      matchesBetweenPairThisSeason: 1,
      lastWinnerId: 'B',
      lastRivalBonusAt: null,
    };
    const out = calculateMatchScore(input);
    // A beats the player who last beat them → revenge +25
    expect(out.winner.breakdown.h2h).toBe(25);
    expect(out.rivalBonusApplied).toBe(true);
  });

  it('disabled bonuses zero out their components', () => {
    const input = exampleInput();
    input.config = {
      ...config,
      bonusConsistencyEnabled: false,
      bonusDiversityEnabled: false,
      headToHeadEnabled: false,
    };
    const out = calculateMatchScore(input);
    expect(out.winner.breakdown.consistency).toBe(0);
    expect(out.winner.breakdown.diversity).toBe(0);
    expect(out.winner.breakdown.h2h).toBe(0);
    expect(out.winner.deltaTotal).toBe(180);
  });

  it('OFF level multiplier keeps base points untouched', () => {
    const input = exampleInput();
    input.config = { ...config, levelMultiplierMode: 'OFF' };
    const out = calculateMatchScore(input);
    expect(out.winner.breakdown.levelMult).toBe(0);
    expect(out.loser.breakdown.levelMult).toBe(0);
  });

  it('deltaTotal is clamped at 0 (never negative)', () => {
    const input = exampleInput();
    // heavy repeat penalty + decay on a low-value loss
    input.config = { ...config, pointsLoss: 5 };
    input.loser.matchesLast4Weeks = 1;
    input.loser.uniqueOpponentsThisSeason = ['A'];
    input.loser.totalMatchesThisSeason = 6;
    input.loser.weeksInactiveConsecutive = 6;
    input.h2h.matchesBetweenPairThisSeason = 5; // beyond the limit → -30
    const out = calculateMatchScore(input);
    expect(out.loser.deltaTotal).toBe(0);
  });

  it('applies the decay component when the player returns after inactivity', () => {
    const input = exampleInput();
    input.winner.weeksInactiveConsecutive = 4;
    const out = calculateMatchScore(input);
    expect(out.winner.breakdown.decay).toBe(15);
  });

  it('is deterministic: same input → same output for 1000 invocations', () => {
    const first = calculateMatchScore(exampleInput());
    for (let i = 0; i < 1000; i++) {
      expect(calculateMatchScore(exampleInput())).toEqual(first);
    }
  });
});
