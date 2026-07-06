import { repeatPenalty } from '../components/repeatPenalty';
import { pairMatchLimit } from '../utils/pairLimit';

describe('pairMatchLimit (spec §8.9)', () => {
  it.each([
    [4, 5],
    [6, 4],
    [8, 4],
    [10, 3],
    [16, 3],
    [25, 2],
    [36, 2],
  ])('%i players → limit %i', (players, expected) => {
    expect(pairMatchLimit(players)).toBe(expected);
  });

  it('degenerate league sizes fall back to the strictest limit', () => {
    expect(pairMatchLimit(0)).toBe(2);
    expect(pairMatchLimit(-3)).toBe(2);
  });
});

describe('repeatPenalty (spec §8.9)', () => {
  // league of 8 → limit 4
  it('first pair match → no malus', () => {
    expect(repeatPenalty(0, 8, 0)).toBe(0);
  });

  it('intermediate pair match → -8', () => {
    expect(repeatPenalty(1, 8, 0)).toBe(8); // match 2 of 4
  });

  it('penultimate pair match → -18', () => {
    expect(repeatPenalty(2, 8, 0)).toBe(18); // match 3 of 4
  });

  it('last allowed pair match → -30', () => {
    expect(repeatPenalty(3, 8, 0)).toBe(30); // match 4 of 4
  });

  it('beyond the limit clamps at -30', () => {
    expect(repeatPenalty(9, 8, 0)).toBe(30);
  });

  it('admin override takes precedence over the dynamic limit', () => {
    // override limit 2: second match is already the last one
    expect(repeatPenalty(1, 8, 2)).toBe(30);
  });

  it('limit 2 has no intermediate step', () => {
    expect(repeatPenalty(0, 30, 0)).toBe(0); // 30 players → limit 2
    expect(repeatPenalty(1, 30, 0)).toBe(30);
  });
});
