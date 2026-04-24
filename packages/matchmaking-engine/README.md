# @tennisillo/matchmaking-engine

Pure TypeScript query-oriented engine for Smart Match candidate ranking.

**Invariant:** zero framework dependencies. No I/O, no network calls.
Receives pre-fetched data and returns a ranked list of candidates.

**Implementation:** deferred to Sprint 5.
See `docs/specs/02_specifiche_sviluppo.md §6` for the full specification.

## Smart Match scoring dimensions

1. Level compatibility (±1 tier preferred)
2. Availability overlap (calendar slot intersection)
3. Diversity bonus (not over-playing the same opponent)
4. Frequency fit (candidate not already at max frequency)
5. Venue proximity (shared favorite venues)

Players without declared availability are still proposable at reduced priority.
