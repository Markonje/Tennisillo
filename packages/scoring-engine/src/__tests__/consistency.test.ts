import { consistencyBonus } from '../components/consistency';
import { winStreakBonus } from '../components/winStreak';

describe('consistencyBonus (spec §8.6)', () => {
  it.each([
    [0, 0],
    [1, 0],
    [2, 5],
    [3, 10],
    [4, 20],
    [7, 20],
  ])('%i matches in last 4 weeks → +%i', (matches, expected) => {
    expect(consistencyBonus(matches)).toBe(expected);
  });
});

describe('winStreakBonus (spec §8.6)', () => {
  it('first win → no bonus', () => {
    expect(winStreakBonus(0, [], 'oppA')).toBe(0);
  });

  it('2nd consecutive win vs distinct opponents → +10', () => {
    expect(winStreakBonus(1, ['oppA'], 'oppB')).toBe(10);
  });

  it('3rd consecutive win vs distinct opponents → +20', () => {
    expect(winStreakBonus(2, ['oppA', 'oppB'], 'oppC')).toBe(20);
  });

  it('4th and every further win → +30', () => {
    expect(winStreakBonus(3, ['oppA', 'oppB', 'oppC'], 'oppD')).toBe(30);
    expect(winStreakBonus(6, ['a', 'b', 'c', 'd', 'e', 'f'], 'oppG')).toBe(30);
  });

  it('beating an opponent already in the streak gives no bonus', () => {
    expect(winStreakBonus(2, ['oppA', 'oppB'], 'oppA')).toBe(0);
  });
});
