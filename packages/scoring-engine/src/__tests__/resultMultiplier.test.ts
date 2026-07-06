import { loserResistanceBonus, winnerResultMultiplier } from '../components/resultMultiplier';

describe('winnerResultMultiplier (spec §8.5)', () => {
  it('straight sets → ×1.2', () => {
    expect(
      winnerResultMultiplier([
        { winnerGames: 6, loserGames: 4 },
        { winnerGames: 6, loserGames: 3 },
      ]),
    ).toBe(1.2);
  });

  it('straight sets including a 7-6 tiebreak still counts as ×1.2 (per §8.12 example)', () => {
    expect(
      winnerResultMultiplier([
        { winnerGames: 6, loserGames: 4 },
        { winnerGames: 7, loserGames: 6 },
      ]),
    ).toBe(1.2);
  });

  it('2-1 win → ×1.0', () => {
    expect(
      winnerResultMultiplier([
        { winnerGames: 6, loserGames: 4 },
        { winnerGames: 4, loserGames: 6 },
        { winnerGames: 6, loserGames: 2 },
      ]),
    ).toBe(1.0);
  });

  it('2-1 win with a tiebreak set → ×1.05', () => {
    expect(
      winnerResultMultiplier([
        { winnerGames: 7, loserGames: 6 },
        { winnerGames: 4, loserGames: 6 },
        { winnerGames: 6, loserGames: 2 },
      ]),
    ).toBe(1.05);
  });

  it('win at the deciding super tiebreak → ×0.95', () => {
    expect(
      winnerResultMultiplier([
        { winnerGames: 6, loserGames: 3 },
        { winnerGames: 4, loserGames: 6 },
        { winnerGames: 10, loserGames: 7, superTiebreak: true },
      ]),
    ).toBe(0.95);
  });
});

describe('loserResistanceBonus (spec §8.5)', () => {
  it('lost 2-1 (forced the decider) → +15', () => {
    expect(
      loserResistanceBonus([
        { winnerGames: 6, loserGames: 4 },
        { winnerGames: 4, loserGames: 6 },
        { winnerGames: 6, loserGames: 2 },
      ]),
    ).toBe(15);
  });

  it('lost 2-0 but won at least 4 games → +5', () => {
    expect(
      loserResistanceBonus([
        { winnerGames: 6, loserGames: 3 },
        { winnerGames: 6, loserGames: 2 },
      ]),
    ).toBe(5);
  });

  it('lost 2-0 winning fewer than 4 games → 0', () => {
    expect(
      loserResistanceBonus([
        { winnerGames: 6, loserGames: 1 },
        { winnerGames: 6, loserGames: 2 },
      ]),
    ).toBe(0);
  });

  it('losing at the deciding super tiebreak still counts as forcing the decider → +15', () => {
    expect(
      loserResistanceBonus([
        { winnerGames: 6, loserGames: 1 },
        { winnerGames: 4, loserGames: 6 },
        { winnerGames: 10, loserGames: 8, superTiebreak: true },
      ]),
    ).toBe(15);
  });
});
