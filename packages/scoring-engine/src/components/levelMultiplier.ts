import type { LevelMultiplierMode, PlayerLevel } from '../types';

/**
 * M_LIVELLO (spec §8.4). NORMAL is the normative table; SOFT halves the
 * distance from 1.0 and HARD amplifies it by 1.5 (see ADR 0005 — the spec
 * names the modes without numeric tables).
 */

const WINNER_NORMAL: Record<string, number> = {
  '3': 2.5, // opponent 3+ levels above: heroic win
  '2': 2.0,
  '1': 1.5,
  '0': 1.0,
  '-1': 0.7,
  '-2': 0.5,
  '-3': 0.3, // expected win, little merit
};

const LOSER_NORMAL: Record<string, number> = {
  '3': 1.2, // lost against much stronger (2+ levels)
  '2': 1.2,
  '1': 1.1,
  '0': 1.0,
  '-1': 0.8,
  '-2': 0.6, // heavy defeat (2+ levels below)
  '-3': 0.6,
};

function clampDiff(diff: number): string {
  return String(Math.max(-3, Math.min(3, diff)));
}

function scale(normal: number, mode: LevelMultiplierMode): number {
  switch (mode) {
    case 'OFF':
      return 1.0;
    case 'SOFT':
      return 1 + (normal - 1) * 0.5;
    case 'HARD':
      return 1 + (normal - 1) * 1.5;
    case 'NORMAL':
      return normal;
  }
}

/** diff = opponentLevel - playerLevel */
export function levelMultiplier(
  playerLevel: PlayerLevel,
  opponentLevel: PlayerLevel,
  isWinner: boolean,
  mode: LevelMultiplierMode,
): number {
  const diff = clampDiff(opponentLevel - playerLevel);
  const table = isWinner ? WINNER_NORMAL : LOSER_NORMAL;
  const normal = table[diff] ?? 1.0;
  return scale(normal, mode);
}
