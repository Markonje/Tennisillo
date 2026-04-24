# @tennisillo/scoring-engine

Pure TypeScript scoring engine for competitive matches.

**Invariant:** zero framework dependencies. No I/O, no `Date.now()` in core functions.
Dates are passed as parameters. Same input → same output, always.

**Implementation:** deferred to Sprint 4.
See `docs/specs/02_specifiche_sviluppo.md §4` for the full specification.

## Formula

```
ΔP = P_BASE × M_LIVELLO × M_RISULTATO
   + B_COSTANZA + B_DIVERSIFICAZIONE + B_RIVALSA
   − MALUS_RIPETIZIONE − DECAY
```

`ΔP` is always ≥ 0 (clamped). Season total is always ≥ 0.

## Critical constraints (from DOMAIN_RULES.md)

- `matchesLast4Weeks` and `weeksInactiveConsecutive` count **only competitive Match records**.
  TrainingSession (Sparring / MasterLesson) must **never** be included.
- Sparring does **not** update `HeadToHead` or `pairCount`.
- Sparring and Master Lesson do **not** create `ScoreDelta` records.
