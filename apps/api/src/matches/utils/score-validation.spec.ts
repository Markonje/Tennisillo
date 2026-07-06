import { MatchFormat } from '@tennisillo/db';
import { validateScore } from './score-validation';

describe('validateScore', () => {
  describe('structural checks', () => {
    it('rejects empty sets', () => {
      const r = validateScore([], MatchFormat.BEST_OF_3);
      expect(r.valid).toBe(false);
      expect(r.winner).toBeNull();
    });

    it('rejects negative games', () => {
      const r = validateScore([{ p1: -1, p2: 6 }], MatchFormat.BEST_OF_1);
      expect(r.valid).toBe(false);
    });

    it('rejects non-integer games', () => {
      const r = validateScore([{ p1: 6.5, p2: 4 }], MatchFormat.BEST_OF_1);
      expect(r.valid).toBe(false);
    });

    it('rejects tied sets', () => {
      const r = validateScore([{ p1: 6, p2: 6 }], MatchFormat.BEST_OF_1);
      expect(r.valid).toBe(false);
    });
  });

  describe('BEST_OF_1', () => {
    it('accepts 6-4', () => {
      const r = validateScore([{ p1: 6, p2: 4 }], MatchFormat.BEST_OF_1);
      expect(r.valid).toBe(true);
      expect(r.winner).toBe(1);
    });

    it('accepts 7-6 (tiebreak set)', () => {
      const r = validateScore([{ p1: 6, p2: 7 }], MatchFormat.BEST_OF_1);
      expect(r.valid).toBe(true);
      expect(r.winner).toBe(2);
    });

    it('rejects 6-5', () => {
      expect(validateScore([{ p1: 6, p2: 5 }], MatchFormat.BEST_OF_1).valid).toBe(false);
    });

    it('rejects 8-6', () => {
      expect(validateScore([{ p1: 8, p2: 6 }], MatchFormat.BEST_OF_1).valid).toBe(false);
    });

    it('rejects two sets', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 4 },
          { p1: 6, p2: 4 },
        ],
        MatchFormat.BEST_OF_1,
      );
      expect(r.valid).toBe(false);
    });
  });

  describe('BEST_OF_3', () => {
    it('accepts a straight-sets win 6-4 6-3', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 4 },
          { p1: 6, p2: 3 },
        ],
        MatchFormat.BEST_OF_3,
      );
      expect(r.valid).toBe(true);
      expect(r.winner).toBe(1);
    });

    it('accepts a comeback 4-6 7-5 7-6', () => {
      const r = validateScore(
        [
          { p1: 4, p2: 6 },
          { p1: 7, p2: 5 },
          { p1: 7, p2: 6 },
        ],
        MatchFormat.BEST_OF_3,
      );
      expect(r.valid).toBe(true);
      expect(r.winner).toBe(1);
    });

    it('rejects one set only', () => {
      expect(validateScore([{ p1: 6, p2: 4 }], MatchFormat.BEST_OF_3).valid).toBe(false);
    });

    it('rejects a third set after 2-0', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 4 },
          { p1: 6, p2: 4 },
          { p1: 6, p2: 4 },
        ],
        MatchFormat.BEST_OF_3,
      );
      expect(r.valid).toBe(false);
    });

    it('rejects split sets without a decider', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 4 },
          { p1: 4, p2: 6 },
        ],
        MatchFormat.BEST_OF_3,
      );
      expect(r.valid).toBe(false);
    });

    it('rejects impossible set 7-2', () => {
      const r = validateScore(
        [
          { p1: 7, p2: 2 },
          { p1: 6, p2: 4 },
        ],
        MatchFormat.BEST_OF_3,
      );
      expect(r.valid).toBe(false);
    });
  });

  describe('SUPER_TIEBREAK', () => {
    it('accepts two straight sets', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 3 },
          { p1: 7, p2: 5 },
        ],
        MatchFormat.SUPER_TIEBREAK,
      );
      expect(r.valid).toBe(true);
      expect(r.winner).toBe(1);
    });

    it('accepts split sets + super tiebreak 10-7', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 3 },
          { p1: 4, p2: 6 },
          { p1: 10, p2: 7 },
        ],
        MatchFormat.SUPER_TIEBREAK,
      );
      expect(r.valid).toBe(true);
      expect(r.winner).toBe(1);
    });

    it('accepts extended super tiebreak 12-10', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 3 },
          { p1: 4, p2: 6 },
          { p1: 10, p2: 12 },
        ],
        MatchFormat.SUPER_TIEBREAK,
      );
      expect(r.valid).toBe(true);
      expect(r.winner).toBe(2);
    });

    it('rejects super tiebreak 10-9', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 3 },
          { p1: 4, p2: 6 },
          { p1: 10, p2: 9 },
        ],
        MatchFormat.SUPER_TIEBREAK,
      );
      expect(r.valid).toBe(false);
    });

    it('rejects split sets without decider', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 3 },
          { p1: 4, p2: 6 },
        ],
        MatchFormat.SUPER_TIEBREAK,
      );
      expect(r.valid).toBe(false);
    });

    it('rejects a decider after 2-0', () => {
      const r = validateScore(
        [
          { p1: 6, p2: 3 },
          { p1: 6, p2: 4 },
          { p1: 10, p2: 5 },
        ],
        MatchFormat.SUPER_TIEBREAK,
      );
      expect(r.valid).toBe(false);
    });
  });

  describe('CUSTOM', () => {
    it('accepts arbitrary but sane scores', () => {
      const r = validateScore(
        [
          { p1: 4, p2: 2 },
          { p1: 4, p2: 1 },
        ],
        MatchFormat.CUSTOM,
      );
      expect(r.valid).toBe(true);
      expect(r.winner).toBe(1);
    });

    it('rejects implausible game counts', () => {
      const r = validateScore([{ p1: 99, p2: 1 }], MatchFormat.CUSTOM);
      expect(r.valid).toBe(false);
    });

    it('rejects an even set split', () => {
      const r = validateScore(
        [
          { p1: 4, p2: 2 },
          { p1: 1, p2: 4 },
        ],
        MatchFormat.CUSTOM,
      );
      expect(r.valid).toBe(false);
    });
  });

  it('is deterministic: same input, same output', () => {
    const sets = [
      { p1: 6, p2: 4 },
      { p1: 3, p2: 6 },
      { p1: 7, p2: 5 },
    ];
    const first = validateScore(sets, MatchFormat.BEST_OF_3);
    for (let i = 0; i < 100; i++) {
      expect(validateScore(sets, MatchFormat.BEST_OF_3)).toEqual(first);
    }
  });
});
