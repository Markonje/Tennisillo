# ROADMAP.md — Sprint e milestone

> Pianificazione di sviluppo. Fonte: `docs/specs/02_specifiche_sviluppo.md` §12.
> Lo stato operativo corrente sta in [`PROGRESS.md`](./PROGRESS.md).
> Questo file elenca, per ogni sprint, **deliverable misurabili** e **riferimenti** alle
> sezioni di specifica da leggere prima di iniziare.

---

## Pre-Sprint 1 — Setup documentazione

**Obiettivo**: avere il repo pronto a ricevere codice con tutto il contesto documentale
già scritto.

**Deliverable**:
- [x] `CLAUDE.md`, `PROGRESS.md`, `ROADMAP.md`, `README.md`.
- [x] Scaffolding `docs/specs`, `docs/decisions`, `docs/context`, `tools/`.
- [x] `tools/normalize_specs.py` (utility di conversione Word→Markdown).
- [x] `CHANGELOG_SPECS.md` (scheletro).
- [x] `docs/context/{GLOSSARY,DOMAIN_RULES,FAQ}.md`.
- [x] 3 ADR iniziali (monorepo, Supabase, engine separati).
- [x] Specifiche v2.0 in Markdown (`docs/specs/01_*.md`, `02_*.md`) — già presenti nel repo (generate prima di questa sessione).
- [x] Repo Git pubblicato su GitHub privato.
- [x] Account cloud creati: Supabase, Vercel, Railway. Pendenti: Upstash, Cloudflare R2, Resend, Mapbox.
- [x] Nome del prodotto definito: **Tennisillo**.

---

## Sprint 1 — Fondamenta (2 settimane)

**Leggi prima**: specs/02 §1, §2, §3 (schema Prisma).

**Deliverable**:
- [x] Setup Turborepo + pnpm workspaces.
- [x] Scaffolding `apps/web` (Next.js 14 App Router, TS strict, Tailwind, shadcn/ui, next-intl).
- [x] Scaffolding `apps/api` (NestJS + PrismaModule + SupabaseJwtGuard).
- [x] Scaffolding pacchetti `packages/db`, `packages/scoring-engine`, `packages/training-engine`, `packages/matchmaking-engine`, `packages/shared-types`, `packages/ui`.
- [x] Schema Prisma completo v2.0 — validabile con `prisma validate` (migration in sospeso: richiede DATABASE_URL).
- [ ] Prima migration applicata a Supabase dev. ← **Blocker: fornire DATABASE_URL**.
- [ ] Autenticazione Supabase funzionante (login email + Google OAuth). ← Sprint 2 (backend: guard pronto, frontend mancante).
- [x] Routing i18n base (EN + IT) con `next-intl`.
- [x] Design tokens iniziali (colori, tipografia, spaziature) allineati a specs/02 §11 + §11.1.
- [x] CI base (GitHub Actions: lint + typecheck + test).
- [x] Policy RLS base su Supabase — bozze commentate in `packages/db/prisma/rls/001_base.sql`.

**Criterio di done** (adattato): `prisma validate` passa; `GET /health` → 200; `GET /me` → 401 senza token; home i18n visibile in EN e IT.

**Blocker per l'utente**:
- Creare Supabase project → fornire `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_JWT_SECRET`.
- Copiare `apps/api/.env.example` → `.env` e popolare le variabili.
- Eseguire `pnpm --filter db db:migrate:dev` per applicare la prima migration.
- Creare il repo remoto GitHub e fare `git push`.

---

## Sprint UI (intermedi, completati post-Sprint 1)

Sprint trasversali per portare il design system Tennisillo nel monorepo.
Eseguiti dopo Sprint 1 e prima di Sprint 2 perché i componenti UI sono
riutilizzati da tutti gli sprint funzionali successivi.

### Sprint UI 1 — Componenti base
- [x] Token estesi: `glass`, `accent`, `status` in `tokens.ts`; `accent`, `danger` nel preset Tailwind.
- [x] Utility `cn()` in `packages/ui/src/lib/cn.ts`.
- [x] 10 componenti base: Avatar, StatusBadge, Button, GlassCard, GlassInput, GlassSelect, SegmentedControl, KpiCard, Toast, Modal.
- [x] Smoke test visivo in `apps/web/src/app/[locale]/_smoke.tsx`.
- [x] Fix Vercel: separato entry point Tailwind via `package.json#exports`.

### Sprint UI 2 — Componenti di dominio
- [x] 5 componenti dominio: MatchRow, RankingRow, MiniLineChart, ActivityItem, ChallengeCard.
- [x] File del prototipo design copiati in `docs/design/` come riferimento visivo.

### Sprint UI 3 — Visual fidelity
- [x] Riscrittura pixel-perfect di tutti i componenti rispetto a `docs/design/tennisillo-components.jsx`.

### Sprint UI 4 — Tipi di dominio
- [x] Tipi `Player`, `Match`, `Challenge`, `ActivityFeedItem` in `packages/shared-types`.
- [x] Refactor componenti dominio per consumare tipi di dominio invece di tipi locali piatti.
- [x] CLAUDE.md aggiornato con regola NO `git worktree`.

**Criterio di done globale Sprint UI**: design system completo, fedele al prototipo,
tipato con tipi di dominio, pronto per essere consumato da Sprint 2 in poi.

---

## Sprint 2 — Utenti e Leghe (2 settimane)

**Leggi prima**: specs/01 §2, §3, §4 · specs/02 §7 (moduli users, leagues).

**Deliverable**:
- [ ] Onboarding utente (questionario livello di gioco, anno nascita, città).
- [ ] CRUD profilo utente (globale e per-lega).
- [ ] Creazione lega (pubblica/privata), configurazione base, sport.
- [ ] Inviti lega (codice invito + link univoco).
- [ ] Richiesta iscrizione a lega pubblica + flusso approvazione admin.
- [ ] UI: dashboard "Le mie leghe", dettaglio lega, lista membri.
- [ ] Gestione ruoli base (Admin, Moderatore, Player).

**Criterio di done**: due utenti diversi riescono a creare / unirsi a una lega e vedere i rispettivi profili.

---

## Sprint 2.5 — Architecture rework + auth fixes (1 settimana, eseguito)

> Sprint trasversale **non pianificato in roadmap originaria**, eseguito tra Sprint 2
> e Sprint 3 per correggere bug critici di auth emersi nel testing post Sprint 2 e
> per riallineare l'architettura frontend alle specs §8.1 (tutto deve essere
> scoped per lega, niente dashboard globale).

**Leggi prima**: specs/02 §8.1 (struttura pagine).

**Deliverable**:
- [x] `apiServer` (`src/lib/api-server.ts`) — propagazione JWT dai cookie Supabase nei Server Components.
- [x] `apiClient` — client Supabase creato dentro `getAuthHeader()` (non a livello di modulo).
- [x] Rimozione `/dashboard` globale e `/ranking` globale (out of specs).
- [x] Architettura league-scoped: `/leagues`, `/leagues/new`, `/leagues/[id]`, `/leagues/[id]/members`, `/leagues/[id]/settings`.
- [x] `LeagueProvider` + hook `useLeague()` (`src/lib/league-context.tsx`).
- [x] Sidebar dinamica (`src/components/Sidebar.tsx`): voci diverse fuori/dentro lega via `usePathname`.
- [x] Middleware: check onboarding redirige a `/onboarding` se non completato.
- [x] Fix Railway: `prisma` CLI spostato in `dependencies` di `packages/db` per supportare `NODE_ENV=production`.
- [x] i18n: nuove chiavi `nav`, `leagues`, `league`, `createLeague`.

**Criterio di done**: smoke test E2E manuale verde sui 7 punti baseline:
1. Onboarding parte dopo conferma email.
2. `/leagues` mostra empty state.
3. Crea lega → redirect a `/leagues/[id]`.
4. Dashboard lega mostra KPI + codice invito.
5. Sidebar dinamica corretta dentro/fuori lega.
6. `/profile` carica.
7. Logout torna a login.

**Stato**: ✅ Completato. PR #13 mergiata. Baseline E2E verificata in produzione il 2026-04-30.

---

## Sprint 3 — Stagioni e Partite (3 settimane, in 2 PR)

**Leggi prima**: specs/01 §5, §6, §7 · specs/02 §7 (moduli seasons, matches).

> Sprint grosso, suddiviso in **due PR consecutive** per limitare il blast radius
> di ciascuna review e mantenere la CI sempre verde. La separazione è
> Seasons-first, Matches-after, perché il modello `Match` è figlio di `Season`.

### Sprint 3a — Seasons (PR #14, ~1.5 settimane)

**Deliverable**:
- [ ] Verifica modello Prisma `Season` vs specs/01 §5 (campi, enum stato).
- [ ] `SeasonsModule` (NestJS): CRUD scoped per lega, guard admin per mutazioni.
- [ ] Stati stagione: `DRAFT → REGISTRATION → ACTIVE → ENDED`. Transizioni esplicite via endpoint dedicati (no setter generico sullo stato).
- [ ] Calcolo durata ottimale in funzione di N giocatori (formula specs/01 §5) — funzione pura testata.
- [ ] `SeasonPlayer` (iscrizione giocatore-stagione).
- [ ] `SeasonRanking` (snapshot iniziale: tutti i giocatori a 0 punti). **Nessun calcolo punti** — quello arriva in Sprint 4.
- [ ] UI:
  - `(app)/leagues/[leagueId]/seasons` — lista stagioni.
  - `(app)/leagues/[leagueId]/seasons/new` — crea stagione (admin-only, server-side guard).
  - `(app)/leagues/[leagueId]/seasons/[seasonId]` — dashboard stagione (placeholder per matches/ranking).
- [ ] Sidebar lega: aggiungere voce "Stagioni".
- [ ] i18n: chiavi `seasons.*`.
- [ ] Audit log per le transizioni di stato.

**Criterio di done 3a**: admin di una lega crea una stagione, i membri si iscrivono nella fase `REGISTRATION`, la stagione passa a `ACTIVE`. Smoke test E2E verde su tutti i 7 punti baseline + nuovi flussi stagione.

### Sprint 3b — Matches & Challenges (PR #15, ~1.5 settimane)

**Deliverable**:
- [ ] Verifica modelli Prisma `Match` + `Challenge` vs specs/01 §6, §7.
- [ ] `ChallengesModule` (NestJS): invio sfida, accettazione, scheduling (data/ora/venue testuale — il `venueId` strutturato arriva in Sprint 5).
- [ ] `MatchesModule` (NestJS): registrazione risultato, doppia validazione, stato `DISPUTED`.
- [ ] Flusso sfida completo: `PENDING_ACCEPTANCE → SCHEDULED → PENDING_RESULT → VALIDATED | DISPUTED`. Transizioni esplicite.
- [ ] Auto-confirm dopo 24h: BullMQ delayed job `match.auto-confirm`.
- [ ] Plausibility check base (set/game impossibili, vincitore non coerente con score) — validazione lato server, rifiuta DTO con errore 400.
- [ ] Sistema disputa base: utente apre disputa → admin decide (`upheld` / `rejected`). **Nessun scoring impact** — il match resta in stato `DISPUTED` finché non viene risolto.
- [ ] Audit log per ogni mutazione `Match` (prepara base per scoring engine in Sprint 4).
- [ ] UI:
  - `(app)/leagues/[leagueId]/seasons/[seasonId]/matches` — lista partite + filtri (stato, data, giocatore).
  - `(app)/leagues/[leagueId]/seasons/[seasonId]/matches/new` — crea sfida.
  - `(app)/leagues/[leagueId]/seasons/[seasonId]/matches/[matchId]` — dettaglio + form risultato + form disputa.
- [ ] i18n: chiavi `matches.*`, `challenges.*`, `dispute.*`.

**Criterio di done 3b**: due giocatori si sfidano, accettano, inseriscono il risultato, la doppia validazione si chiude in <24h o auto-conferma a 24h. Una disputa è apribile e risolvibile dall'admin. Nessuna regressione sui flussi precedenti.

### Vincoli architetturali Sprint 3

> 🚫 **Non toccare lo scoring**. `SeasonRanking.points` resta a 0 fino a Sprint 4.
> Il calcolo punti è responsabilità esclusiva dello `scoring-engine` package, che
> sarà chiamato dal worker BullMQ. Coerente con `docs/decisions/0003-engine-separati.md`.

> 🚫 **Niente venue strutturato**. Lo scheduling sfida usa una stringa libera
> (`venueTextFallback`). L'introduzione di `Venue` come FK è Sprint 5.

> 🚫 **Niente sparring né lessons**. Solo partite competitive. Training è Sprint 6.

---

## Sprint 4 — Scoring Engine (2 settimane)

**Leggi prima**: specs/01 §8 · specs/02 §4.

**Deliverable**:
- [ ] Package `scoring-engine` completo con tutti i componenti:
  - [ ] `base.ts`, `levelMultiplier.ts`, `resultMultiplier.ts`
  - [ ] `consistency.ts`, `diversity.ts`, `headToHead.ts`, `winStreak.ts`
  - [ ] `repeatPenalty.ts`, `decay.ts`
- [ ] Test unitari con copertura ≥ 90% per ogni componente.
- [ ] Test di determinismo (stesso input ⇒ stesso output per 1000 invocazioni).
- [ ] Integrazione del calculator con BullMQ worker in `apps/api`.
- [ ] UI: breakdown punti per partita (trasparenza dell'algoritmo).
- [ ] Classifica live nella dashboard stagione.

**Criterio di done**: il calcolo ΔP per una partita validata produce i numeri esatti dell'esempio in specs/01 §8.12.

---

## Sprint 5 — Calendario, Frequenza, Anagrafica Campi (3 settimane)

**Leggi prima**: specs/01 §10, §11 · specs/02 §3 (modelli), §6 (matchmaking), §7 (moduli).

**Deliverable**:
- [ ] Modelli Prisma: `AvailabilityPattern`, `AvailabilityOverride`, `PlayerFrequencyPreference`, `Venue`, `VenueProposal`, `PlayerFavoriteVenue`.
- [ ] API availability: pattern ricorrente + override su date specifiche.
- [ ] API frequency: CRUD con endpoint pubblico "solo semaforo".
- [ ] API venues: CRUD admin + proposte giocatori con validazione.
- [ ] Geocoding wrapper Mapbox con cache Redis.
- [ ] Package `matchmaking-engine` completo (scorers + aggregator).
- [ ] UI: pagina calendario (griglia 7×24 drag-paint), pagina frequenza (slider + preview), pagina anagrafica campi (lista + mappa Mapbox).
- [ ] Integrazione `venueId` nel flusso partita esistente (retrocompatibile con testo libero).
- [ ] Smart Match Panel nella pagina "Cerca avversario".

**Criterio di done**: un giocatore dichiara disponibilità + frequenza + campi preferiti e riceve suggerimenti Smart Match ordinati correttamente.

---

## Sprint 6 — Training: Sparring + Master Lesson (2 settimane)

**Leggi prima**: specs/01 §9 · specs/02 §5 (training-engine), §7 (moduli).

**Deliverable**:
- [ ] Modello Prisma `TrainingSession` + `MasterProfile` + estensione `MemberRole` con `MASTER`.
- [ ] Package `training-engine` (`sparring.ts`, `masterLesson.ts`, `xpCurve.ts`, `capChecker.ts`).
- [ ] API `training-sessions/` e `masters/` come da specs/02 §7.3.
- [ ] BullMQ processor `training.processor` con eventi:
  - `sparring-validated` → +12 pt a testa, nessun bonus.
  - `master-lesson-validated` → +XP + delta rating globale.
  - `training-session-revoked` → storno.
- [ ] UI: flusso dichiara/conferma sparring, flusso dichiara/valida master lesson, pannello maestro.
- [ ] Badge: Compagno di Banco, Studioso, Dedicato, Mentor.
- [ ] **Test di integrazione dedicati** per verificare che il processor training **non** tocchi mai `ScoreDelta`, `HeadToHead`, `matchesLast4Weeks`, `winStreak`.

**Criterio di done**: uno sparring validato dà +12 punti senza inquinare nessun contatore competitivo.

---

## Sprint 7 — Gamification, Admin, Rifinitura (2 settimane)

**Leggi prima**: specs/01 §12, §13, §14 · specs/02 §7 (admin, notifications, rankings).

**Deliverable**:
- [ ] Sistema achievement + badge completo (copre anche quelli v2).
- [ ] Notifiche in-app + email (Resend) per tutti i `NotificationType`.
- [ ] WebSocket per aggiornamenti live classifica e notifiche.
- [ ] Anti-frode: pattern detection completo + sistema reputazione.
- [ ] Dashboard admin lega (overview, alert, gestione dispute, gestione maestri, proposte venue, monitoring sparring).
- [ ] Feature flags via Growthbook + predisposizione Stripe passivo.
- [ ] Ottimizzazione performance (caching Redis per matchmaking).
- [ ] Testing E2E con Playwright sui flussi critici.
- [ ] Bug fixing, rifiniture UI, accessibilità.

**Criterio di done**: MVP pubblicabile. Smoke test E2E verde sui flussi: registrazione → crea lega → invita → crea stagione → gioca partita → vedi classifica.

---

## Milestone post-MVP (non dettagliate qui)

- v1.5: Playoff, modulo Doppio/Padel attivabile, anti-frode avanzato (geo-check).
- v2.0: App mobile nativa, statistiche avanzate, modalità torneo.
- v3.0: Classifiche globali piattaforma, integrazioni esterne (FIT, Playtomic, Google Calendar), monetizzazione completa.

Vedi specs/01 §16 per la roadmap di prodotto completa.
