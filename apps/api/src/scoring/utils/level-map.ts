import { PlayerLevel as DbPlayerLevel } from '@tennisillo/db';
import type { PlayerLevel as EnginePlayerLevel } from '@tennisillo/scoring-engine';

const LEVEL_MAP: Record<DbPlayerLevel, EnginePlayerLevel> = {
  [DbPlayerLevel.ROOKIE]: 1,
  [DbPlayerLevel.BRONZE]: 2,
  [DbPlayerLevel.SILVER]: 3,
  [DbPlayerLevel.GOLD]: 4,
  [DbPlayerLevel.PLATINUM]: 5,
  [DbPlayerLevel.DIAMOND]: 6,
  [DbPlayerLevel.ELITE]: 7,
};

export function toEngineLevel(level: DbPlayerLevel): EnginePlayerLevel {
  return LEVEL_MAP[level];
}
