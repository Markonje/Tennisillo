# ADR 0005 — Scoring Engine: interpretazioni della spec e architettura di integrazione

- **Stato**: accettato
- **Data**: 2026-07-06
- **Contesto**: Sprint 4 — implementazione `packages/scoring-engine` + integrazione in `apps/api`.

## Contesto

La spec funzionale (01 §8) definisce l'algoritmo multi-componente del punteggio, ma:

1. il "Documento 2 v1.0" citato da specs/02 §4.4 (con il codice completo dei componenti)
   **non esiste nel repo** — l'archivio contiene solo un README;
2. l'esempio pratico §8.12 **contraddice le tabelle normative** in tre punti;
3. alcune scelte (valori SOFT/HARD, semantica dei contatori, bookkeeping del decay)
   non sono specificate.

## Decisioni

### 1. Le tabelle normative vincono sull'esempio §8.12

Discrepanze rilevate (documentate anche in `docs/context/FAQ.md`):

| Punto | Tabella | Esempio §8.12 | Scelta |
| --- | --- | --- | --- |
| Diversificazione indice 0.75 | ≥0.6 → +8 (§8.7) | +15 | **+8** |
| M_LIVELLO sconfitto vs -1 livello | ×0.8 (§8.4) | ×1.1 | **×0.8** |
| Primo incontro (+10) per lo sconfitto | §8.7 non distingue i ruoli | omesso | **+10 a entrambi** |
| Bonus resistenza sconfitto 2-0 con ≥4 game | +5 (§8.5) | omesso | **+5** |

Il test `calculator.test.ts` asserisce i valori da tabella (A: **+228**, B: **+44**
nello scenario §8.12) e documenta le differenze nel commento di testa.

### 2. Moltiplicatori SOFT/HARD per interpolazione

La spec nomina i modi OFF/SOFT/NORMAL/HARD senza tabelle numeriche.
Definiti come: `SOFT = 1 + (normal − 1) × 0.5`, `HARD = 1 + (normal − 1) × 1.5`,
`OFF = 1.0`. Monotoni, deterministici, banali da ritarare.

### 3. Precedenza M_RISULTATO

Fissata dall'esempio §8.12 (6-4 7-6 trattato come 2-0 ×1.2):
super tie-break decisivo (0.95) → nessun set perso (1.2) → almeno un set
al tie-break avendo perso un set (1.05) → altrimenti 1.0.

### 4. Semantica dei contatori di contesto

- `matchesLast4Weeks`, `totalMatchesThisSeason`, `uniqueOpponentsThisSeason`:
  **includono** la partita che si sta calcolando (fissato dall'esempio: "3 partite → +10").
- `currentWinStreak` / `winStreakOpponentIds`: stato **precedente** alla partita
  (l'engine estende internamente la striscia: 2 pre-match → 3ª vittoria → +20).
- Contesto H2H: stato **precedente** alla partita.

### 5. Malus ripetizione a gradini per etichetta

I dati §8.9 (-8 intermedia, -18 penultima, -30 ultima) non definiscono una formula:
implementato piecewise esattamente sulle etichette della spec (prima=0, ultima=-30,
penultima=-18, altre intermedie=-8), con clamp a -30 oltre il limite.

### 6. Flusso asincrono con fallback inline

Lo scoring gira su coda BullMQ `scoring` (specs/02 §7.4). **Senza Redis il job
viene eseguito inline** al momento della validazione: l'engine è puro e veloce,
quindi il fallback sincrono è sicuro e mantiene la classifica sempre coerente.
Stesso pattern dell'auto-confirm 24h (coda + lazy check).

### 7. Decay sweep settimanale con bookkeeping su AuditLog

Non esiste un modello per "ultimo decay applicato": lo sweep settimanale usa
l'`AuditLog` (`action=DECAY_APPLIED`, `entityId=seasonPlayerId`) per applicare al
massimo un decay per giocatore ogni 7 giorni. Il job repeatable BullMQ
(`0 3 * * 1`) parte solo con Redis configurato; `ScoringService.runDecaySweep()`
è invocabile manualmente. Le eccezioni al decay (pausa programmata, infortunio)
non hanno ancora un modello dati → non implementate (vedi FAQ).

### 8. Cooldown bonus rivalsa fisso a 21 giorni

`SeasonSettings` non ha un campo per il cooldown rivalsa (§8.13 default 21gg);
`h2hCooldownDays` (default 7) è il cooldown **rivincita** di §6.4, usato per
bloccare nuove sfide della stessa coppia. Il cooldown del bonus rivalsa è la
costante `RIVAL_COOLDOWN_DAYS = 21` in `scoring.service.ts`; diventerà
configurabile quando verrà aggiunto il campo a schema.

## Conseguenze

- L'engine è 100% puro e deterministico (nessun `Date.now()`), coverage 100%/95%.
- Il criterio di done "numeri esatti dell'esempio §8.12" è soddisfatto **al netto
  delle contraddizioni interne della spec**, risolte a favore delle tabelle.
- La regola secondaria anti-abuso §8.8 ("azzeramento dopo 2 partite consecutive
  della coppia fino a 2 avversari diversi ciascuno") richiede contesto aggiuntivo
  non modellato: mitigata dal cooldown 21gg + limite coppia. Tracciata in FAQ.
