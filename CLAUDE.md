# CLAUDE.md — Istruzioni permanenti per Claude Code

> Questo file viene letto automaticamente da Claude Code all'inizio di ogni sessione.
> Tieni il contenuto **conciso** (obiettivo: ≤ 400 righe).
> I dettagli approfonditi stanno in `docs/specs/` e in `docs/decisions/`.
> Per aggiornare lo stato di avanzamento modifica [`PROGRESS.md`](./PROGRESS.md).

---

## 1. Cos'è il progetto

Portale web (con companion app mobile in fase successiva) per la gestione di **leghe
tennis amatoriali**, con sistema di ranking dinamico, sparring, lezioni con maestro,
calendario disponibilità, frequenza desiderata e anagrafica campi.

- Tipo: webapp multi-tenant (leghe private/pubbliche).
- Utenti target: tennisti amatori.
- Ispirazione prodotto: Fantacalcio (per la logica di lega) + ATP (per il ranking).
- Mobile-first, API-first, i18n (EN + IT all'MVP).

Per la visione completa → [`docs/specs/01_analisi_funzionale.md`](./docs/specs/01_analisi_funzionale.md).

---

## 2. Stack tecnologico

| Layer | Scelta |
| --- | --- |
| Frontend | Next.js 14 (App Router) + TypeScript strict + Tailwind + shadcn/ui |
| Backend | NestJS + TypeScript |
| ORM / DB | Prisma + PostgreSQL (Supabase) |
| Auth | Supabase Auth (JWT, OAuth Google + Apple) |
| Cache / Queue | Redis (Upstash) + BullMQ |
| Realtime | Socket.io |
| Storage | Cloudflare R2 |
| Email | Resend + React Email |
| Hosting | Vercel (web) + Railway (api) |
| Payments | Stripe (integrazione passiva MVP, attiva in v1.5) |
| Feature flags | Growthbook (self-hosted) |
| Monorepo | Turborepo + pnpm workspaces |

Dettagli e giustificazione costi → `docs/specs/02_specifiche_sviluppo.md` §2.

---

## 3. Struttura del monorepo

```
tennis-league/
├── CLAUDE.md                    ← questo file (sempre letto)
├── PROGRESS.md                  ← stato di avanzamento (sempre letto)
├── ROADMAP.md                   ← sprint e milestone
├── README.md                    ← overview umano
├── docs/
│   ├── specs/                   ← fonti di verità funzionale e tecnica
│   ├── decisions/               ← ADR (Architecture Decision Records)
│   └── context/                 ← glossario, regole di dominio, FAQ
├── apps/
│   ├── web/                     ← Next.js frontend
│   └── api/                     ← NestJS backend
├── packages/
│   ├── db/                      ← Prisma schema + migrations + seed
│   ├── scoring-engine/          ← motore punteggi competitive (TS puro)
│   ├── training-engine/         ← Sparring + Master XP (TS puro)
│   ├── matchmaking-engine/      ← Smart Match (TS puro)
│   ├── shared-types/
│   └── ui/                      ← design system
├── tools/
│   └── normalize_specs.py       ← utility per docs
└── turbo.json
```

> I tre engine (`scoring`, `training`, `matchmaking`) sono **package TS puri senza
> dipendenze framework**. Devono restare testabili in isolamento e portabili.

---

## 4. Come orientarsi prima di scrivere codice

Prima di iniziare un task, identifica la **sezione di specifica** rilevante e leggila.
Non caricare le specifiche intere in contesto: punta alla sezione.

| Area di lavoro | Leggi prima |
| --- | --- |
| Schema DB / Prisma | specs/02 §3 |
| Scoring Engine (punti partita) | specs/02 §4 + analisi §8 |
| Training Engine (sparring, lezioni) | specs/02 §5 + analisi §9 |
| Matchmaking Engine | specs/02 §6 + analisi §6 e §10 |
| API REST / NestJS | specs/02 §7 |
| Frontend Next.js | specs/02 §8 + §11 (design system) |
| i18n | specs/02 §9 |
| Monetizzazione / feature flags | specs/02 §10 |
| Regole di business (dominio) | context/DOMAIN_RULES.md |
| Glossario (ELO, Sparring, Decay…) | context/GLOSSARY.md |

Se una decisione architetturale è in dubbio, cerca in `docs/decisions/` prima di
rimetterla in discussione. Se non c'è un ADR, crealo dopo averla discussa con l'utente.

---

## 5. Convenzioni non negoziabili

**Codice**
- TypeScript strict mode ovunque. Nessun `any` implicito.
- ESLint + Prettier: lint pulito è un prerequisito per il commit.
- Gli engine (`scoring`, `training`, `matchmaking`) sono **puri** e **deterministici**:
  stesso input ⇒ stesso output. Niente `Date.now()` dentro le funzioni core;
  le date arrivano come parametro.
- Ogni modulo di dominio ha test unitari con copertura ≥ 90% per gli engine
  e ≥ 70% per il resto.

**Regole di business critiche** (vedi `context/DOMAIN_RULES.md` per l'elenco completo)
- Il calculator competitivo **non** deve mai contare Sparring o Master Lesson nei
  contatori stagionali (`matchesLast4Weeks`, `winStreak`, `HeadToHead`, `pairCount`).
- Sparring e Master Lesson **non proteggono dal decay inattività**.
- I Venue sono scoped **per lega** (FK `leagueId` NOT NULL). Nessuna anagrafica globale.
- Nessun dato finanziario sensibile in URL o log.

**Internazionalizzazione**
- Nessuna stringa UI hardcoded. Tutto passa da `next-intl`.
- File di traduzione in `apps/web/messages/{en,it}.json`.

**Audit trail**
- Ogni mutazione di stato significativa scrive su `AuditLog` (vedi schema).
- Azioni irreversibili (validazione, revoca) registrano `userId`, `timestamp`, `motivazione`.

---

## 6. Comandi utili

```bash
# Dev (da root monorepo)
pnpm install                    # setup iniziale
pnpm dev                        # avvia web + api in parallelo
pnpm --filter web dev           # solo frontend
pnpm --filter api dev           # solo backend

# Database
pnpm --filter db migrate:dev    # nuova migration
pnpm --filter db seed           # seed dati demo
pnpm --filter db studio         # apre Prisma Studio

# Qualità
pnpm lint                       # lint tutto il monorepo
pnpm test                       # test tutti i package
pnpm --filter scoring-engine test
pnpm typecheck                  # verifica tipi su tutto

# Specs
python3 tools/normalize_specs.py <in.md> <out.md>
```

> I comandi esatti verranno cablati nel `package.json` root in Sprint 1.
> Se un comando non esiste ancora, chiedilo all'utente prima di inventarlo.

---

## 7. Flusso di lavoro con Claude Code

All'inizio di ogni sessione:
1. Leggi questo file (`CLAUDE.md`) — già automatico.
2. Leggi `PROGRESS.md` per capire a che punto siamo.
3. Conferma il task con l'utente prima di scrivere codice.
4. Solo allora leggi la sezione specifica delle specs rilevante per il task.

Alla fine di ogni sessione:
1. Aggiorna `PROGRESS.md` con cosa hai fatto, cosa resta, eventuali blocchi.
2. Se hai preso decisioni architetturali non banali, crea un ADR in `docs/decisions/`.
3. Se hai incontrato regole di dominio poco chiare, aggiorna `context/FAQ.md`.

Quando le specifiche cambiano:
1. L'utente (o tu su richiesta) modifica il file in `docs/specs/`.
2. Aggiungi una voce in `docs/specs/CHANGELOG_SPECS.md` con il diff concettuale.
3. Sposta la vecchia versione in `docs/specs/archive/`.
4. Nella chat successiva l'utente dirà "applica le modifiche della vX.Y" → leggi
   solo il changelog, non l'intero documento.

---

## 8. Cosa NON fare

- Non inventare endpoint, campi di schema o parametri di configurazione che non
  siano già nelle specs o in un ADR.
- Non introdurre nuove dipendenze npm senza discuterlo prima con l'utente.
- Non modificare file in `docs/specs/archive/` (è storico).
- Non creare file in `apps/` o `packages/` se la scaffolding del monorepo non è
  ancora in piedi (controlla Sprint 1 in `PROGRESS.md`).
- Non usare `localStorage`/`sessionStorage` in componenti React senza approvazione.
- Non eseguire migration distruttive senza conferma esplicita dell'utente.
- Non scrivere commenti nel codice in italiano: codice in inglese, commenti in inglese.
  I documenti e la conversazione con l'utente restano in italiano.

---

## 9. Contatti / priorità di escalation

- Se un requisito è ambiguo: chiedi all'utente in chat, non tirare a indovinare.
- Se una regola di `DOMAIN_RULES.md` sembra contraddire una spec: segnalalo,
  non decidere tu.
- Se uno script Python/shell rischia di toccare file fuori da `/home/claude/tennis-league/`:
  ferma e chiedi conferma.
