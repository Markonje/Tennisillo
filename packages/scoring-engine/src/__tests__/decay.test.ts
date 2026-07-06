import { decayPenalty } from '../components/decay';
import type { ScoringConfig } from '../types';

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

describe('decayPenalty (spec §8.10)', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 5],
    [4, 15],
    [5, 25],
    [9, 25], // capped
  ])('%i inactive weeks → -%i', (weeks, expected) => {
    expect(decayPenalty(weeks, config)).toBe(expected);
  });

  it('disabled decay always returns 0', () => {
    expect(decayPenalty(10, { ...config, decayEnabled: false })).toBe(0);
  });
});
