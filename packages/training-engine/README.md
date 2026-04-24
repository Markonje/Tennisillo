# @tennisillo/training-engine

Pure TypeScript engine for Sparring and Master Lesson training sessions.

**Invariant:** zero framework dependencies. No I/O, no `Date.now()` in core functions.
Same input → same output, always.

**Implementation:** deferred to Sprint 6.
See `docs/specs/02_specifiche_sviluppo.md §5` for the full specification.

## Critical constraints (from DOMAIN_RULES.md)

- Sparring awards **+12 fixed points per player** (configurable 5-15) from a
  dedicated `TrainingSession` record — never via `ScoreDelta`.
- Sparring is **capped** per player per week (default 2). Engine enforces the cap.
- Master Lesson awards **+20 XP** (configurable 10-30) to `globalExperiencePoints`
  only — never to season ranking points.
- Neither Sparring nor Master Lesson modifies `matchesLast4Weeks`, `winStreak`,
  `HeadToHead`, or `pairCount`.
