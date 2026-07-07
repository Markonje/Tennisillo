// packages/training-engine/src/index.ts
// Pure, deterministic engine for non-competitive sessions (Sparring, Master Lesson).
// See: docs/specs/02_specifiche_sviluppo.md §5

export type {
  SparringConfig,
  SparringCalculationInput,
  SparringCalculationOutput,
  SparringRejectionReason,
  MasterLessonConfig,
  MasterLessonCalculationInput,
  MasterLessonCalculationOutput,
} from './types';

export { calculateSparring } from './sparring';
export { calculateMasterLesson } from './masterLesson';
export { xpToGlobalRatingDelta } from './xpCurve';
export { isWithinSparringCap, getIsoWeekBounds } from './capChecker';
