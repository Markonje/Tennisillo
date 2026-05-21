export interface SeasonDurationInput {
  playerCount: number;
  /** Admin override in weeks; clamped to [6, 52] if present. */
  adminOverrideWeeks?: number;
}

export interface SeasonDurationResult {
  weeks: number;
  source: 'FORMULA' | 'ADMIN_OVERRIDE' | 'MIN_FLOOR' | 'MAX_CEIL';
}

export function computeOptimalDuration(input: SeasonDurationInput): SeasonDurationResult {
  const { playerCount, adminOverrideWeeks } = input;

  if (playerCount < 0) {
    throw new Error('playerCount must be non-negative');
  }

  if (adminOverrideWeeks !== undefined) {
    const weeks = Math.max(6, Math.min(52, adminOverrideWeeks));
    return { weeks, source: 'ADMIN_OVERRIDE' };
  }

  const raw = playerCount * 0.8;
  const ceilRaw = Math.ceil(raw);
  const weeks = Math.max(8, Math.min(24, ceilRaw));

  let source: SeasonDurationResult['source'];
  if (ceilRaw <= 8) {
    source = 'MIN_FLOOR';
  } else if (ceilRaw >= 24) {
    source = 'MAX_CEIL';
  } else {
    source = 'FORMULA';
  }

  return { weeks, source };
}
