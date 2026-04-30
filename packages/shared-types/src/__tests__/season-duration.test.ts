import { computeOptimalDuration } from '../season-duration';

describe('computeOptimalDuration', () => {
  it('5 players → 8 weeks (MIN_FLOOR)', () => {
    const result = computeOptimalDuration({ playerCount: 5 });
    expect(result).toEqual({ weeks: 8, source: 'MIN_FLOOR' });
  });

  it('10 players → 8 weeks (MIN_FLOOR)', () => {
    const result = computeOptimalDuration({ playerCount: 10 });
    expect(result).toEqual({ weeks: 8, source: 'MIN_FLOOR' });
  });

  it('16 players → 13 weeks (FORMULA, ceil of 12.8)', () => {
    const result = computeOptimalDuration({ playerCount: 16 });
    expect(result).toEqual({ weeks: 13, source: 'FORMULA' });
  });

  it('20 players → 16 weeks (FORMULA)', () => {
    const result = computeOptimalDuration({ playerCount: 20 });
    expect(result).toEqual({ weeks: 16, source: 'FORMULA' });
  });

  it('30 players → 24 weeks (MAX_CEIL)', () => {
    const result = computeOptimalDuration({ playerCount: 30 });
    expect(result).toEqual({ weeks: 24, source: 'MAX_CEIL' });
  });

  it('adminOverrideWeeks 4 → clamped to 6 (ADMIN_OVERRIDE)', () => {
    const result = computeOptimalDuration({ playerCount: 10, adminOverrideWeeks: 4 });
    expect(result).toEqual({ weeks: 6, source: 'ADMIN_OVERRIDE' });
  });

  it('adminOverrideWeeks 100 → clamped to 52 (ADMIN_OVERRIDE)', () => {
    const result = computeOptimalDuration({ playerCount: 10, adminOverrideWeeks: 100 });
    expect(result).toEqual({ weeks: 52, source: 'ADMIN_OVERRIDE' });
  });

  it('adminOverrideWeeks 10 with 30 players → override wins (ADMIN_OVERRIDE)', () => {
    const result = computeOptimalDuration({ playerCount: 30, adminOverrideWeeks: 10 });
    expect(result).toEqual({ weeks: 10, source: 'ADMIN_OVERRIDE' });
  });

  it('playerCount -1 → throws', () => {
    expect(() => computeOptimalDuration({ playerCount: -1 })).toThrow(
      'playerCount must be non-negative',
    );
  });

  it('playerCount 0 → 8 weeks (MIN_FLOOR)', () => {
    const result = computeOptimalDuration({ playerCount: 0 });
    expect(result).toEqual({ weeks: 8, source: 'MIN_FLOOR' });
  });
});
