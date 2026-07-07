import { diversityBonus, firstMeetingBonus } from '../components/diversity';

describe('diversityBonus (spec §8.7)', () => {
  it('index ≥ 0.8 → +15', () => {
    // 4 unique / min(5, 9) = 0.8
    expect(diversityBonus(4, 5, 10)).toBe(15);
  });

  it('index ≥ 0.6 → +8', () => {
    // 3 unique / min(5, 9) = 0.6
    expect(diversityBonus(3, 5, 10)).toBe(8);
  });

  it('index ≥ 0.4 → +3', () => {
    // 2 unique / min(5, 9) = 0.4
    expect(diversityBonus(2, 5, 10)).toBe(3);
  });

  it('index < 0.4 → 0', () => {
    // 1 unique / min(5, 9) = 0.2
    expect(diversityBonus(1, 5, 10)).toBe(0);
  });

  it('small league normalisation: playing everyone gives the full bonus', () => {
    // league of 5: 4 unique opponents / min(12, 4) = 1.0
    expect(diversityBonus(4, 12, 5)).toBe(15);
  });

  it('no matches → 0', () => {
    expect(diversityBonus(0, 0, 10)).toBe(0);
  });
});

describe('firstMeetingBonus (spec §8.7)', () => {
  it('first match against this opponent this season → +10', () => {
    expect(firstMeetingBonus(0)).toBe(10);
  });

  it('rematch → 0', () => {
    expect(firstMeetingBonus(1)).toBe(0);
    expect(firstMeetingBonus(3)).toBe(0);
  });
});
