import type { PlayerLevel } from '../types';

/** Level compatibility (specs/02 §6.4): max at equal level, low beyond ±2. */
export function scoreLevel(a: PlayerLevel, b: PlayerLevel): number {
  const diff = Math.abs(a - b);
  if (diff === 0) return 100;
  if (diff === 1) return 80;
  if (diff === 2) return 40;
  return 10;
}
