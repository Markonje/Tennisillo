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
- [ ] Specifiche v2.0 in Markdown (`docs/specs/01_*.md`, `02_*.md`) generate da script.
- [ ] Repo Git pubblicato su GitHub privato.
- [ ] Account cloud creati (Supabase, Vercel, Railway, Upstash, Cloudflare R2, Resend, Mapbox).
- [ ] Nome del prodotto definito.

---

## Sprint 1 — Fondamenta (2 settimane)

**Leggi prima**: specs/02 §1, §2, §3 (schema Prisma).

**Deliverable**:
- [ ] Setup Turborepo + pnpm workspaces.
- [ ] Scaffolding `apps/web` (Next.js 14 App Router, TS strict, Tailwind, shadcn/ui).
- [ ] Scaffolding `apps/api` (NestJS + Prisma).
- [ ] Scaffolding pacchetti `packages/db`, `packages/scoring-engine`, `packages/training-engine`, `packages/matchmaking-engine`, `packages/shared-types`, `packages/ui`.
- [ ] Schema Prisma completo v2.0 + prima migration applicata a Supabase dev.
- [ ] Autenticazione Supabase funzionante (login email + Google OAuth).
- [ ] Routing i18n base (EN + IT) con `next-intl`.
- [ ] Design tokens iniziali (colori, tipografia, spaziature) allineati a specs/02 §11.
- [ ] CI base (GitHub Actions: lint + typecheck + test).
- [ ] Policy RLS base su Supabase per i modelli principali.

**Criterio di done**: `pnpm dev` avvia frontend e backend, login funziona, il profilo utente mostra i dati da Supabase.

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

## Sprint 3 — Stagioni e Partite (3 settimane)

**Leggi prima**: specs/01 §5, §6, §7 · specs/02 §7 (moduli seasons, matches).

**Deliverable**:
- [ ] CRUD Stagioni con calcolo automatico durata ottimale (formula su N giocatori).
- [ ] Pre-stagione → Stagione Attiva → Post-stagione (senza playoff per ora).
- [ ] Flusso sfida completo (invio, accettazione, scheduling data/ora/venue testuale).
- [ ] Registrazione risultato con doppia validazione (24h auto-confirm).
- [ ] Gestione disputa base (contestazione → admin decide).
- [ ] Plausibility check base (punteggi impossibili).
- [ ] UI: dashboard stagione, lista partite, form inserimento risultato, pagina disputa.
- [ ] Audit log per tutte le mutazioni di Match.

**Criterio di done**: una stagione è creabile, due giocatori si sfidano, inseriscono risultato, avviene validazione.

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
