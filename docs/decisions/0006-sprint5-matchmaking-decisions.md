# ADR 0006 — Sprint 5: availability, venue e matchmaking — decisioni implementative

- **Stato**: accettato
- **Data**: 2026-07-06
- **Contesto**: Sprint 5 — Calendario disponibilità, Frequenza, Anagrafica Campi, Smart Match.

## Decisioni

### 1. Endpoint "me" con prefisso lega

La spec (02 §7.3) definisce endpoint come `PUT /members/me/availability/pattern`,
ma un `LeagueMember` è identificato da (leagueId, userId): il "me" da solo è
ambiguo. Gli endpoint "me" sono quindi league-scoped:
`/leagues/:leagueId/members/me/availability/pattern`, `/leagues/:leagueId/members/me/frequency`,
`/leagues/:leagueId/members/me/favorite-venues`. Gli endpoint con `:memberId`
esplicito e quelli su risorse (override, venue, proposal) restano come da spec.

### 2. `referenceDate` nel MatchmakingConfig

La firma spec di `findCandidates()` non passa il "now" necessario a
materializzare gli slot, violando la regola "niente Date.now() negli engine"
(CLAUDE.md). Aggiunto `config.referenceDate: Date`: l'API passa l'ora della
richiesta, l'engine resta puro e deterministico.

### 3. Scorer senza tabella in spec

- `diversityScorer`: 0 precedenti → 100, 1 → 60, 2 → 30, 3+ → 10.
- `geoScorer`: coordinate mancanti → 50 (neutro); distanza haversine
  ≤5km → 100, ≤15 → 75, ≤30 → 50, ≤50 → 25, oltre → 10.

### 4. Occupazione automatica come override

Le partite `SCHEDULED` bloccano il calendario (spec 01 §10.1.3) iniettando
override `UNAVAILABLE` di **2 ore** dalla `scheduledAt` nella costruzione dei
contesti di matchmaking. Sparring/lezioni verranno aggiunti in Sprint 6 con lo
stesso meccanismo.

### 5. Frequenza: le partite programmate contano

`currentPeriodMatches` conta le partite non annullate con `scheduledAt` (o
`completedAt`) nel periodo corrente, incluse quelle solo programmate: una
partita già fissata "occupa" la frequenza anche se non ancora giocata.
Settimana ISO (lunedì 00:00) per unità WEEKLY, mese solare per MONTHLY.

### 6. Geocoding Mapbox opzionale, cache in-process

`POST /venues/geocode` richiede `MAPBOX_TOKEN`; senza token risponde 503 e le
coordinate si inseriscono manualmente (lat/lng editabili come da spec §11.3).
Cache in-process (`Map`) al posto di Redis finché Upstash non è configurato —
gli indirizzi sono effettivamente immutabili. La mappa visuale Mapbox GL nella
pagina campi è rimandata a quando esisterà l'account Mapbox (lista comunque
completa e funzionale).

### 7. Niente caching Redis del matchmaking (per ora)

Le ottimizzazioni di specs/02 §6.6 (cache slot 6h, availability vector) hanno
senso da ~100 membri per lega. Rimandate a Sprint 7 (performance) o a quando
Redis sarà attivo.
