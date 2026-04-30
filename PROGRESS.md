# PROGRESS.md — Stato di avanzamento

> **Aggiornare questo file alla fine di ogni sessione di lavoro.**
> Claude Code lo legge all'inizio di ogni chat per sapere da dove ripartire.
> Formato: conciso, basato sui fatti.
> **Last updated**: 2026-04-30

---

## Sprint corrente

**Sprint**: Sprint 2.5 — Architecture rework (completato e mergiato).
**Stato**: ✅ Baseline E2E verde in produzione. Pronti a iniziare Sprint 3 — Stagioni e Partite.

### Smoke test E2E verificato in produzione (2026-04-30)

Flusso completo testato manualmente su `https://tennisillo.vercel.app`:

1. ✅ Onboarding — utente nuovo, dopo conferma email parte il wizard
2. ✅ Lista leghe — dopo onboarding `/leagues` mostra empty state
3. ✅ Crea lega — redirect corretto a `/leagues/[id]`
4. ✅ Dashboard lega — KPI e codice invito visibili
5. ✅ Sidebar dinamica — fuori lega: "Le mie leghe" + "Profilo"; dentro lega: voci della lega
6. ✅ Profilo — `/profile` carica i dati utente
7. ✅ Logout — torna correttamente al login

---

## Cosa c'è su `main`

### Infrastruttura
- Monorepo Turborepo + pnpm workspaces, TS strict, ESLint + Prettier
- CI GitHub Actions verde (lint + typecheck + test)
- Vercel deploy attivo: `https://tennisillo.vercel.app`
- Railway deploy API attivo (fix `prisma` CLI in dependencies applicato)
- pnpm-lock.yaml committato, postinstall `prisma generate` su packages/db

### apps/web
- Next.js 14 App Router, i18n EN/IT con next-intl
- Tailwind + design tokens custom
- **Architettura league-scoped** (post Sprint 2.5):
  - Landing autenticata = `/leagues`
  - Tutto vive sotto `/leagues/[id]/{page,members,settings}`
  - `/dashboard` globale rimossa, `/ranking` globale rimossa
  - `/profile` rimane globale
- **Sidebar dinamica** (`src/components/Sidebar.tsx`): cambia voci in base allo scope corrente (path-based via `usePathname`)
- **Auth helpers**:
  - `src/lib/api-server.ts`: client server-side, propaga JWT dai cookie Supabase
  - `src/lib/api-client.ts`: client browser, crea Supabase client inline in `getAuthHeader()`
- **League context** (`src/lib/league-context.tsx`): `LeagueProvider` + `useLeague()`
- Middleware: sessione Supabase + intl routing + protezione `/(app)/**` + onboarding check
- Pagine attive:
  - `(auth)/login` — form email/password + Google OAuth
  - `(app)/onboarding` — wizard 3 step (livello → anno nascita → città)
  - `(app)/leagues` — lista leghe + form join via codice invito
  - `(app)/leagues/new` — form crea lega
  - `(app)/leagues/[leagueId]` — dashboard lega (KPI, membri, codice invito)
  - `(app)/leagues/[leagueId]/members` — lista membri
  - `(app)/leagues/[leagueId]/settings` — impostazioni (admin-only, server-side guard)
  - `(app)/profile` — form aggiornamento profilo

### apps/api (NestJS)
- **AuthN**: `SupabaseJwtGuard`, lazy sync utente da JWT
- **UsersModule**: `GET/PUT /users/me`, `GET /users/:id`, `POST /users/sync`
- **LeaguesModule**: `POST /leagues`, `GET /leagues/me`, `GET /leagues/:id`, join, invite code, approvazione, settings
- **OnboardingModule**: `GET /onboarding/status`, `POST /onboarding/complete`
- ValidationPipe globale, DTO con class-validator
- `GET /health` → 200, `GET /me` → 401 senza token

### packages
- `db`: schema Prisma v2.0 completo (21 modelli), migration `20260426221425_init` applicata, `prisma` CLI in `dependencies` (fix Railway), RLS bozza in `prisma/rls/001_base.sql`
- `scoring-engine`, `training-engine`, `matchmaking-engine`: scaffold con tipi (implementazione rinviata a Sprint 4/5/6)
- `shared-types`: feature flags + locale + tipi di dominio (Player, Match, Challenge, ActivityFeedItem)
- `ui`: 15 componenti pixel-perfect dal prototipo, tipati su tipi di dominio

### i18n
- `it.json` e `en.json` aggiornati: auth, onboarding, leagues, league, createLeague, profile, nav

### Documentazione
- Specs v2.0 in `docs/specs/` (Markdown)
- 3 ADR in `docs/decisions/`
- Glossario, domain rules, FAQ in `docs/context/`
- File del prototipo design in `docs/design/`

---

## Storico PR mergiate

| PR | Titolo | Stato |
| --- | --- | --- |
| #7 | feat(api,web): Sprint 2 — users + leagues + onboarding | ✅ merged |
| #12 | chore(web): rimozione `/ranking` globale (out of specs) | ✅ merged |
| #13 | feat(web): Sprint 2.5 — league-scoped architecture + auth fixes | ✅ merged |
| —  | fix(db): sposta `prisma` in `dependencies` per Railway | ✅ merged |

---

## Decisioni architetturali emerse durante Sprint 2.5

Da formalizzare eventualmente in ADR:

1. **Landing autenticata = `/leagues`**: l'utente non ha mai una "dashboard globale". Ogni dashboard è scoped a una lega. Coerente con specs §8.1.
2. **Sidebar auto-fetch**: il nome lega viene fetchato dalla sidebar via `apiClient.get('/leagues/:id')` invece di passarlo da prop dal layout (evita workaround per il fatto che la sidebar è nel layout nonno rispetto al `LeagueProvider`). Costo: 1 GET leggero per pagina lega.
3. **Settings admin-only protetto server-side**: la voce "Settings" è visibile a tutti i membri nella sidebar; la pagina `(app)/leagues/[leagueId]/settings` redirige i non-admin. Evita un fetch ruoli aggiuntivo nella sidebar.
4. **`prisma` CLI in `dependencies`**: in Railway con `NODE_ENV=production` pnpm skippa `devDependencies`. Il `postinstall: prisma generate` ha bisogno del CLI a runtime → va in `dependencies`.

---

## Blocker correnti

Nessuno. Stack pronto per Sprint 3.

---

## Prossimi passi

**Sprint 3 — Stagioni e Partite (3 settimane)**.

Vista la dimensione, lo spezziamo in **2 PR**:

### Sprint 3a — Seasons (PR #14)
- Modello `Season` già esistente (verifica completezza vs specs/01 §5)
- API NestJS: `SeasonsModule` con CRUD scoped per lega
- Stati: `DRAFT → REGISTRATION → ACTIVE → ENDED`
- Calcolo durata ottimale in funzione di N giocatori (formula da specs/01 §5)
- `SeasonPlayer` (iscrizione giocatore alla stagione) + `SeasonRanking` (snapshot iniziale a 0 punti, niente scoring engine ancora)
- UI:
  - `(app)/leagues/[leagueId]/seasons` — lista stagioni
  - `(app)/leagues/[leagueId]/seasons/new` — crea stagione (admin-only)
  - `(app)/leagues/[leagueId]/seasons/[seasonId]` — dashboard stagione (placeholder per matches/ranking)
- Sidebar lega: aggiungere voce "Stagioni"
- i18n: chiavi `seasons.*`
- **Criterio di done 3a**: admin di una lega crea una stagione, i membri si iscrivono, la stagione passa a `ACTIVE`.

### Sprint 3b — Matches & Challenges (PR #15)
- Modello `Match` + `Challenge` (verifica completezza vs specs/01 §6, §7)
- API NestJS: `ChallengesModule` + `MatchesModule`
- Flusso sfida: `PENDING_ACCEPTANCE → SCHEDULED → PENDING_RESULT → VALIDATED | DISPUTED`
- Doppia validazione risultato (auto-confirm dopo 24h via BullMQ delayed job)
- Plausibility check base (set/game impossibili) — server-side, rifiuta DTO
- Sistema disputa base: l'utente apre disputa — admin decide (no scoring engine, solo flag stato)
- Audit log per ogni mutazione `Match` (prepara base per scoring engine in Sprint 4)
- UI:
  - `(app)/leagues/[leagueId]/seasons/[seasonId]/matches` — lista partite + filtri
  - `(app)/leagues/[leagueId]/seasons/[seasonId]/matches/new` — crea sfida
  - `(app)/leagues/[leagueId]/seasons/[seasonId]/matches/[matchId]` — dettaglio + form risultato + form disputa
- i18n: chiavi `matches.*`, `challenges.*`, `dispute.*`
- **Criterio di done 3b**: due giocatori si sfidano, inseriscono risultato, validazione automatica, niente regressioni sui flussi esistenti.

> Nota architetturale critica: in Sprint 3 **non** si tocca il calcolo punti.
> `SeasonRanking.points` resta a 0. Il calcolo arriverà in Sprint 4 con lo
> scoring-engine. Questa separazione è necessaria per mantenere lo scoring
> engine isolato (vedi `docs/decisions/0003-engine-separati.md`).

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
| Sprint 2 | Utenti e Leghe | ✅ Completo (PR #7) |
| Sprint 2.5 | Architecture rework + auth fixes | ✅ Completo (PR #13) |
| Sprint 3a | Seasons | ⏳ Prossimo |
| Sprint 3b | Matches & Challenges | ⏳ Dopo 3a |
| Sprint 4 | Scoring Engine | ⏳ Non iniziato |
| Sprint 5 | Calendario, Frequenza, Anagrafica Campi | ⏳ Non iniziato |
| Sprint 6 | Training: Sparring + Master Lesson | ⏳ Non iniziato |
| Sprint 7 | Gamification, Admin, Rifinitura | ⏳ Non iniziato |
