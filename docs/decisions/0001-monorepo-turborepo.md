# ADR 0001 — Monorepo con Turborepo e pnpm workspaces

- **Data**: 2026-04
- **Stato**: Accettato
- **Autori**: Ilijasevic Marko, Lorenzo Raimondo
- **Correlato**: `docs/specs/02_specifiche_sviluppo.md` §2.3

## Contesto

Il progetto ha due applicazioni (web Next.js e api NestJS) e almeno tre engine di
dominio (scoring, training, matchmaking) che devono essere condivisi tra le due.
Servono anche pacchetti comuni: schema Prisma, tipi condivisi, design system.

Gli engine devono restare **puri** (TS puro, senza framework) per essere testati in
isolamento e, in futuro, portabili su edge functions o client mobile.

## Opzioni valutate

1. **Polyrepo** (un repo per app/package, npm packages privati).
   - Pro: isolamento forte.
   - Contro: overhead enorme per un team di 2 persone, condivisione tipi complicata,
     migration di breaking change moltiplicate.

2. **Monorepo con pnpm workspaces senza task runner**.
   - Pro: zero tool runner, semplice.
   - Contro: niente caching dei task, rebuild completi ogni volta.

3. **Monorepo con Nx**.
   - Pro: feature ricche (plugin, generators, affected).
   - Contro: curva di apprendimento, ingombra.

4. **Monorepo con Turborepo + pnpm workspaces** ← scelto.
   - Pro: caching incrementale, pipeline task parallele, adozione Vercel-native
     (coerente con stack), setup minimo, migrazione da/a altri sistemi semplice.
   - Contro: meno feature di Nx (accettabile per la nostra scala).

## Decisione

Monorepo con **Turborepo** e **pnpm workspaces**.

Struttura:

```
tennis-league/
├── apps/
│   ├── web/      # Next.js 14
│   └── api/      # NestJS
├── packages/
│   ├── db/
│   ├── scoring-engine/
│   ├── training-engine/
│   ├── matchmaking-engine/
│   ├── shared-types/
│   └── ui/
└── turbo.json
```

## Conseguenze

- Un solo `pnpm-lock.yaml`.
- `turbo.json` definisce pipeline: `build`, `dev`, `lint`, `test`, `typecheck`.
- Deploy indipendenti per web (Vercel) e api (Railway), con Turborepo remote cache
  eventuale in futuro.
- Ogni package ha il suo `package.json` con dipendenze esplicite: no dipendenze
  sottintese tra package.
- Gli engine (`scoring`, `training`, `matchmaking`) pubblicano tipi e funzioni pure;
  non dipendono da NestJS, Prisma o Next.js.

## Riferimenti

- [Turborepo docs](https://turborepo.com/docs)
- [pnpm workspaces](https://pnpm.io/workspaces)
