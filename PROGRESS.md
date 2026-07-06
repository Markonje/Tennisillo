# PROGRESS.md — Stato di avanzamento

> **Aggiornare questo file alla fine di ogni sessione di lavoro.**
> Claude Code lo legge all'inizio di ogni chat per sapere da dove ripartire.
> Formato: conciso, basato sui fatti.
> **Last updated**: 2026-07-06

---

## Sprint corrente

**Sprint**: MVP completion run (branch `feat/mvp-completion`, PR unica a fine lavori).
**Stato**: Sprint 3b ✅, Sprint 4 ✅, Sprint 5 ✅ completati.
**Prossimo**: Sprint 6 — Training: Sparring + Master Lesson.

### Sprint 5 — cosa è stato fatto (2026-07-06)
- **`packages/matchmaking-engine` completo**: types spec §6.2, `findCandidates` + 5 scorer (level, diversity, availability con matching asimmetrico 35, frequency semaforo, geo haversine) + aggregator pesato + `slotIntersection` (materialize/merge/subtract/intersect). 38 test, coverage 100%. `referenceDate` nel config per purezza (ADR 0006).
- **AvailabilityModule**: pattern ricorrente (griglia JSON su `AvailabilityPattern`), override AVAILABLE/UNAVAILABLE, overview di lega. Visibilità solo membri. 5 endpoint.
- **FrequencyModule**: upsert preferenza (ideale/max/unità), dettaglio owner con contatore periodo (settimana ISO / mese), **semaforo pubblico** senza numeri. Le partite programmate contano nel periodo.
- **VenuesModule**: CRUD admin (archive, mai delete), proposte giocatori con approvazione/rifiuto motivato admin + notifiche, campi preferiti (max 3 ordinati), geocoding Mapbox (503 senza `MAPBOX_TOKEN`, cache in-process). Guard dedicate venue/proposal→league admin.
- **MatchmakingModule**: `GET /seasons/:id/matchmaking/candidates` (+`requireAvailability`, `enableGeo`, `limit`) e `/slots`. Contesti da DB: pair count, frequenza, occupazione automatica (match SCHEDULED bloccano 2h di calendario), venue preferito per geo.
- **Flusso partita**: `venueId` strutturato in crea sfida/accetta/riprogramma (validato su venue ATTIVO della lega, retrocompatibile con testo libero); venue + link prenotazione nel dettaglio partita.
- **UI**: `/leagues/[id]/availability` (griglia settimanale 7×16 clic-toggle + eccezioni), `/frequency` (form + semaforo), `/venues` (lista, form admin/proposta, approvazioni admin, preferiti), `/matches/find` (Smart Match Panel: score, breakdown, semaforo, slot suggeriti, CTA sfida con prefill avversario+slot). Sidebar: 3 nuove voci. Selettore campo nel form sfida.
- **i18n**: blocchi `availability.*`, `frequency.*`, `venues.*`, `smartMatch.*` + `nav.*` EN/IT.
- **Test**: engine 38 (100% coverage), integrazione DB reale `sprint5.flow.int.ts` 4/4 (pattern/override → semaforo → venue+proposta+notifica → candidati Smart Match con slot intersecati corretti).
- ⚠️ Mappa Mapbox GL e caching Redis matchmaking rimandati (ADR 0006 §6-7).

### Sprint 4 — cosa è stato fatto (2026-07-06)
- **`packages/scoring-engine` completo**: 9 componenti puri (base, levelMultiplier, resultMultiplier, consistency, winStreak, diversity, headToHead, repeatPenalty, decay) + `pairMatchLimit` + `calculateMatchScore`. 83 test, coverage 100% statements / 95% branches. Test determinismo 1000 invocazioni.
- **Interpretazioni spec** (vedi ADR 0005): l'esempio §8.12 contraddice le tabelle §8.4/§8.5/§8.7 in 3 punti → vincono le tabelle (scenario §8.12 implementato: A +228, B +44 vs 235/38 dell'esempio). SOFT/HARD per interpolazione. Malus ripetizione piecewise sulle etichette spec. Semantica contatori: includono la partita corrente, streak/H2H pre-match.
- **`ScoringModule` (API)**: `ScoringService` raccoglie i contesti da DB (SOLO match competitivi — mai TrainingSession), esegue l'engine, persiste 2 righe `ScoreDelta` (breakdown JSON), aggiorna `SeasonPlayer.currentPoints/currentRank` e refresh in-place di `SeasonRanking`. Idempotente per match. Audit `SCORE_COMPUTED`.
- **Flusso asincrono**: coda BullMQ `scoring` + worker; senza Redis lo scoring gira **inline** alla validazione (engine puro/veloce, classifica sempre coerente).
- **Decay sweep settimanale**: `runDecaySweep()` con bookkeeping su AuditLog (`DECAY_APPLIED`, max 1/settimana/giocatore, floor 0 sul totale); job repeatable BullMQ `0 3 * * 1` solo con Redis. Eccezioni decay (pause/infortuni) non modellate → FAQ.
- **Anti-abuso §6.4 in `createChallenge`**: limite partite per coppia (dinamico `pairMatchLimit(N)` o `pairLimitOverride`) + cooldown rivincita `h2hCooldownDays` (default 7gg) → 409.
- **UI**: dettaglio partita mostra il breakdown punti per giocatore (trasparenza algoritmo, i18n `matches.points.*`); classifica stagione ora live (rimosso placeholder "Sprint 4").
- **Test integrazione aggiornato**: il flusso E2E su DB reale ora verifica anche ScoreDelta, punti, rank (5/5 verde, delta verificati a mano).
- ⚠️ Cooldown bonus rivalsa fisso 21gg (campo mancante in SeasonSettings); regola secondaria §8.8 non implementata (mitigata) — dettagli ADR 0005/FAQ.

### Sprint 3b — cosa è stato fatto (2026-07-06)
- **MatchesModule** (NestJS): 11 endpoint — crea sfida, lista/dettaglio, accept/decline/cancel/reschedule, submit result, confirm, dispute, resolve dispute (admin).
- Flusso stati: `PENDING_ACCEPTANCE → SCHEDULED → PENDING_RESULT → PENDING_VALIDATION → VALIDATED | DISPUTED`; transizioni esplicite, audit log su ogni mutazione.
- **Plausibility check** (`utils/score-validation.ts`, funzione pura, 23 test): rifiuta punteggi impossibili per formato (BEST_OF_1/3, SUPER_TIEBREAK, CUSTOM) con 400.
- **Time-window flag** (specs §7.2.2): risultato fuori finestra `resultWindowHours` → flag di revisione, mai rifiutato.
- **Auto-confirm 24h**: job ritardato BullMQ (`match-queue.service.ts` + worker) **più fallback lazy** — ogni lettura/azione su match `PENDING_VALIDATION` scaduto lo finalizza. Funziona anche senza Redis. ⚠️ REDIS_URL Upstash non ancora configurato (localhost placeholder): job proattivi disabilitati, correttezza garantita dal lazy check.
- **Doppia validazione**: il submitter non può confermare/contestare il proprio risultato; alla validazione aggiornati `SeasonPlayer` (wins/losses/matchesPlayed) e `HeadToHead` (coppia canonica per stagione). Nessun punto assegnato (Sprint 4).
- **Disputa base**: apertura con motivo (min 10 char), risoluzione admin `UPHELD` (risultato scartato → PENDING_RESULT) / `REJECTED` (risultato valido → VALIDATED), motivazione obbligatoria in audit.
- **Anti-abuso**: max 3 sfide `PENDING_ACCEPTANCE` per giocatore per stagione.
- **Notifiche in-app**: righe `Notification` per challenge/result/dispute (UI notifiche in Sprint 7).
- **UI**: `/leagues/[id]/seasons/[id]/matches` (lista + filtri segmented), `/matches/new` (form sfida), `/matches/[matchId]` (dettaglio con tutte le azioni per stato + form risultato dinamico + disputa + pannello admin). Dashboard stagione: KPI partite reale + sezione ultime 5 partite.
- **i18n**: blocchi `matches.*`, `challenges.*`, `dispute.*` in EN e IT.
- **apiClient** web: ora propaga i messaggi di errore del body API (per mostrare gli errori di plausibilità).
- **Fix codice invito** (known bug chiuso): generazione codice alla creazione lega, util `generateInviteCode` (charset non ambiguo, 8 char, retry unicità), migration backfill `20260522000000` (già applicata al DB), UI dashboard/settings.
- **Test**: 65 unit (jest) + 5 test integrazione contro DB reale (`__integration__/matches.flow.int.ts`, esclusi dalla CI, run: `pnpm --filter api exec jest --testMatch "**/*.int.ts"`).

---

## Known bug aperti

- Nessuno.

---

## Cosa c'è su `main`

### Infrastruttura
- Monorepo Turborepo + pnpm workspaces, TS strict, ESLint + Prettier
- CI GitHub Actions verde (lint + typecheck + test)
- Vercel deploy attivo: `https://tennisillo.vercel.app`
- Railway deploy API attivo
- pnpm-lock.yaml committato, postinstall `prisma generate` su packages/db
- Supabase: piano Free — si mette in pausa dopo 7 giorni di inattività. Resume manuale dal dashboard.

### apps/web
- Next.js 14 App Router, i18n EN/IT con next-intl
- Tailwind + design tokens custom
- **Architettura league-scoped**:
  - Landing autenticata = `/leagues`
  - Tutto vive sotto `/leagues/[id]/{page,members,settings,seasons}`
  - `/profile` globale
- **Sidebar dinamica**: voci diverse fuori/dentro lega via `usePathname`
- **Auth helpers**:
  - `src/lib/api-server.ts`: client server-side, propaga JWT dai cookie Supabase
  - `src/lib/api-client.ts`: client browser (patch e delete aggiunti in Sprint 3a)
- **Middleware** (hotfix PR #15): usa `getSession()` invece di `getUser()` — zero chiamate di rete su Edge Runtime, fix timeout Vercel
- **League context**: `LeagueProvider` + `useLeague()`
- **Season context**: `SeasonProvider` + `useSeason()`
- Pagine attive:
  - `(auth)/login`
  - `(app)/onboarding`
  - `(app)/leagues` — lista + join con codice
  - `(app)/leagues/new`
  - `(app)/leagues/[id]` — dashboard lega (KPI, membri, codice invito — BUG: invito non visibile)
  - `(app)/leagues/[id]/members`
  - `(app)/leagues/[id]/settings` (admin-only)
  - `(app)/leagues/[id]/seasons` — lista stagioni
  - `(app)/leagues/[id]/seasons/new` (admin-only)
  - `(app)/leagues/[id]/seasons/[seasonId]` — dashboard stagione
  - `(app)/leagues/[id]/seasons/[seasonId]/players`
  - `(app)/profile`

### apps/api (NestJS)
- **AuthN**: `SupabaseJwtGuard`, lazy sync utente da JWT
- **UsersModule**: `GET/PUT /users/me`, `GET /users/:id`, `POST /users/sync`
- **LeaguesModule**: CRUD lega, join, invite code, approvazione, settings
- **OnboardingModule**: `GET /onboarding/status`, `POST /onboarding/complete`
- **SeasonsModule** (Sprint 3a):
  - 10 endpoint: CRUD stagioni, transizioni stato, iscrizioni, players, ranking
  - `LeagueAdminGuard` + `SeasonAdminGuard`
  - `AuditService` globale
  - Macchina a stati: `DRAFT → REGISTRATION → ACTIVE → COMPLETED`
  - Snapshot `SeasonRanking` iniziale (tutti a 0) all'ingresso in `ACTIVE`
- ValidationPipe globale, DTO con class-validator

### packages
- `db`: schema Prisma v2.0 completo (21 modelli), migration `20260426221425_init` + `season_planned_duration` applicata
  - `Season.plannedDurationWeeks Int?` aggiunto
  - `SeasonRanking.rank Int?` reso nullable
- `shared-types`: aggiunto `SeasonStatus`, `SeasonSummary`, `SeasonPlayerEntry`, `computeOptimalDuration()` (funzione pura, 10/10 test)
- `scoring-engine`, `training-engine`, `matchmaking-engine`: scaffold con tipi (implementazione Sprint 4/5/6)
- `ui`: 19 componenti atom (Sprint UI v2 Phase 2) + 6 componenti dominio (Phase 2 untouched)

### i18n
- `it.json` e `en.json`: auth, onboarding, leagues, league, createLeague, profile, nav, seasons.*, season.*

---

## Storico PR mergiate

| PR | Titolo | Stato |
|---|---|---|
| #7 | feat(api,web): Sprint 2 — users + leagues + onboarding | ✅ merged |
| #12 | chore(web): rimozione `/ranking` globale | ✅ merged |
| #13 | feat(web): Sprint 2.5 — league-scoped architecture + auth fixes | ✅ merged |
| — | fix(db): `prisma` in `dependencies` per Railway | ✅ merged |
| #14 | feat(api,web): Sprint 3a — seasons CRUD + lifecycle | ✅ merged |
| #15 | fix(web): middleware Edge timeout (getUser → getSession) | ✅ merged |

---

## Smoke test E2E verificato (2026-05-22)

### Baseline Sprint 2.5 (15 punti)
1. ✅ Login
2. ✅ `/leagues` carica
3. ✅ Crea lega → redirect `/leagues/[id]`
4. ✅ Dashboard lega — KPI visibili (⚠️ codice invito non visibile — known bug)
5. ✅ Sidebar dinamica dentro/fuori lega
6. ✅ `/profile` carica
7. ✅ Logout

### Sprint 3a
8. ✅ Voce "Stagioni" in sidebar lega
9. ✅ Crea stagione → `DRAFT`
10. ✅ "Apri iscrizioni" → `REGISTRATION`
11. ✅ 2 utenti si iscrivono
12. ✅ "Avvia stagione" → `ACTIVE`, ranking a 0 punti
13. ✅ "Chiudi stagione" → `COMPLETED`
14. ✅ Lista stagioni mostra la stagione completata
15. ✅ Seconda stagione creabile dopo COMPLETED

---

## Decisioni architetturali emerse

1. **Landing autenticata = `/leagues`**: niente dashboard globale.
2. **Sidebar auto-fetch nome lega**: 1 GET leggero per pagina lega.
3. **Settings admin-only protetto server-side**: redirect per non-admin.
4. **`prisma` CLI in `dependencies`**: fix Railway con `NODE_ENV=production`.
5. **`getSession()` nel middleware**: zero chiamate di rete su Edge Runtime.
6. **`SeasonRanking.rank` nullable**: necessario per fase REGISTRATION (rank non ancora calcolato).
7. **Due guard separati** (`LeagueAdminGuard` + `SeasonAdminGuard`): più leggibili, usati su route diverse.
8. **Vincolo una stagione non-terminale per lega**: 409 se si tenta di crearne una seconda con stagione DRAFT/REGISTRATION/ACTIVE/PLAYOFFS attiva.

---

## Prossimi passi

### Sprint UI v2 — Design System Rewrite (branch: feat/sprint-ui-v2-design-rewrite)
- **Phase 1 ✅**: Foundation — tokens.ts (glass palette), tailwind.preset.ts (plugin CVA), globals.css, layout.tsx, ADR 004
- **Phase 2 ✅**: Atoms — 19 componenti rewriteati/creati con CVA + Tailwind (GlassCard, Button, Badge, Avatar, Toggle, GlassInput, GlassSelect, Textarea, SegmentedControl, StepDots, KpiCard, Banner, Modal, EmptyState, Toast, LogoMark, FrequencyBadge, TrainingSessionBadge, Skeleton); playground `/dev/playground`; sonner wrapper `apps/web/src/lib/toast.ts`; typecheck ✅ lint ✅
- **Phase 3 ✅**: App Shell — Sidebar glass rewriteata (`hidden md:flex`, sticky, `rounded-[22px]`, nav items CVA), MobileNav bottom bar (`md:hidden`, iOS safe area), PageWrapper client animazione `animate-fade-up`, layout shell Tailwind
- **Phase 4 ✅**: Page Migration — 16 file (auth layout, login, onboarding, profile, leagues, JoinByCodeForm, leagues/new, league dashboard, LeagueDashboardClient, members, LeagueSettingsClient, seasons, seasons/new, season dashboard, SeasonDashboardClient, players); zero inline styles; GlassInput/GlassSelect/Textarea/Button/Banner/Avatar/Badge/KpiCard/EmptyState/StepDots/LogoMark in uso; typecheck ✅ lint ✅
- **Phase 5 ✅**: Performance + polish — `bg-app` utility sostituisce inline gradient in root layout, `LogoutButton.tsx` eliminato (inutilizzato), `not-found.tsx` riscritto, `settings/page.tsx` inline h1 rimosso, Sidebar import deduplicato, `(app)/loading.tsx` skeleton aggiunto; typecheck ✅ lint ✅

### Sprint 3b — Matches & Challenges (PR #16)
Vedi ROADMAP.md per deliverable completi. In sintesi:
- `ChallengesModule` + `MatchesModule` (NestJS)
- Flusso: `PENDING_ACCEPTANCE → SCHEDULED → PENDING_RESULT → VALIDATED | DISPUTED`
- Auto-confirm 24h via BullMQ delayed job
- Plausibility check base (server-side)
- Disputa base (admin decide)
- Audit log ogni mutazione Match
- UI: lista partite, crea sfida, dettaglio partita, form risultato, form disputa
- **Criterio di done**: due giocatori si sfidano, inseriscono risultato, validazione automatica entro 24h

### Bug da fixare (non bloccanti per 3b)
- Codice invito non visibile nella dashboard lega

---

## Stato degli sprint

| Sprint | Obiettivo | Stato |
|---|---|---|
| Pre-Sprint 1 | Setup documentazione | ✅ Completo |
| Sprint 1 | Fondamenta | ✅ Completo |
| Sprint UI 1-4 | Design system (legacy) | ✅ Completo |
| Sprint UI v2 Phase 1 | Foundation (tokens, preset, globals, layout) | ✅ Completo |
| Sprint UI v2 Phase 2 | Atoms — 19 componenti CVA + playground | ✅ Completo |
| Sprint UI v2 Phase 3 | App Shell — sidebar + mobile shell | ✅ Completo |
| Sprint UI v2 Phase 4 | Page Migration — 16 file | ✅ Completo |
| Sprint UI v2 Phase 5 | Performance + polish | ✅ Completo |
| Sprint 2 | Utenti e Leghe | ✅ Completo (PR #7) |
| Sprint 2.5 | Architecture rework + auth fixes | ✅ Completo (PR #13) |
| Sprint 3a | Seasons | ✅ Completo (PR #14) |
| Sprint 3b | Matches & Challenges | ✅ Completo (branch feat/mvp-completion) |
| Sprint 4 | Scoring Engine | ✅ Completo (branch feat/mvp-completion) |
| Sprint 5 | Calendario, Frequenza, Anagrafica Campi | ✅ Completo (branch feat/mvp-completion) |
| Sprint 6 | Training: Sparring + Master Lesson | ⏳ Non iniziato |
| Sprint 7 | Gamification, Admin, Rifinitura | ⏳ Non iniziato |
