# Portale Leghe Tennis Amatoriali

> Nome prodotto: Tennisillo (?) - a friendly neighborhood racket.

Web app per la gestione di leghe tennis amatoriali: ranking dinamico, sparring,
lezioni con maestro, calendario disponibilità, frequenza desiderata, anagrafica
campi. Ispirato al Fantacalcio (gestione leghe) e al circuito ATP (ranking).

## Documentazione

- **Analisi funzionale**: [`docs/specs/01_analisi_funzionale.md`](./docs/specs/01_analisi_funzionale.md)
- **Specifiche di sviluppo**: [`docs/specs/02_specifiche_sviluppo.md`](./docs/specs/02_specifiche_sviluppo.md)
- **Changelog specifiche**: [`docs/specs/CHANGELOG_SPECS.md`](./docs/specs/CHANGELOG_SPECS.md)
- **Decisioni architetturali (ADR)**: [`docs/decisions/`](./docs/decisions/)
- **Glossario e regole di dominio**: [`docs/context/`](./docs/context/)

### Come convertire (o aggiornare) le specifiche da Word a Markdown

I due documenti originali vengono consegnati in formato Word (`.docx`). Per
produrre le versioni Markdown pulite che il repo usa, lo script
`tools/normalize_specs.py` fa tutto il lavoro:

```bash
# Una tantum, al primo setup o dopo ogni revisione dei .docx
python3 tools/normalize_specs.py \
  /path/originale/01_Analisi_Funzionale_vX.Y.docx \
  docs/specs/01_analisi_funzionale.md

python3 tools/normalize_specs.py \
  /path/originale/02_Specifiche_di_Sviluppo_vX.Y.docx \
  docs/specs/02_specifiche_sviluppo.md

# Copia anche gli originali in archive/ per storia delle revisioni
cp /path/originale/01_Analisi_Funzionale_vX.Y.docx docs/specs/archive/
cp /path/originale/02_Specifiche_di_Sviluppo_vX.Y.docx docs/specs/archive/
```

Quando esce una nuova revisione:
1. Rigenera i due `.md` con lo script.
2. Aggiorna `docs/specs/CHANGELOG_SPECS.md` con il diff concettuale (cosa è cambiato).
3. Archivia il vecchio `.docx` in `docs/specs/archive/` con suffisso versione.

> Lo script richiede Python 3 e `pandoc` (per l'estrazione testo) o, se il
> `.docx` è in realtà già un file di testo Markdown esportato manualmente,
> gestisce anche quel caso.

## Lavorare con Claude Code

Questo repository è ottimizzato per lo sviluppo AI-assisted con
[Claude Code](https://docs.claude.com/en/docs/claude-code/overview).

- `CLAUDE.md` contiene le istruzioni permanenti lette automaticamente a ogni sessione.
- `PROGRESS.md` è lo stato di avanzamento vivo: si aggiorna a ogni sessione.
- `ROADMAP.md` elenca gli sprint e i loro criteri di done.

All'avvio di una sessione di sviluppo:

```
> "Leggi PROGRESS.md e dimmi qual è il prossimo task"
```

A fine sessione:

```
> "Aggiorna PROGRESS.md con quello che abbiamo fatto oggi"
```

## Stack

Next.js 14 · NestJS · Prisma · PostgreSQL (Supabase) · Redis (Upstash) · BullMQ ·
Turborepo · TypeScript · Tailwind · shadcn/ui · Mapbox · Stripe (passivo MVP).

Vedi `docs/specs/02_specifiche_sviluppo.md` §2 per dettagli e stime costi.

## Struttura del repository

```
tennis-league/
├── apps/                # web (Next.js) + api (NestJS)   [creati in Sprint 1]
├── packages/            # db, scoring-engine, training-engine,
│                        # matchmaking-engine, shared-types, ui
├── docs/                # specs, decisions (ADR), context
├── tools/               # utility CLI (es. normalize_specs.py)
├── CLAUDE.md            # istruzioni per Claude Code
├── PROGRESS.md          # stato di avanzamento
├── ROADMAP.md           # sprint e milestone
└── turbo.json           # monorepo config                [creato in Sprint 1]
```

## Setup (placeholder — cablato in Sprint 1)

```bash
pnpm install
cp .env.example .env        # da compilare con le chiavi dei servizi
pnpm --filter db migrate:dev
pnpm dev
```

## Licenza

Da definire (proprietaria).

## Autori

Ilijasevic Marko · Lorenzo Raimondo
