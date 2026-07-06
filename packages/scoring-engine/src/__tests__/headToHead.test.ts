import { headToHeadBonus } from '../components/headToHead';

const DAY = 24 * 60 * 60 * 1000;
const matchDate = new Date('2026-06-01T18:00:00Z');

describe('headToHeadBonus (spec §8.8)', () => {
  it('no previous pair match → no bonus', () => {
    const r = headToHeadBonus(
      'A',
      { matchesBetweenPairThisSeason: 0, lastWinnerId: null, lastRivalBonusAt: null },
      matchDate,
      21,
    );
    expect(r).toEqual({ points: 0, applied: false });
  });

  it('revenge: previous loser wins the rematch → +25', () => {
    const r = headToHeadBonus(
      'B',
      { matchesBetweenPairThisSeason: 1, lastWinnerId: 'A', lastRivalBonusAt: null },
      matchDate,
      21,
    );
    expect(r).toEqual({ points: 25, applied: true });
  });

  it('dominance: previous winner wins again → +15', () => {
    const r = headToHeadBonus(
      'A',
      { matchesBetweenPairThisSeason: 1, lastWinnerId: 'A', lastRivalBonusAt: null },
      matchDate,
      21,
    );
    expect(r).toEqual({ points: 15, applied: true });
  });

  it('cooldown: bonus applied less than 21 days ago → no bonus', () => {
    const r = headToHeadBonus(
      'B',
      {
        matchesBetweenPairThisSeason: 2,
        lastWinnerId: 'A',
        lastRivalBonusAt: new Date(matchDate.getTime() - 10 * DAY),
      },
      matchDate,
      21,
    );
    expect(r).toEqual({ points: 0, applied: false });
  });

  it('cooldown elapsed → bonus applies again', () => {
    const r = headToHeadBonus(
      'B',
      {
        matchesBetweenPairThisSeason: 2,
        lastWinnerId: 'A',
        lastRivalBonusAt: new Date(matchDate.getTime() - 25 * DAY),
      },
      matchDate,
      21,
    );
    expect(r).toEqual({ points: 25, applied: true });
  });
});
