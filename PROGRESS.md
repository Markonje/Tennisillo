# PROGRESS.md — Stato di avanzamento

> **Aggiornare questo file alla fine di ogni sessione di lavoro.**
> Claude Code lo legge all'inizio di ogni chat per sapere da dove ripartire.
> Formato: conciso, basato sui fatti.
> **Last updated**: 2026-04-27

---

## Sprint corrente

**Sprint**: Sprint 2 — Utenti e Leghe (completato, PR in review)
**Stato**: ✅ Sprint 2 completato. PR #7 aperta, CI verde. Non mergiare finché l'utente non aggiunge ANON_KEY in `.env.local`.

---

## Cosa c'è su `main`

### Infrastruttura
- Monorepo Turborepo + pnpm workspaces, TS strict, ESLint + Prettier
- CI GitHub Actions verde (lint + typecheck + test)
- Vercel deploy attivo: `https://tennisillo.vercel.app`
- pnpm-lock.yaml committato, postinstall `prisma generate` su packages/db

### apps/web
- Next.js 14 App Router, i18n EN/IT con next-intl
- Tailwind + design tokens custom
- Smoke test visivo dei componenti in `_smoke.tsx`

### apps/api
- NestJS scaffold + SupabaseJwtGuard + endpoints `/health` e `/me`
- Bloccato in attesa di DATABASE_URL e SUPABASE_JWT_SECRET reali

### packages
- `db`: schema Prisma v2.0 completo (21 modelli, validato), RLS bozza, postinstall ok
- `scoring-engine`, `training-engine`, `matchmaking-engine`: scaffold con tipi (implementazione rinviata a Sprint 4/5/6)
- `shared-types`: feature flags + locale + tipi di dominio (Player, Match, Challenge, ActivityFeedItem)
- `ui`: 15 componenti pixel-perfect dal prototipo, tipati su tipi di dominio

### Documentazione
- Specs v2.0 in `docs/specs/` (Markdown)
- 3 ADR in `docs/decisions/`
- Glossario, domain rules, FAQ in `docs/context/`
- File del prototipo design in `docs/design/` (riferimento visivo)

---

## Cosa c'è su `feat/sprint-2-users-leagues` (PR #7, CI verde)

### DB
- Prima migration applicata su Supabase (`20260426221425_init` — 21 modelli)
- Campo `inviteCode String? @unique` aggiunto a `League` (via `db push`)
- `packages/db/.env` creato localmente per prisma CLI (non committato)

### apps/api
- **UsersModule**: `GET /users/me`, `PUT /users/me`, `GET /users/:id`, `POST /users/sync`
  - `UserService.upsertFromSupabase()`: lazy sync da JWT Supabase
  - `UpdateProfileDto` con class-validator
- **LeaguesModule**: `POST /leagues`, `GET /leagues/me`, `GET /leagues/:id`, join, invite code, approvazione, settings
  - `CreateLeagueDto`, `UpdateLeagueSettingsDto` con class-validator
- **OnboardingModule**: `GET /onboarding/status`, `POST /onboarding/complete`
  - `CompleteOnboardingDto` con class-validator
- ValidationPipe globale in `main.ts`
- `MeController` aggiornato: chiama `UserService.upsertFromSupabase` per lazy sync

### apps/web
- Supabase client helpers: `src/lib/supabase/client.ts`, `server.ts`, `middleware.ts`
- Middleware: sessione Supabase + intl routing + protezione route `/(app)/**`
- `(auth)/layout.tsx` + `(auth)/login/page.tsx`: form email/password + Google OAuth
- `(app)/layout.tsx`: sidebar con voci Dashboard, Leghe, Classifica, Profilo
- `(app)/dashboard/page.tsx`: KPI card con dati reali da `GET /users/me`
- `(app)/leagues/page.tsx`: lista leghe, crea lega, join con codice invito
- `(app)/profile/page.tsx`: form aggiornamento profilo
- `(app)/onboarding/page.tsx`: wizard 3 step (livello → anno nascita → città)
- `apps/web/.env.example` creato
- `apps/web/.env.local` creato con placeholder — **ANON_KEY da aggiungere manualmente**

### i18n
- `it.json` e `en.json` aggiornati: auth, dashboard, leagues, profile, onboarding

---

## Blocker per produzione

1. **ANON_KEY mancante**: aggiungere `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `apps/web/.env.local`
   → Supabase Dashboard → Settings → API → anon key pubblica
2. **SUPABASE_SERVICE_ROLE_KEY** (opzionale per ora): serve per l'hook `POST /users/sync`

---

## Prossimi passi

In ordine:

1. **Utente**: aggiungere ANON_KEY in `apps/web/.env.local`, poi mergiare PR #7
2. **Sprint 3 — Stagioni e Partite**:
   - CRUD Stagioni (DRAFT → REGISTRATION → ACTIVE)
   - Challenge flow: PENDING_ACCEPTANCE → SCHEDULED → PENDING_RESULT → VALIDATED
   - Risultati partita + validazione (auto-conferma dopo 24h)
   - SeasonPlayer + SeasonRanking (snapshot)
   - UI: pagina partite, pagina classifica stagione

---

## Stato degli sprint

| Sprint | Obiettivo | Stato |
| --- | --- | --- |
| Pre-Sprint 1 | Setup documentazione | ✅ Completo |
| Sprint 1 | Fondamenta (monorepo, DB schema, auth scaffold) | ✅ Completo |
| Sprint UI 1 | Componenti base | ✅ Completo |
| Sprint UI 2 | Componenti di dominio | ✅ Completo |
| Sprint UI 3 | Visual fidelity | ✅ Completo |
| Sprint UI 4 | Tipi di dominio + refactor | ✅ Completo |
| Sprint 2 | Utenti e Leghe | ✅ Completo (PR #7, CI verde — in attesa ANON_KEY) |
| Sprint 3 | Stagioni e Partite | ⏳ Non iniziato |
| Sprint 4 | Scoring Engine | ⏳ Non iniziato |
| Sprint 5 | Calendario, Frequenza, Anagrafica Campi | ⏳ Non iniziato |
| Sprint 6 | Training: Sparring + Master Lesson | ⏳ Non iniziato |
| Sprint 7 | Gamification, Admin, Rifinitura | ⏳ Non iniziato |
