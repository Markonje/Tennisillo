# PROGRESS.md — Stato di avanzamento

> **Aggiornare questo file alla fine di ogni sessione di lavoro.**
> Claude Code lo legge all'inizio di ogni chat per sapere da dove ripartire.
> Formato: conciso, basato sui fatti.
> **Last updated**: 2026-04-26

---

## Sprint corrente

**Sprint**: Sprint UI 4 — Tipi di dominio + refactor (chiuso) → prossimo: Sprint 2 backend
**Stato**: ✅ Sprint 1 + 4 sprint UI completati. Pronti per Sprint 2 (utenti e leghe) appena DATABASE_URL Supabase è disponibile.

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

## Blocker per Sprint 2

1. **DATABASE_URL** + **DIRECT_URL** del progetto Supabase dev — necessari per
   `pnpm --filter db db:migrate:dev` e per testare `apps/api` con DB reale.
2. **SUPABASE_JWT_SECRET** — necessario per il guard JWT del backend.
3. **Copia di `apps/api/.env.example` → `.env`** con i valori reali.

---

## Prossimi passi

In ordine:

1. **Configurare Supabase dev** (utente): creare progetto Supabase, copiare le 3 env vars in `apps/api/.env`.
2. **Sprint 2 — Utenti e Leghe**:
   - Sync utenti Supabase Auth → tabella User Postgres
   - CRUD Profilo utente (globale + per-lega)
   - Creazione lega (pubblica/privata)
   - Inviti via codice / link univoco
   - Onboarding (livello, anno nascita, città)
   - UI: dashboard "Le mie leghe", dettaglio lega, lista membri (riusa i componenti UI già pronti)

---

## Stato degli sprint

| Sprint | Obiettivo | Stato |
| --- | --- | --- |
| Pre-Sprint 1 | Setup documentazione | ✅ Completo |
| Sprint 1 | Fondamenta (monorepo, DB schema, auth scaffold) | ✅ Completo (migration in attesa di DATABASE_URL) |
| Sprint UI 1 | Componenti base | ✅ Completo |
| Sprint UI 2 | Componenti di dominio | ✅ Completo |
| Sprint UI 3 | Visual fidelity | ✅ Completo |
| Sprint UI 4 | Tipi di dominio + refactor | ✅ Completo |
| Sprint 2 | Utenti e Leghe | ⏳ Pronto a partire (blocker: Supabase env) |
| Sprint 3 | Stagioni e Partite | ⏳ Non iniziato |
| Sprint 4 | Scoring Engine | ⏳ Non iniziato |
| Sprint 5 | Calendario, Frequenza, Anagrafica Campi | ⏳ Non iniziato |
| Sprint 6 | Training: Sparring + Master Lesson | ⏳ Non iniziato |
| Sprint 7 | Gamification, Admin, Rifinitura | ⏳ Non iniziato |
