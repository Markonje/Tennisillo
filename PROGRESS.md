# PROGRESS.md — Stato di avanzamento

> **Aggiornare questo file alla fine di ogni sessione di lavoro.**
> Claude Code lo legge all'inizio di ogni chat per sapere da dove ripartire.
> Formato: conciso, basato sui fatti. Per dettagli architetturali → ADR in `docs/decisions/`.

---

## Sprint corrente

**Sprint**: Pre-Sprint 1 — setup documentazione e contesto
**Obiettivo**: Avere il repository inizializzato con tutta la documentazione di riferimento e la struttura base, pronto per partire con lo sviluppo vero e proprio allo Sprint 1.

---

## Ultima sessione

**Data**: 2026-04-23
**Focus**: Setup iniziale della struttura documentale del progetto.

**Fatto**:
- Creata struttura cartelle `docs/specs`, `docs/decisions`, `docs/context`, `tools/`.
- Creato `tools/normalize_specs.py` per convertire le specifiche da Word a Markdown pulito (usare dopo ogni revisione dei `.docx`).
- Creato `CLAUDE.md` (istruzioni permanenti per Claude Code).
- Creati `PROGRESS.md`, `ROADMAP.md`, `README.md`.
- Creato `docs/specs/CHANGELOG_SPECS.md` (scheletro).
- Creati file di contesto: `GLOSSARY.md`, `DOMAIN_RULES.md`, `FAQ.md`.
- Creati 3 ADR iniziali che consolidano le decisioni principali già prese nelle specs.

**Da fare subito** (prerequisiti prima di Sprint 1):
- **Generare le versioni Markdown delle specifiche** eseguendo lo script
  `tools/normalize_specs.py` sui due `.docx` originali. Istruzioni in `README.md` §Documentazione.
  Output attesi: `docs/specs/01_analisi_funzionale.md` e `docs/specs/02_specifiche_sviluppo.md`.
- Spostare gli originali `.docx` in `docs/specs/archive/` come backup.

**Blocchi noti / decisioni aperte**:
- Nome del prodotto ancora da definire (attuale placeholder: "Portale Leghe Tennis Amatoriali").
- Account Supabase, Vercel, Railway, Upstash, Cloudflare R2, Resend, Mapbox da creare prima dello Sprint 1.
- Scelta package manager: il team deve decidere tra pnpm (consigliato per Turborepo) e npm.

---

## Prossimi task concreti

1. **Convertire le specs** con `tools/normalize_specs.py` (vedi sopra).
2. **Scegliere il nome del prodotto** e aggiornare `README.md`, `CLAUDE.md`, frontmatter specs.
3. **Creare gli account cloud** di servizio (Supabase + Vercel + Railway + Upstash + Cloudflare R2 + Resend + Mapbox + Sentry). Raccogliere le API key in un gestore di secrets (1Password / Bitwarden) — **non committare mai `.env`**.
4. **Inizializzare il repo Git** e pubblicarlo su GitHub (privato).
5. **Avviare Sprint 1**: scaffolding monorepo Turborepo + Next.js + NestJS + Prisma. Si veda `ROADMAP.md` → Sprint 1 per l'elenco dei task.

---

## Stato degli sprint

| Sprint | Obiettivo | Stato |
| --- | --- | --- |
| Pre-Sprint 1 | Setup documentazione | 🟡 Quasi completo (manca conversione specs) |
| Sprint 1 | Fondamenta (monorepo, DB schema, auth) | ⏳ Non iniziato |
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
2. Chiedi all'utente conferma dello sprint attivo e del task da affrontare.
3. Solo dopo vai a leggere la sezione rilevante di `docs/specs/` indicata nella tabella di `CLAUDE.md` §4.
