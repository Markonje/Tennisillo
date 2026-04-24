# PROGRESS.md — Stato di avanzamento

> **Aggiornare questo file alla fine di ogni sessione di lavoro.**
> Claude Code lo legge all'inizio di ogni chat per sapere da dove ripartire.
> Formato: conciso, basato sui fatti. Per dettagli architetturali → ADR in `docs/decisions/`.

---

## Sprint corrente

**Sprint**: Sprint 1 — Fondamenta (in corso — blocker: DATABASE_URL mancante)
**Obiettivo**: Avere il monorepo scaffoldato e funzionante con auth Supabase, schema DB validato, CI verde.

---

## Ultima sessione

**Data**: 2026-04-24
**Focus**: Fix CI — postinstall prisma generate + fix schema Prisma + mapping CSS variables shadcn.

**Fatto**:
- Aggiornato `.gitignore` (aggiunto `.env.*`, `.vercel`, `**/node_modules/.prisma`).
- Specs `.md` già presenti nel repo — non rigenerate.
- `.docx` originali: non trovati nella root — da archiviare manualmente se presenti.
- Creati file root: `package.json` (pnpm workspaces + turbo), `pnpm-workspace.yaml`, `turbo.json`, `.nvmrc` (Node 20), `tsconfig.base.json` (strict, ES2022, bundler), `.eslintrc.js`, `.prettierrc`, `.prettierignore`.
- `packages/db`: `package.json`, `tsconfig.json`, `prisma/schema.prisma` completo v2.0 (tutti i modelli: 21 modelli, tutti gli enum), `src/index.ts` (singleton Prisma), `prisma/rls/001_base.sql` (policy RLS commentate), `README.md`.
- `packages/scoring-engine`: scaffold completo con `types.ts` (da specs §4.2), `index.ts`, test placeholder, `jest.config.ts`, `README.md`.
- `packages/training-engine`: scaffold con tipi da specs §5 (SparringInput/Output, MasterLessonInput/Output), test placeholder, `README.md`.
- `packages/matchmaking-engine`: scaffold con tipi da specs §6 (CandidateInput/Output), test placeholder, `README.md`.
- `packages/shared-types`: `features.ts` (FEATURE_FLAGS da specs §10.1), `locale.ts` (LocaleCode), `index.ts`, `README.md`.
- `packages/ui`: `tokens.ts` (palette iOS da specs §11 + §11.1: frequency, training, venue), `tailwind.preset.ts`, `index.ts`, `README.md`.
- `apps/api`: `package.json` (NestJS 10), `tsconfig.json`, `nest-cli.json`, `src/main.ts`, `src/app.module.ts`, `src/prisma/{service,module}.ts`, `src/auth/{auth.module.ts,supabase-jwt.guard.ts}` (verifica HS256 JWT senza libreria esterna), `src/health/health.controller.ts`, `src/me/me.controller.ts`, `.env.example`.
- `apps/web`: `package.json` (Next.js 14), `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts` (usa preset `@tennisillo/ui`), `postcss.config.js`, `components.json` (shadcn), `messages/{en,it}.json`, `src/i18n.ts`, `src/middleware.ts`, `src/app/globals.css`, `src/app/[locale]/{layout,page}.tsx`.
- `.github/workflows/ci.yml`: install → lint → typecheck → test, cache pnpm.
- `ROADMAP.md`: aggiornate spunte Pre-Sprint 1 e Sprint 1.

**Fatto (sessioni post-Sprint 1)**:
- Fix CI: generato e committato `pnpm-lock.yaml` mancante dallo scaffolding Sprint 1.
- Fix CI: aggiunto `postinstall` in `packages/db` per eseguire `prisma generate` automaticamente dopo `pnpm install`. Risolve `Module '@prisma/client' has no exported member 'PrismaClient'`.
- Fix schema Prisma: tutti gli enum compatti (multiple valori sulla stessa riga) riformattati in stile canonico Prisma (un valore per riga). Risolveva 45 errori di validazione.
- Fix Tailwind/Vercel: aggiunti mapping CSS variables shadcn (`--background`, `--foreground`, `--card`, `--border`, `--input`, `--muted`) e override `borderRadius` con `--radius` nel preset `packages/ui`. Risolve `The 'border-border' class does not exist`.
- CI su `main`: ✅ verde (Install → Lint → Typecheck → Test, run #24908738291).

**Da fare subito** (prerequisiti bloccanti):
- **Fornire `DATABASE_URL` e `DIRECT_URL`** (Supabase project): senza di essi `pnpm --filter db db:migrate:dev` non può girare.
- **Fornire `SUPABASE_JWT_SECRET`**: il guard `SupabaseJwtGuard` legge questa env var a runtime.
- Copiare `apps/api/.env.example` → `apps/api/.env` e popolare i valori.
- Eseguire `pnpm install` dalla root (la prima volta richiede connessione npm).
- Eseguire `pnpm --filter db db:validate` per verificare il schema Prisma.
- Eseguire `pnpm --filter db db:migrate:dev` per creare e applicare la prima migration.
- Creare il repo remoto su GitHub (privato) e fare `git push`.
- Creare gli account cloud: Supabase, Vercel, Railway, Upstash, Cloudflare R2, Resend (Mapbox e Sentry per sprint successivi).

**Decisioni prese in questa sessione**:
- I modelli "invariati v1.0" (League, Season, SeasonPlayer, ecc.) sono stati ricostruiti dalle FK references del v2.0 e dal contesto di dominio, marcati come `[INFERRED]` nello schema. Se c'è una versione esplicita v1.0, verificare la coerenza dei campi.
- `SupabaseJwtGuard` usa verifica HMAC-SHA256 nativa (`node:crypto`) senza `@supabase/supabase-js` sul backend, come da vincolo del task.
- `tsconfig.base.json` usa `moduleResolution: bundler` + `exactOptionalPropertyTypes: true`; NestJS e i package-engine usano override `CommonJS` + `node` per compatibilità.

---

## Prossimi task concreti

1. **Fornire credenziali Supabase** → abilitare `db:migrate:dev` e testare il guard JWT.
2. **`pnpm install` e `pnpm -w typecheck`** → verificare che lo schema TS completo sia pulito.
3. **`pnpm -w lint`** → verificare ESLint su tutti i package.
4. **`pnpm -w test`** → placeholder test deve passare.
5. **`pnpm --filter web dev`** → verificare home page i18n EN/IT a `http://localhost:3000`.
6. **`pnpm --filter api dev`** → verificare `GET /health` → 200, `GET /me` → 401.
7. **Creare repo remoto GitHub** e impostare branch protection su `main`.
8. **Sprint 2**: CRUD Utenti (sync Supabase → PostgreSQL), CRUD Leghe, onboarding.

---

## Stato degli sprint

| Sprint | Obiettivo | Stato |
| --- | --- | --- |
| Pre-Sprint 1 | Setup documentazione | ✅ Quasi completo (manca pub. GitHub e account cloud) |
| Sprint 1 | Fondamenta (monorepo, DB schema, auth) | 🟢 In corso — blocker: DATABASE_URL |
| Sprint 2 | Utenti e Leghe | ⏳ Non iniziato |
| Sprint 3 | Stagioni e Partite | ⏳ Non iniziato |
| Sprint 4 | Scoring Engine | ⏳ Non iniziato |
| Sprint 5 | Calendario, Frequenza, Anagrafica Campi | ⏳ Non iniziato |
| Sprint 6 | Training: Sparring + Master Lesson | ⏳ Non iniziato |
| Sprint 7 | Gamification, Admin, Rifinitura | ⏳ Non iniziato |

---

## Note per la prossima sessione

Quando riapri Claude Code:
1. Leggi questo file.
2. Chiedi all'utente se ha fornito le credenziali Supabase e se `pnpm install` / `prisma validate` è passato.
3. Se le credenziali ci sono: esegui `db:migrate:dev`, verifica i check di done dello Sprint 1, poi avvia Sprint 2.
4. Se non ci sono: guida l'utente a creare il Supabase project e copiare le env.
