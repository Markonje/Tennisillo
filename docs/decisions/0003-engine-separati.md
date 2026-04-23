# ADR 0003 — Engine di dominio separati (scoring / training / matchmaking)

- **Data**: 2026-04
- **Stato**: Accettato
- **Autori**: Ilijasevic Marko, Lorenzo Raimondo
- **Correlato**: `docs/specs/02_specifiche_sviluppo.md` §1.2, §1.3, §4, §5, §6

## Contesto

Il progetto ha tre aree di logica algoritmica distinte:

1. **Scoring** — calcolo del `ΔP` per una partita competitiva validata, con
   formula multi-componente (livello, risultato, costanza, diversificazione,
   testa-a-testa, malus ripetizione, decay).
2. **Training** — gestione di Sparring (punti fissi + cap) e Master Lesson
   (XP globali con curva a rendimenti decrescenti). Regole semplici,
   fondamentalmente diverse dal scoring competitivo.
3. **Matchmaking** — selezione di candidati per Smart Match, combinando livello,
   diversificazione, disponibilità calendario, frequenza desiderata, prossimità
   geografica.

Il rischio da evitare è: far convivere queste tre logiche dentro un unico modulo
del backend, inquinandone la testabilità e rendendo facile che una logica
contamini l'altra (es. che uno Sparring finisca nel calcolo del `winStreak`
competitivo — violazione dell'invariante documentato in `DOMAIN_RULES.md`).

## Opzioni valutate

1. **Tutto dentro `apps/api`** (servizi NestJS che contengono la logica).
   - Pro: semplice, nessuna astrazione aggiuntiva.
   - Contro: le regole di business sono accoppiate a NestJS/Prisma; i test
     richiedono mock; il compilatore non può forzare l'invariante di isolamento
     tra domini.

2. **Un unico package `domain-engine`** che contiene tutto.
   - Pro: un solo import point.
   - Contro: stesso rischio di contaminazione tra domini; regressioni di test
     difficili da isolare.

3. **Tre package TypeScript puri separati** ← scelto.
   - `packages/scoring-engine/` — solo calcolo ΔP partite competitive.
   - `packages/training-engine/` — solo Sparring + Master Lesson + XP curve.
   - `packages/matchmaking-engine/` — solo algoritmo Smart Match.
   - Pro: boundary esplicito a livello di package; impossibile per il calculator
     competitivo ricevere una `TrainingSession` come input (tipi diversi);
     test unitari indipendenti; portabilità futura (edge, client mobile);
     possibilità di A/B test sostituendo un engine con una versione alternativa.
   - Contro: serve un po' più di scaffolding monorepo (accettabile, già
     previsto da ADR 0001).

## Decisione

**Tre package TypeScript puri separati**, ciascuno con:

- `src/` con funzioni pure, deterministiche, senza I/O.
- `types.ts` con l'interfaccia pubblica chiara.
- `__tests__/` con copertura ≥ 90%.
- Nessuna dipendenza da NestJS, Prisma, o altro framework.
- Nessun accesso a `Date.now()` interno: le date arrivano come parametri di input.

Il backend NestJS (`apps/api`) è l'unico responsabile di:
- Leggere/scrivere il database via Prisma.
- Preparare gli oggetti di input per gli engine.
- Applicare i risultati (es. scrivere `ScoreDelta` nel DB).
- Gestire code BullMQ e notifiche.

Il processor delle Training Session (`training.processor`) ha un **invariante
imposto da contratto**: non può scrivere su `ScoreDelta`, `HeadToHead`,
`matchesLast4Weeks`, `winStreak`, `pairCount`. L'invariante è verificato da
**test di integrazione** dedicati che fanno fallire la build se violato.

## Conseguenze

**Positive**
- Isolamento garantito dal type system: il calculator competitivo accetta solo
  tipi da `scoring-engine/types.ts`, che non includono `TrainingSession`.
- Evoluzione indipendente: possiamo aggiungere un futuro tipo di training
  ("Group Session", "Clinic") senza toccare il calcolo ranking.
- Test veloci: ogni engine è puro, i test girano in millisecondi, nessun DB.
- Contratti chiari: la revisione del codice si concentra sull'API dei tipi.

**Negative / da gestire**
- Più boilerplate di package.json iniziali (una tantum, risolto in Sprint 1).
- Le funzioni devono ricevere tutti i dati precomputati (es. `matchesLast4Weeks`)
  dal chiamante — il che impone di fare le query nel servizio NestJS. Ma
  questo è proprio ciò che garantisce la purezza.
- L'invariante di isolamento va **controllato attivamente** con test dedicati;
  non basta la documentazione.

## Riferimenti

- `docs/specs/02_specifiche_sviluppo.md` §4, §5, §6
- `docs/context/DOMAIN_RULES.md` (sezione "Isolamento del contributo non-competitivo")
- [Functional core, imperative shell](https://www.destroyallsoftware.com/screencasts/catalog/functional-core-imperative-shell)
