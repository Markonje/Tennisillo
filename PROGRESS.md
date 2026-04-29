# PROGRESS.md — Stato di avanzamento

> **Aggiornare questo file alla fine di ogni sessione di lavoro.**
> Claude Code lo legge all'inizio di ogni chat per sapere da dove ripartire.
> Formato: conciso, basato sui fatti.
> **Last updated**: 2026-04-29

---

## Sprint corrente

**Sprint**: Sprint 2.5 — Ricostruzione architetturale (completato, PR #13 aperta, CI verde)
**Stato**: ✅ Sprint 2.5 completato. PR #13 aperta, CI verde + Vercel preview ok. Non mergiare finché l'utente non approva.

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
- NestJS + SupabaseJwtGuard
- UsersModule, LeaguesModule, OnboardingModule completi
- ValidationPipe globale

### packages
- `db`: schema Prisma v2.0 completo (21 modelli, validato), migration applicata su Supabase
- `scoring-engine`, `training-engine`, `matchmaking-engine`: scaffold con tipi
- `shared-types`, `ui`: 15 componenti pixel-perfect

---

## Cosa c'è su `feat/sprint2.5-architecture-rework` (PR #13, CI verde)

### Architettura nuova
- Landing autenticata = `/leagues` (lista leghe utente)
- Tutto scoped a una lega: `/leagues/[id]/{page,members,settings}`
- Sidebar dinamica (client): voci globali vs lega in base a `usePathname()`
- `/dashboard` globale rimossa (non nelle specs)
- `/ranking` globale già rimossa in PR #12

### Bug critici risolti
- 401 server-side: `api-server.ts` propaga JWT dai cookie Supabase
- Onboarding gate spostato nel middleware (non più solo nella dashboard)
- Login/OAuth Google redirige a `/leagues`
- Profilo: gestione graceful errore 401/403 (sessione scaduta)
- Onboarding: redirect a `/leagues` dopo completamento

### File creati (Sprint 2.5)
- `src/lib/api-server.ts`
- `src/lib/league-context.tsx`
- `src/components/Sidebar.tsx`
- `(app)/leagues/page.tsx` (convertita a Server Component)
- `(app)/leagues/JoinByCodeForm.tsx`
- `(app)/leagues/new/page.tsx`
- `(app)/leagues/[leagueId]/layout.tsx`
- `(app)/leagues/[leagueId]/page.tsx`
- `(app)/leagues/[leagueId]/LeagueDashboardClient.tsx`
- `(app)/leagues/[leagueId]/members/page.tsx`
- `(app)/leagues/[leagueId]/settings/page.tsx`
- `(app)/leagues/[leagueId]/settings/LeagueSettingsClient.tsx`

---

## Blocker per produzione

1. **ANON_KEY**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `apps/web/.env.local`
2. **SUPABASE_SERVICE_ROLE_KEY** (opzionale per ora)

---

## Prossimi passi

In ordine:

1. **Utente**: mergiare PR #13 dopo review
2. **Sprint 3 — Stagioni e Partite**:
   - CRUD Stagioni (DRAFT → REGISTRATION → ACTIVE)
   - Challenge flow: PENDING_ACCEPTANCE → SCHEDULED → PENDING_RESULT → VALIDATED
   - Risultati partita + validazione (auto-conferma dopo 24h)
   - SeasonPlayer + SeasonRanking (snapshot)
   - UI: `/leagues/[id]/seasons/[id]` — pagina classifica stagione

---

## Stato degli sprint

| Sprint | Obiettivo | Stato |
| --- | --- | --- |
| Pre-Sprint 1 | Setup documentazione | ✅ Completo |
| Sprint 1 | Fondamenta (monorepo, DB schema, auth scaffold) | ✅ Completo |
| Sprint UI 1–4 | Componenti UI | ✅ Completo |
| Sprint 2 | Utenti e Leghe (API + pagine base) | ✅ Completo (su main) |
| Sprint 2.5 | Ricostruzione architetturale + fix bug critici | ✅ Completo (PR #13) |
| Sprint 3 | Stagioni e Partite | ⏳ Non iniziato |
| Sprint 4 | Scoring Engine | ⏳ Non iniziato |
| Sprint 5 | Calendario, Frequenza, Anagrafica Campi | ⏳ Non iniziato |
| Sprint 6 | Training: Sparring + Master Lesson | ⏳ Non iniziato |
| Sprint 7 | Gamification, Admin, Rifinitura | ⏳ Non iniziato |
