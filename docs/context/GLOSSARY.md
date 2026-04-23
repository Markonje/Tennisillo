# GLOSSARY.md — Termini di dominio

> Definizioni brevi e univoche dei termini usati nel progetto.
> Se un termine è ambiguo o compare per la prima volta nel codice, definiscilo qui.

## Concetti di piattaforma

**Lega**
Container multi-tenant che raggruppa giocatori, stagioni e regole competitive.
Può essere pubblica (catalogo aperto, iscrizione con approvazione) o privata (accesso solo con codice invito).

**Stagione**
Finestra temporale dentro una lega entro cui si disputano partite e si accumula punteggio.
Durata consigliata: `MAX(8, MIN(24, N_giocatori × 0.8))` settimane.

**Ruolo di lega**
Contesto di autorizzazione all'interno di una lega: `ADMIN`, `MODERATOR`, `PLAYER`, `GUEST`, `MASTER`.
Un utente può avere ruoli diversi in leghe diverse.

**Profilo globale**
Carta d'identità tennistica di un utente, condivisa tra tutte le leghe (rating globale, XP, badge, città, livello di gioco dichiarato).

**Profilo lega**
Vista contestuale del giocatore in una specifica lega (nickname, rating di lega, statistiche locali, preferenze).

## Sistema di punteggio

**Rating / ELO-like**
Numero continuo (0+) che rappresenta la forza stimata del giocatore.
Calcolato a due livelli: globale (cross-lega) e locale (per ogni lega).
Non è il punteggio stagione.

**Livello giocatore**
Discretizzazione del rating in 7 fasce: Rookie, Bronze, Silver, Gold, Platinum, Diamond, Elite.

**ΔP (Delta Punti)**
Punti accreditati/decurtati a un giocatore per una singola partita validata.
Formula: `ΔP = P_BASE × M_LIVELLO × M_RISULTATO + bonus − malus − decay`.

**P_BASE**
Punti base: 100 per vittoria, 30 per sconfitta, 12 per Sparring (entrambi i giocatori).

**M_LIVELLO**
Moltiplicatore che premia vittorie contro avversari più forti e penalizza quelle contro avversari più deboli.

**M_RISULTATO**
Moltiplicatore legato alla qualità del risultato (2-0 netto, 2-1 combattuto, tie-break, ecc.).

**B_COSTANZA**
Bonus per chi gioca regolarmente. Basato su partite **competitive** nelle ultime 4 settimane.
*Lo Sparring non alimenta la costanza.*

**B_DIVERSIFICAZIONE**
Bonus per chi affronta avversari sempre nuovi. Indice normalizzato sul totale degli avversari possibili.

**B_RIVALSA / B_DOMINANZA**
Bonus testa-a-testa quando un giocatore sovverte o ribadisce l'esito della sfida precedente con lo stesso avversario. Con cooldown di 21 giorni di default.

**Striscia di vittorie**
Sequenza di vittorie consecutive **contro avversari diversi**. Lo Sparring è neutrale rispetto alla striscia.

**Malus Ripetizione**
Penalità scalare applicata quando due giocatori si incontrano più volte nella stessa stagione, prima del limite. Non si applica agli Sparring.

**Limite partite per coppia**
Numero massimo di partite competitive tra due stessi giocatori nella stessa stagione. Calcolato dinamicamente: `ARROTONDA(MAX(2, MIN(5, 10/√N)))`.

**Decay inattività**
Decurtazione di punti stagione applicata a chi non gioca partite competitive per 3+ settimane consecutive. Sparring e Master Lesson **non** lo azzerano.

## Modalità non competitive

**Sparring**
Sessione di gioco tra due membri della stessa lega, dichiarata consensualmente come "allenamento". Dà +12 punti fissi a testa (configurabili 5-15), con cap settimanale (1 o 2). **Non** alimenta bonus, striscia, costanza, testa-a-testa. **Non** protegge dal decay. **Non** conta nel limite partite per coppia.

**Allenamento con Maestro** (Master Lesson)
Sessione formativa individuale tra un giocatore e un utente con ruolo `MASTER`. Dà XP Allenamento (+20 di default, configurabile 10-30) che alimentano **solo** il rating globale con curva a rendimenti decrescenti. **Non** contribuiscono alla classifica stagione. **Non** proteggono dal decay.

**Maestro**
Utente con ruolo di lega `MASTER`. Può essere "puro" (solo validatore, non compete) o "ibrido" (gioca + valida). Valida le Master Lesson dei giocatori che dichiarano di aver lavorato con lui.

**XP Allenamento**
Experience points accumulati dal giocatore ogni volta che una Master Lesson viene validata. Convertiti in delta rating globale tramite curva `xpCurve.ts`.

## Coordinamento giocatori

**Calendario disponibilità**
Modello in due livelli: `AvailabilityPattern` (ricorrente settimanale) + `AvailabilityOverride` (eccezioni su date specifiche). Granularità applicativa: 1 ora. Visibile agli altri membri della lega.

**Frequenza desiderata**
Soglia dichiarata di partite competitive volute per settimana o mese (`idealFrequency`, `maxFrequency`). Agli altri membri è esposta come **semaforo**: verde (sotto ideale), giallo (tra ideale e max), rosso (al/oltre max).

**Matching asimmetrico**
Logica che consente di proporre giocatori che non hanno dichiarato disponibilità, ma con priorità inferiore rispetto a chi l'ha fatto.

## Campi di gioco

**Venue**
Record di anagrafica di un campo o circolo. Scope: **per lega** (FK `leagueId` NOT NULL). Non esiste un'anagrafica globale.

**VenueProposal**
Proposta di nuovo venue fatta da un giocatore. Passa in stato `PENDING_VALIDATION` finché l'admin non approva (→ crea `Venue`) o rifiuta.

**Campo preferito**
Link strutturato tra `LeagueMember` e `Venue`: fino a 3 campi ordinati per priorità. Usato dal matchmaker geografico e come primo suggerimento nel selettore campo.

## Anti-frode

**Doppia validazione**
Meccanismo base per i risultati: chi registra il risultato lo sottopone all'avversario, che ha 24h per confermare/contestare. Se nessuna risposta → auto-confirm (configurabile).

**Geo-verifica**
Check GPS opzionale: entrambi i giocatori devono essere entro un raggio configurato (default 500m) dal venue. Se attiva e verificata, dà bonus "Partita Verificata".

**Pattern detection**
Motore che monitora coppie che giocano troppo, alternanza sistematica di vittorie, abusi Sparring, ecc. Genera alert all'admin.

**Reputazione**
Punteggio invisibile (visibile all'admin) che sale con comportamenti regolari e scende con contestazioni frequenti, walkover, segnalazioni.

**Disputa**
Stato di `Match` quando i due giocatori non concordano sul risultato. Richiede decisione admin.

## Piattaforma / tecnica

**Scoring Engine**
Package TS puro e deterministico che calcola ΔP per le partite competitive. Non ha dipendenze framework. Opera solo su `Match` validati.

**Training Engine**
Package TS puro che gestisce Sparring e Master Lesson. Isolato dallo Scoring Engine.

**Matchmaking Engine**
Package TS puro che produce candidati ordinati per Smart Match, combinando livello, diversificazione, disponibilità, frequenza, prossimità geografica.

**Audit Log**
Registro append-only delle mutazioni di stato significative (chi, quando, cosa, su quale risorsa).

**Feature flag**
Switch logico per abilitare/disabilitare funzionalità a livello di utente/tier/lega senza redeploy. Implementati con Growthbook.

**Tier**
Livello di abbonamento dell'utente (`FREE` / `PREMIUM`) o della lega (`FREE` / `PREMIUM`). Condiziona feature disponibili.
