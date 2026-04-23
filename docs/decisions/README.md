# docs/decisions/

Architecture Decision Records (ADR): storico delle decisioni architetturali non
banali prese nel progetto. Servono a:

- Evitare di rimettere in discussione scelte già fatte.
- Dare a chi entra nel progetto (umano o AI) il **perché** dietro una decisione,
  non solo il cosa.
- Rendere rintracciabili i trade-off accettati.

## Quando creare un ADR

Quando una decisione è **non reversibile a costo zero**:
- Scelta di un servizio esterno (Supabase vs Firebase, Mapbox vs Google Maps).
- Pattern architetturale replicato in più moduli.
- Regola di dominio che emerge dal codice e non era esplicita nelle specs.
- Trade-off con implicazioni di sicurezza o performance.

Per decisioni tattiche piccole (scelta di un metodo JS, naming interno) non serve ADR.

## Formato

Numerazione progressiva a 4 cifre, nome descrittivo in kebab-case:

```
0001-monorepo-turborepo.md
0002-supabase-as-bass.md
0003-engine-separati.md
0004-...
```

Template consigliato:

```markdown
# ADR NNNN — Titolo sintetico

- **Data**: YYYY-MM
- **Stato**: Accettato | Proposto | Superseded by ADR NNNN | Deprecated
- **Autori**: …
- **Correlato**: riferimenti a specs o ADR

## Contesto
Cosa stavamo cercando di decidere e perché serviva decidere ora.

## Opzioni valutate
Elenco delle alternative con pro/contro, almeno 2-3.

## Decisione
Cosa abbiamo scelto, in modo chiaro.

## Conseguenze
Impatti positivi e negativi, cosa dovremo gestire di conseguenza.

## Riferimenti
Link utili.
```

## ADR attivi

- [0001 — Monorepo con Turborepo](./0001-monorepo-turborepo.md)
- [0002 — Supabase come backend-as-a-service](./0002-supabase-as-bass.md)
- [0003 — Engine di dominio separati](./0003-engine-separati.md)
