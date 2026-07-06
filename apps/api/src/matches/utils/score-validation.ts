import { MatchFormat } from '@tennisillo/db';

export interface SetScore {
  p1: number;
  p2: number;
}

export interface ScoreValidationResult {
  valid: boolean;
  /** 1 | 2 — derived winner; null when invalid */
  winner: 1 | 2 | null;
  errors: string[];
}

const SUPER_TIEBREAK_TARGET = 10;

function isValidRegularSet(a: number, b: number): boolean {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (hi === 6) return lo <= 4;
  if (hi === 7) return lo === 5 || lo === 6;
  return false;
}

function isValidSuperTiebreak(a: number, b: number): boolean {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (hi === SUPER_TIEBREAK_TARGET) return lo <= 8;
  // beyond 10 the tiebreak must be won by exactly 2 points
  return hi > SUPER_TIEBREAK_TARGET && hi - lo === 2;
}

function setWinner(set: SetScore): 1 | 2 | null {
  if (set.p1 === set.p2) return null;
  return set.p1 > set.p2 ? 1 : 2;
}

/**
 * Plausibility check for a submitted score (specs/01 §7.2.3).
 * Rejects scores that are impossible under the match format rules.
 * CUSTOM format only checks structural sanity (non-negative, a winner exists).
 */
export function validateScore(
  sets: SetScore[],
  format: MatchFormat,
): ScoreValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(sets) || sets.length === 0) {
    return { valid: false, winner: null, errors: ['At least one set is required'] };
  }

  for (const [i, set] of sets.entries()) {
    if (!Number.isInteger(set.p1) || !Number.isInteger(set.p2)) {
      errors.push(`Set ${i + 1}: games must be integers`);
    } else if (set.p1 < 0 || set.p2 < 0) {
      errors.push(`Set ${i + 1}: games cannot be negative`);
    } else if (setWinner(set) === null) {
      errors.push(`Set ${i + 1}: a set cannot end in a tie`);
    }
  }
  if (errors.length > 0) return { valid: false, winner: null, errors };

  let setsP1 = 0;
  let setsP2 = 0;
  for (const set of sets) {
    if (setWinner(set) === 1) setsP1 += 1;
    else setsP2 += 1;
  }
  const overallWinner: 1 | 2 = setsP1 > setsP2 ? 1 : 2;
  const lastSet = sets[sets.length - 1] as SetScore;

  switch (format) {
    case MatchFormat.BEST_OF_1: {
      const only = sets[0];
      if (sets.length !== 1 || !only) {
        errors.push('BEST_OF_1 requires exactly 1 set');
      } else if (!isValidRegularSet(only.p1, only.p2)) {
        errors.push('Set 1: impossible tennis set score');
      }
      break;
    }

    case MatchFormat.BEST_OF_3: {
      if (sets.length < 2 || sets.length > 3) {
        errors.push('BEST_OF_3 requires 2 or 3 sets');
        break;
      }
      for (const [i, set] of sets.entries()) {
        if (!isValidRegularSet(set.p1, set.p2)) {
          errors.push(`Set ${i + 1}: impossible tennis set score`);
        }
      }
      const target = 2;
      if (Math.max(setsP1, setsP2) !== target) {
        errors.push('Winner must take exactly 2 sets');
      }
      if (sets.length === 3 && (setsP1 === 0 || setsP2 === 0)) {
        errors.push('A third set cannot exist after a 2-0 lead');
      }
      // the deciding/last set must be won by the overall winner
      if (errors.length === 0 && setWinner(lastSet) !== overallWinner) {
        errors.push('The last set must be won by the match winner');
      }
      break;
    }

    case MatchFormat.SUPER_TIEBREAK: {
      // two regular sets; if 1-1, a 10-point super tiebreak decides
      const [s1, s2, s3] = sets;
      if (sets.length < 2 || sets.length > 3 || !s1 || !s2) {
        errors.push('SUPER_TIEBREAK requires 2 or 3 sets');
        break;
      }
      for (const [i, set] of [s1, s2].entries()) {
        if (!isValidRegularSet(set.p1, set.p2)) {
          errors.push(`Set ${i + 1}: impossible tennis set score`);
        }
      }
      if (!s3) {
        if (setWinner(s1) !== setWinner(s2)) {
          errors.push('With split sets a deciding super tiebreak is required');
        }
      } else {
        if (setWinner(s1) === setWinner(s2)) {
          errors.push('A super tiebreak cannot exist after a 2-0 lead');
        }
        if (!isValidSuperTiebreak(s3.p1, s3.p2)) {
          errors.push('Set 3: impossible super tiebreak score');
        }
        if (errors.length === 0 && setWinner(s3) !== overallWinner) {
          errors.push('The super tiebreak must be won by the match winner');
        }
      }
      break;
    }

    case MatchFormat.CUSTOM: {
      // structural sanity only: bounded game counts
      for (const [i, set] of sets.entries()) {
        if (set.p1 > 30 || set.p2 > 30) {
          errors.push(`Set ${i + 1}: implausible game count`);
        }
      }
      if (setsP1 === setsP2) {
        errors.push('Match cannot end in a set tie');
      }
      break;
    }
  }

  if (errors.length > 0) return { valid: false, winner: null, errors };
  return { valid: true, winner: overallWinner, errors: [] };
}
