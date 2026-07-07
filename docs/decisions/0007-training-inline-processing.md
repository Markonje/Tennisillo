# ADR 0007 — Training: elaborazione inline invece del processor BullMQ

- **Stato**: accettato
- **Data**: 2026-07-06
- **Contesto**: Sprint 6 — Sparring + Master Lesson.

## Decisione

specs/02 §7.4 prevede un `training.processor` BullMQ con eventi
`sparring-validated` / `master-lesson-validated` / `training-session-revoked`.
Implementato invece **inline** dentro `TrainingSessionsService` (conferma,
validazione e revoca applicano punti/XP nella stessa transazione).

## Motivazione

1. I calcoli del training-engine sono banali (somma fissa + lookup curva):
   nessun beneficio dall'asincronia, a differenza dello scoring competitivo.
2. Redis/Upstash non è ancora configurato: il processor girerebbe comunque
   in fallback inline (pattern Sprint 4). Qui il fallback sarebbe l'unico
   percorso esercitato.
3. L'elaborazione transazionale garantisce coerenza immediata di
   `SeasonPlayer.currentPoints` e del profilo globale senza stati intermedi.

Se in futuro servisse (es. notifiche WebSocket pesanti, badge complessi), la
logica è già isolata nei metodi `confirmSparring` / `validateLesson` /
`revoke` e può essere spostata in un worker senza cambiare i contratti.

## Invariante critico (verificato da test)

Il flusso training **non scrive mai** su `ScoreDelta`, `HeadToHead`, né tocca
`matchesPlayed/wins/losses` di `SeasonPlayer`. Sparring incrementa solo
`currentPoints` (ricompensa fissa); le lezioni toccano solo il profilo globale
(`globalExperiencePoints`, `globalRating`, `globalLevel`). Verificato da
`src/training-sessions/__integration__/training.flow.int.ts` (4 test su DB reale).

## Note minori

- Badge "Studioso" (spec: 10 lezioni "in una stagione") implementato come 10
  lezioni in carriera: le MASTER_LESSON non hanno `seasonId` nel modello dati.
- Storno revoca lezione: il delta rating è ricalcolato con la curva usando gli
  XP precedenti all'assegnazione (esatto se non ci sono state altre lezioni nel
  frattempo, approssimazione conservativa altrimenti).
- Cap settimanale: alla **dichiarazione** contano pending + validati
  (anti-spam); alla **conferma** l'engine ricontrolla contando solo i validati,
  come da spec §5.2.
