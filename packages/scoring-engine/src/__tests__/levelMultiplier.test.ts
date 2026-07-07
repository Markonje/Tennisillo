import { levelMultiplier } from '../components/levelMultiplier';

describe('levelMultiplier', () => {
  describe('NORMAL mode — winner (spec §8.4)', () => {
    it.each([
      [3, 6, 2.5], // +3 levels: heroic win
      [3, 5, 2.0], // +2
      [3, 4, 1.5], // +1
      [3, 3, 1.0], // baseline
      [4, 3, 0.7], // -1
      [5, 3, 0.5], // -2
      [6, 3, 0.3], // -3
      [7, 1, 0.3], // clamped beyond -3
      [1, 7, 2.5], // clamped beyond +3
    ] as const)('player %i vs opponent %i → ×%d', (player, opponent, expected) => {
      expect(levelMultiplier(player, opponent, true, 'NORMAL')).toBeCloseTo(expected);
    });
  });

  describe('NORMAL mode — loser (spec §8.4)', () => {
    it.each([
      [3, 5, 1.2], // lost vs +2 or more
      [3, 6, 1.2],
      [3, 4, 1.1], // lost vs +1
      [3, 3, 1.0],
      [4, 3, 0.8], // lost vs -1: should have won
      [5, 3, 0.6], // lost vs -2 or more
      [7, 1, 0.6],
    ] as const)('player %i loses vs opponent %i → ×%d', (player, opponent, expected) => {
      expect(levelMultiplier(player, opponent, false, 'NORMAL')).toBeCloseTo(expected);
    });
  });

  it('OFF mode always returns 1.0', () => {
    expect(levelMultiplier(1, 7, true, 'OFF')).toBe(1.0);
    expect(levelMultiplier(7, 1, false, 'OFF')).toBe(1.0);
  });

  it('SOFT halves the distance from 1.0', () => {
    expect(levelMultiplier(3, 4, true, 'SOFT')).toBeCloseTo(1.25); // normal 1.5
    expect(levelMultiplier(4, 3, true, 'SOFT')).toBeCloseTo(0.85); // normal 0.7
  });

  it('HARD amplifies the distance from 1.0 by 1.5', () => {
    expect(levelMultiplier(3, 4, true, 'HARD')).toBeCloseTo(1.75); // normal 1.5
    expect(levelMultiplier(4, 3, true, 'HARD')).toBeCloseTo(0.55); // normal 0.7
  });
});
