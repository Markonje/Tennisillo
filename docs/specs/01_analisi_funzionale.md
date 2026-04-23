---
documento: 01 — Analisi Funzionale
progetto: "Tennisillo — a friendly neighborhood racket"
versione: "2.0"
data: 2026-04
autori:
  - Ilijasevic Marko
  - Lorenzo Raimondo
stato: Approvato per sviluppo
documento_correlato: docs/specs/02_specifiche_sviluppo.md
note_revisione: >
  Revisione 2.0 con integrazione Sparring, Calendario Disponibilità,
  Frequenza Desiderata e Anagrafica Campi di lega.
---

# Analisi Funzionale — Tennisillo

> Questo documento è la **fonte di verità funzionale** del progetto.
> Per le specifiche tecniche di implementazione vedere
> [`02_specifiche_sviluppo.md`](./02_specifiche_sviluppo.md).
> Per lo storico delle revisioni vedere
> [`CHANGELOG_SPECS.md`](./CHANGELOG_SPECS.md).

## Executive Summary

Il progetto consiste nello sviluppo di un portale web (con companion app mobile in fase successiva) dedicato ai tennisti amatori per la gestione di leghe private o pubbliche. L'ispirazione di prodotto combina due modelli: il Fantacalcio per la gestione delle leghe (creazione, inviti, partecipazione multi-lega) e il circuito ATP per la logica di ranking e stagioni competitive.

**Obiettivi primari:**

- Creare una community organizzata di tennisti amatori con strumenti di competizione strutturati.

- Garantire integrità e trasparenza dei risultati attraverso un sistema di doppia validazione e meccanismi anti-frode.

- Premiare costanza, diversificazione degli avversari e qualità del gioco, non solo le vittorie assolute.

- Essere scalabile da leghe di 4 giocatori fino a leghe di centinaia di partecipanti.

- Favorire l'incontro tra giocatori attraverso strumenti di coordinamento (calendario disponibilità, frequenza desiderata, anagrafica campi) che riducono la frizione organizzativa.

**Punti distintivi:**

- Sistema di punteggio multi-componente dinamico (ispirato a ELO con bonus contestuali) in cui ogni partita genera un delta di punti calcolato su livello avversario, qualità del risultato, costanza, diversificazione, testa a testa e striscia di vittorie.

- Configurabilità avanzata dei parametri stagione da parte dell'admin di lega, con default calcolati automaticamente in base al numero di partecipanti.

- Architettura modulare che supporta tennis singolo, tennis doppio e Padel attivabili opzionalmente per lega.

- Modalità Sparring per partite di allenamento consensuale tra membri della lega, con ricompensa minima e cap configurabile.

- Modulo Allenamento con Maestro che genera XP separati, disaccoppiati dalla classifica stagione, alimentando esclusivamente il livello globale del giocatore.

- Calendario disponibilità per giocatore con pattern ricorrenti e override, integrato nell'algoritmo di matchmaking.

- Frequenza di gioco desiderata come parametro di matching, per proporre avversari con probabilità reale di accettare la sfida.

- Anagrafica campi per lega con integrazione ai sistemi di prenotazione esterni, per completare il flusso di organizzazione partita.

Sistema anti-frode multi-livello: doppia validazione, geo-verifica opzionale, pattern detection, sistema di reputazione.

Gamification con badge, achievement, statistiche avanzate e classifiche multiple.

Modello di business previsto: misto tra freemium per utente (funzionalità base gratuite, statistiche avanzate e leghe illimitate a pagamento), leghe premium (admin paga per funzionalità avanzate come playoff, anti-frode evoluto, export dati) e advertising non intrusivo per utenti free.

Supporto linguistico: MVP in Inglese e Italiano, con architettura predisposta per estensione multilingua futura.

Identità visiva: design system ispirato allo stile Apple iOS — pulito, moderno, centrato sulla chiarezza.

## Indice

1. Visione Generale e Obiettivi

2. Architettura Utenti e Ruoli

3. Profilo Giocatore

4. Sistema Leghe

5. Sistema Stagioni

6. Matchmaking

7. Sistema Registrazione Partite e Anti-Frode

8. Sistema Punteggi — Core Engine

9. Sparring e Allenamento con Maestro

10. Calendario Disponibilità e Frequenza Desiderata

11. Anagrafica Campi di Lega

12. Classifiche

13. Notifiche e Comunicazioni

14. Funzionalità Aggiuntive Proposte

15. Considerazioni Tecniche di Alto Livello

16. Roadmap di Sviluppo

17. Decisioni Chiave Consolidate

## 1. Visione Generale e Obiettivi
### 1.1 Descrizione del Prodotto

Il portale è un'applicazione web (con companion app mobile prevista in fase successiva) che permette a tennisti amatori di organizzarsi in leghe private o pubbliche, gestire partite, classifiche e stagioni con un sistema di punteggio dinamico, trasparente e anti-abuso. Il modello di riferimento è ibrido tra il Fantacalcio (per la gestione delle leghe) e il circuito ATP (per la logica di ranking e stagioni).

### 1.2 Obiettivi Primari

- Creare una community di tennisti amatori organizzata e competitiva.

- Garantire integrità e trasparenza dei risultati.

- Premiare la costanza, la diversificazione e la qualità del gioco.

- Essere scalabile da leghe di 4 persone a leghe di centinaia di giocatori.

- Ridurre la frizione organizzativa nell'incontro tra giocatori attraverso strumenti integrati di coordinamento (calendario, frequenza desiderata, anagrafica campi).

## 2. Architettura Utenti e Ruoli
### 2.1 Tipologie di Utenti

SUPER ADMIN (piattaforma)

    └── ADMIN LEGA (creatore/gestore lega)

         ├── MODERATORE LEGA (facoltativo, delegato dall'admin)

         ├── MAESTRO DI LEGA (ruolo opzionale, vedi §9.2)

         ├── GIOCATORE MEMBRO

         └── GIOCATORE OSPITE (partecipa a singola stagione

                                senza iscrizione permanente)

> **★ NUOVA FUNZIONALITÀ — Ruolo Maestro** *Il ruolo Maestro è un nuovo ruolo di lega introdotto in questa revisione. Un utente può essere registrato come Maestro puro (senza partecipare alla competizione) o come Giocatore+Maestro (figura ibrida che compete e valida allenamenti). La scelta è individuale in fase di accettazione del ruolo. Il Maestro non partecipa alla classifica stagione in qualità di maestro; se è anche giocatore, la sua attività competitiva è tracciata separatamente dalle sessioni di allenamento che valida. Vedi §9.2 per i dettagli.*

### 2.2 Permessi per Ruolo

| **Funzione** | **Super Admin** | **Admin Lega** | **Moderatore** | **Maestro** | **Giocatore** |
| --- | --- | --- | --- | --- | --- |
| Gestione piattaforma | Sì | No | No | No | No |
| Crea / elimina lega | Sì | Sì (propria) | No | No | No |
| Invita giocatori | Sì | Sì | Sì | No | No |
| Configura stagione | Sì | Sì | No | No | No |
| Modifica regole punteggio | Sì | Sì | No | No | No |
| Convalida partite | Sì | Sì | Sì | No | No |
| Inserisce risultato | Sì | Sì | Sì | No | Sì (proprie) |
| Contesta risultato | Sì | Sì | Sì | No | Sì (proprie) |
| Valida allenamenti (§9.2) | Sì | No | No | Sì | No |
| Gestisce anagrafica campi (§11) | Sì | Sì | No | No | Proponi (§11.2) |
| Visualizza classifiche | Sì | Sì | Sì | Sì | Sì |

*Le righe evidenziate indicano permessi introdotti in questa revisione.*

## 3. Profilo Giocatore
### 3.1 Profilo Globale (Cross-Lega)

Il profilo globale è la carta d'identità tennistica del giocatore sulla piattaforma, condivisa tra tutte le leghe a cui partecipa.

**Dati anagrafici:**

- Nome, cognome, username univoco, avatar.

- Email, numero di telefono (opzionale).

- Città o zona geografica.

- Anno di nascita.

**Dati tennistici globali:**

- Livello globale calcolato (vedi §8 — algoritmo ELO-like).

- Classifica globale sulla piattaforma.

- Storico partite totali (tutte le leghe).

- Win rate globale, set vinti/persi, game vinti/persi.

- Badge e achievement conseguiti.

- Leghe attive e storiche di appartenenza.

- Stagioni giocate.

- **XP Allenamento totali accumulati (vedi §9.2), **con contributo separato al livello globale ma non alla classifica stagione.

**Livello di gioco dichiarato (onboarding):**

In fase di registrazione il giocatore dichiara il proprio livello approssimativo mediante un questionario di onboarding:

- Ranking FIT / USTA / UTR se disponibile.

- Autovalutazione (principiante / intermedio / avanzato / agonista).

- Anni di esperienza.

- Frequenza di gioco settimanale.

Il livello dichiarato è solo il seed iniziale; il sistema poi calcola un livello dinamico reale basato sulle performance.

### 3.2 Profilo Lega-Specifico

Ogni giocatore che entra in una lega ottiene un profilo contestuale a quella lega:

- Nickname lega (può essere diverso dall'username globale).

- Livello interno alla lega (calcolato separatamente).

- Statistiche nella lega: partite, vittorie, sconfitte, punteggio stagione corrente.

- Storico stagioni nella lega.

- Testa a testa contro ogni altro membro della lega.

- Preferenze di disponibilità (vedi §10 — Calendario Disponibilità).

- **Frequenza desiderata di gioco settimanale **(vedi §10.3), visibile agli altri membri della lega.

- **Campo/club di riferimento preferito **(link all'anagrafica campi di lega, vedi §11).

- Note pubbliche del giocatore (es. "preferisco giocare al mattino").

## 4. Sistema Leghe
### 4.1 Tipologie di Lega

**Lega Pubblica:**

- Visibile nel catalogo leghe della piattaforma.

- Chiunque può fare richiesta di iscrizione.

- L'admin approva o rifiuta le richieste.

- Può avere un limite massimo di partecipanti.

**Lega Privata:**

- Non visibile nel catalogo.

- Accessibile solo tramite codice invito o link univoco.

- L'admin gestisce gli inviti manualmente.

**Lega Aperta per Stagione:**

- Ibrido: la lega è fissa ma ogni stagione può accettare nuovi membri.

- I nuovi entrati partono con penalità di livello (per evitare distorsioni).

### 4.2 Tipologia di Sport Supportato

La lega, alla creazione, viene classificata secondo uno dei seguenti formati:

- Tennis Singolo — modulo base, partite 1v1.

- Tennis Doppio — modulo doppio attivo, coppie fisse o rotanti.

- Tennis Singolo + Doppio — entrambi attivi, classifiche separate o combinate secondo configurazione.

- Padel — modulo doppio con regole specifiche del Padel.

- Padel + Tennis Misto — futura evoluzione.

Il doppio è trattato come modulo attivabile e non come prodotto separato. Questo rende il portale utilizzabile anche per il Padel senza duplicazione di codice o interfacce.

### 4.3 Configurazione della Lega

L'admin della lega configura i seguenti parametri alla creazione (modificabili prima dell'inizio stagione):

**Parametri generali:**

- Nome lega, descrizione, logo/immagine.

- Tipologia (pubblica/privata).

- Numero minimo e massimo partecipanti.

- Sport: singolo, doppio, entrambi, Padel.

- Formato partite: best of 1 set, best of 3, super tie-break, formato personalizzato.

**Parametri stagione (vedi §5):**

- Durata stagione.

- Numero massimo partite per giocatore per stagione.

- Numero massimo partite tra stessa coppia di giocatori.

- Finestre di gioco obbligatorie o libere.

**Parametri punteggio (vedi §8):**

- Attivazione/disattivazione dei bonus/malus singoli.

- Peso dei moltiplicatori.

- Soglie per livelli.

**Parametri allenamento (vedi §9):**

- Attivazione/disattivazione Sparring a livello lega.

- Cap Sparring settimanale per giocatore (1 o 2, default 2).

- Attivazione/disattivazione modulo Allenamento con Maestro.

- Gestione dei Maestri di Lega (invito, promozione, revoca).

**Parametri anagrafica campi (vedi §11):**

- Attivazione anagrafica campi dedicata alla lega.

- Abilitazione proposte campi da parte dei giocatori.

## 5. Sistema Stagioni
### 5.1 Logica della Stagione

La stagione è il contenitore temporale entro cui si svolgono le partite e si accumula il punteggio per la classifica. Al termine della stagione la classifica si congela, vengono assegnati i premi finali, e si apre opzionalmente una nuova stagione.

### 5.2 Durata Ottimale della Stagione

La durata ottimale deve permettere a ogni giocatore di disputare un numero significativo di partite contro avversari diversi. La formula proposta:

DURATA_SETTIMANE = MAX(8, MIN(24, N_GIOCATORI × 0.8))

**Esempi pratici:**

- 5 giocatori → 8 settimane (minimo)

- 10 giocatori → 8 settimane

- 16 giocatori → 13 settimane

- 20 giocatori → 16 settimane

- 30 giocatori → 24 settimane (massimo standard)

Questa formula garantisce che ogni giocatore abbia l'opportunità di affrontare almeno una volta tutti gli avversari.

**Parametri configurabili dall'admin:**

- Durata minima: 6 settimane.

- Durata massima: 52 settimane.

- Possibilità di estendere la stagione in corso (fino a +4 settimane, con consenso 2/3 dei giocatori attivi).

- Stagione a calendario fisso (es. sempre settembre-dicembre) o a partire dall'inizio.

### 5.3 Fasi della Stagione

[PRE-STAGIONE] → [STAGIONE ATTIVA] → [PLAYOFF opzionale] → [POST-STAGIONE/PREMI]

     │                 │                    │                      │

  Iscrizioni       Partite libere        Top N giocatori         Freeze ranking

  Seeding          Accumulo punti        Format eliminaz.        Badge/premi

  Regole           Classifiche live      (opzionale)             Storico

**Pre-stagione (1-2 settimane):**

- Conferma partecipanti.

- Seeding iniziale basato su profilo globale.

- Comunicazione regole stagione.

**Stagione Attiva:**

- Partite libere entro i vincoli configurati.

- Aggiornamento classifiche in tempo reale.

- Sfide dirette e matchmaking.

**Playoff (opzionale, configurabile dall'admin):**

- I top N giocatori (es. top 4, top 8) si qualificano.

- Formato a eliminazione diretta o round-robin finale.

- I punti playoff si sommano ai punti stagione o costituiscono classifica separata.

**Post-stagione:**

- Freeze della classifica.

- Assegnazione badge e premi virtuali.

- Calcolo del livello per la stagione successiva.

- Archivio consultabile.

### 5.4 Gestione Multi-Stagione

- Ogni lega può avere più stagioni consecutive.

- Il livello del giocatore si porta da stagione a stagione (con decay se inattivo).

- Statistiche cumulative disponibili (carriera nella lega).

- Rivalità storiche tracciate.

## 6. Matchmaking
### 6.1 Tipologie di Partita

- **Partita Libera (Free Match): **Il giocatore A sfida il giocatore B direttamente tramite la piattaforma. Entrambi devono accettare.

- **Partita Suggerita (Smart Match): **Il sistema suggerisce avversari ottimali basandosi su criteri multipli (vedi §6.3).

- **Partita Schedulata (Torneo interno): **L'admin o il sistema genera il calendario delle partite (round-robin, girone, etc.)

- **Sparring (§9.1): **Sessione di allenamento consensuale tra due membri della lega, dichiarata come tale e validata con lo stesso meccanismo delle partite competitive.

- **Allenamento con Maestro (§9.2): **Sessione individuale con un utente dotato del ruolo Maestro; non è una partita ma è tracciata a fini XP.

### 6.2 Flusso di una Partita Competitiva

1. SFIDA

   Giocatore A invia sfida a Giocatore B

   → B riceve notifica

   → B accetta / rifiuta / propone alternativa

2. ACCORDO

   I due giocatori concordano:

   - Data e ora (con supporto del calendario disponibilità, §10)

   - Campo/luogo (selezionato dall'anagrafica campi di lega, §11)

   → Eventuale link diretto al sito di prenotazione del campo

   → Partita entra in stato "PROGRAMMATA"

   → La programmazione occupa automaticamente lo slot nel calendario

3. GIOCO

   La partita viene disputata

4. REGISTRAZIONE RISULTATO (vedi §7)

5. VALIDAZIONE

6. CALCOLO PUNTI (vedi §8)

### 6.3 Criteri di Smart Matchmaking

Il motore di Smart Match propone avversari ottimali applicando i seguenti criteri in ordine di priorità:

- **Compatibilità di livello: **livello simile (±1 livello).

- **Diversificazione: **pochi o nessun precedente nella stagione corrente.

- **Compatibilità oraria: **intersezione degli slot di disponibilità dichiarati (vedi §10).

- **Frequenza desiderata **(vedi §10.3): il sistema preferisce avversari che **non hanno ancora saturato** la propria soglia di gioco settimanale, aumentando la probabilità che accettino la sfida.

- **Distanza geografica: **prossimità dei campi preferiti (se abilitata).

- **Matching asimmetrico: **un giocatore che non ha dichiarato disponibilità è considerato "proponibile" (non escluso), con priorità inferiore rispetto a chi ha slot esplicitamente compatibili.

### 6.4 Regole di Matchmaking Anti-Abuso

- **Limite sfide pendenti: **max 3 sfide aperte contemporaneamente per giocatore.

- **Cooldown rivincita: **dopo una partita tra A e B, non è possibile richiedere immediatamente una nuova sfida; esiste un cooldown configurabile (es. 7 giorni, o fino a che non si è giocato contro altri N avversari).

- **Limite partite per coppia per stagione: **configurabile dall'admin, calcolato dinamicamente (vedi §8.9). Gli Sparring **non** rientrano in questo conteggio.

## 7. Sistema Registrazione Partite e Anti-Frode

Questo è uno degli aspetti più critici. Il sistema deve rendere impossibile (o quantomeno molto costoso) falsificare risultati o registrare partite mai giocate.

### 7.1 Metodo di Registrazione: Doppia Validazione

FLUSSO STANDARD:

┌─────────────────────────────────────────────────────┐

│ Giocatore A inserisce risultato                     │

│ → Sistema notifica Giocatore B                      │

│ → B ha 24h per CONFERMARE o CONTESTARE              │

│ → Se confermato: risultato VALIDATO                 │

│ → Se contestato: aperta DISPUTA                     │

│ → Se nessuna risposta in 24h: auto-conferma         │

│   (configurabile: può essere disabilitata)          │

└─────────────────────────────────────────────────────┘

Lo stesso meccanismo di doppia validazione si applica allo Sparring (§9.1) e, con lievi differenze, all'Allenamento con Maestro (§9.2) dove la validazione è unilaterale del Maestro.

### 7.2 Meccanismi Anti-Frode Specifici
#### 7.2.1 Geo-Verifica (opzionale, configurabile)

Al momento della registrazione del risultato, entrambi i giocatori possono essere invitati a fare un check-in GPS dal campo. Il sistema verifica che entrambi si trovino nello stesso luogo (raggio configurabile, es. 500m). Non obbligatorio, ma se attivo dà un bonus "Partita Verificata".

#### 7.2.2 Time-Window

Il risultato può essere registrato solo entro una finestra temporale dalla partita programmata (es. entro 12 ore dall'orario concordato). Partite registrate molto tempo dopo generano un flag di revisione.

#### 7.2.3 Score Plausibility Check

Il sistema analizza il punteggio inserito per rilevare anomalie:

- Punteggi impossibili secondo le regole del tennis (es. 7-5 in un set quando il formato è tie-break a 4 game).

- Punteggi statisticamente molto improbabili rispetto al livello dei giocatori (es. un giocatore di livello 1 che batte 6-0 6-0 un giocatore di livello 5 genera un alert).

#### 7.2.4 Pattern Detection (Anti-Collusion)

Il motore di analisi monitora nel tempo:

- Coppie che giocano tra loro più del limite configurato.

- Coppie che si alternano le vittorie sistematicamente (A batte B, B batte A, A batte B... in sequenza perfetta).

- Giocatori che accumulano punti bonus (rivincita, diversificazione) in modo sospetto.

- Coppie che abusano dello Sparring per aggirare il limite partite (il cap settimanale per Sparring è una difesa diretta, ma il motore monitora comunque pattern di frequenza anomala).

Report automatici all'admin se vengono superati threshold di anomalia.

#### 7.2.5 Sistema di Reputazione

Ogni giocatore ha un punteggio di reputazione (invisibile agli altri giocatori, visibile all'admin):

- Aumenta con: conferme rapide, partite regolari, nessuna contestazione.

- Diminuisce con: contestazioni frequenti, partite annullate all'ultimo momento, segnalazioni di altri giocatori.

Se la reputazione scende sotto soglia, le partite del giocatore vengono sottoposte a revisione manuale dell'admin.

#### 7.2.6 Disputa e Arbitrato

In caso di contestazione:

- Entrambi i giocatori inseriscono la propria versione del risultato.

- Se concordano → risultato accettato.

- Se discordano → moderatore/admin decide (con possibilità di richiedere prove: screenshot, foto, testimoni).

- Decisione dell'admin è definitiva e inappellabile (nella stagione corrente).

- Giocatore che perde la disputa riceve un avviso; alla seconda disputa persa riceve una penalità di reputazione.

## 8. Sistema Punteggi — Core Engine

Questo è il cuore dell'applicazione. Il sistema è basato su un algoritmo multi-componente che combina un rating ELO modificato con un sistema di bonus/malus contestuali.

### 8.1 Architettura del Punteggio

Ogni partita competitiva genera per ciascun giocatore un Delta Punti (ΔP) così composto:

ΔP = P_BASE × M_LIVELLO × M_RISULTATO

     + B_COSTANZA

     + B_DIVERSIFICAZIONE

     + B_RIVALSA

     - MALUS_RIPETIZIONE

     - DECAY_INATTIVITÀ

*Lo Sparring (§9.1) utilizza una formula semplificata e fissa (+12 punti a testa) che bypassa moltiplicatori e bonus, mentre l'Allenamento con Maestro (§9.2) non genera punti stagione ma XP separati.*

### 8.2 Livelli Giocatore

Il sistema definisce 7 livelli (configurabili da 5 a 10):

| **Livello** | **Nome** | **Rating Range** | **Descrizione** |
| --- | --- | --- | --- |
| 1 | **Rookie** | 0 — 999 | Principiante assoluto |
| 2 | **Bronze** | 1000 — 1499 | Base consolidata |
| 3 | **Silver** | 1500 — 1999 | Intermedio |
| 4 | **Gold** | 2000 — 2499 | Buon giocatore |
| 5 | **Platinum** | 2500 — 2999 | Avanzato |
| 6 | **Diamond** | 3000 — 3499 | Semi-agonista |
| 7 | **Elite** | 3500+ | Agonista |

Il livello viene calcolato separatamente per:

- Profilo globale piattaforma (include contributo XP Allenamento con Maestro, vedi §9.2).

- Profilo lega corrente (seed dalla media globale + storia nella lega).

### 8.3 Punti Base (P_BASE)

Ogni partita vinta assegna punti base. Anche la sconfitta assegna punti (premiando la partecipazione):

| **Esito** | **Punti Base** |
| --- | --- |
| Vittoria | **100** |
| Sconfitta | **30** |
| Walkover (forfait avversario) | 15 (non piena) |
| Partita non completata (ritiro) | 20 per chi completa, 0 per chi si ritira |
| Sparring (sessione di allenamento) | **12 a testa (fisso, no moltiplicatori)** |

### 8.4 Moltiplicatore Livello (M_LIVELLO)

Questo è il cuore della dinamica "è più difficile vincere contro chi è più forte":

DIFFERENZA_LIVELLI = Livello_Avversario - Livello_Giocatore

M_LIVELLO (per il VINCITORE):

  +3 livelli o più: ×2.5  (vittoria eroica)

  +2 livelli:        ×2.0

  +1 livello:        ×1.5

   0 livelli:        ×1.0  (baseline)

  -1 livello:        ×0.7

  -2 livelli:        ×0.5

  -3 livelli o più: ×0.3  (vittoria attesa, poco merito)

M_LIVELLO (per lo SCONFITTO):

  Perso contro +2 o più: ×1.2  (ha perso contro molto più forte)

  Perso contro +1:        ×1.1

  Parità:                  ×1.0

  Perso contro -1:        ×0.8  (avrebbe dovuto vincere)

  Perso contro -2 o più: ×0.6  (sconfitta pesante)

### 8.5 Moltiplicatore Risultato (M_RISULTATO)

Premia la qualità della vittoria, non solo il fatto di vincere:

(per il VINCITORE)

  Vittoria 2-0 (sets) senza cedere set: ×1.2

  Vittoria 2-1 (sets):                   ×1.0

  Vittoria al super tie-break:           ×0.95

  Vittoria con almeno 1 set al tie-break: ×1.05

(per lo SCONFITTO — bonus resistenza)

  Perso 2-1 portando al terzo: +15 punti fissi "Combattente"

  Perso 2-0 ma vincendo almeno 4 game: +5 punti fissi

### 8.6 Bonus Costanza (B_COSTANZA)

Premia chi gioca regolarmente durante la stagione.

**Importante: **lo Sparring **non** conta ai fini del bonus costanza, per evitare che diventi una scorciatoia per accumulare bonus senza affrontare partite competitive.

PARTITE COMPETITIVE GIOCATE NELLE ULTIME 4 SETTIMANE:

  4+ partite → +20 punti per partita

  3 partite  → +10 punti per partita

  2 partite  → +5 punti per partita

  1 partita  → +0

  0 partite  → DECAY (vedi §8.10)

STRISCIA DI VITTORIE (contro avversari diversi):

  2 vittorie consecutive (avv. diversi) → +10 punti alla 2ª

  3 vittorie consecutive (avv. diversi) → +20 punti alla 3ª

  4+ vittorie consecutive                → +30 punti per ogni vittoria ulteriore

  → La striscia si azzera alla prima sconfitta

  → IMPORTANTE: vale solo se gli avversari sono tutti diversi

  → Gli Sparring NON interrompono né contribuiscono alla striscia

### 8.7 Bonus Diversificazione (B_DIVERSIFICAZIONE)

Premia chi gioca contro avversari sempre diversi. Per garantire equità anche nelle leghe piccole, l'indice è normalizzato sul numero massimo di avversari disponibili:

INDICE_DIV_NORMALIZZATO = (Avversari unici) / MIN(Totale partite, N-1)

dove N = numero giocatori attivi nella stagione.

SOGLIE:

  INDICE_DIV ≥ 0.8: +15 punti per partita

  INDICE_DIV ≥ 0.6: +8 punti per partita

  INDICE_DIV ≥ 0.4: +3 punti per partita

  INDICE_DIV < 0.4: +0 (nessun bonus)

PRIMA PARTITA contro un nuovo avversario nella stagione: +10 punti fissi

In una lega da 5 giocatori, chi ha sfidato tutti gli avversari possibili ottiene sempre il bonus pieno, indipendentemente da quante partite ha giocato in totale.

### 8.8 Sistema Testa a Testa e Rivincite (B_RIVALSA)

STATO TESTA A TESTA (nell'arco della stagione):

  A ha battuto B l'ultima volta che si sono sfidati:

    → Se B sfida A e vince: B riceve BONUS RIVALSA = +25 punti

    → Se A vince di nuovo:  A riceve BONUS DOMINANZA = +15 punti

LIMITE ANTI-ABUSO (regola fondamentale):

  → Bonus rivalsa/dominanza si applica MAX 1 volta per coppia ogni 21 giorni

  → Dopo 2 partite consecutive tra stessa coppia, i bonus testa a testa

    si azzerano per quella coppia fino a che entrambi non hanno giocato

    contro altri 2 avversari diversi ciascuno.

  → Questo impedisce che due giocatori si "scambino" bonus indefinitamente.

### 8.9 Malus Ripetizione e Limite Dinamico per Coppia

Il limite di partite tra stessa coppia è dinamico in funzione della dimensione della lega, per garantire equità sia nelle leghe piccole che in quelle grandi:

N = numero giocatori attivi nella stagione

LIMITE_PARTITE_COPPIA = ARROTONDA(MAX(2, MIN(5, 10 / √N)))

**Esempi:**

- 4 giocatori → 10/2.0 = 5.0 → 5 partite (massimo consentito)

- 6 giocatori → 10/2.4 = 4.1 → 4 partite

- 8 giocatori → 10/2.8 = 3.5 → 4 partite

- 10 giocatori → 10/3.2 = 3.2 → 3 partite

- 16 giocatori → 10/4.0 = 2.5 → 3 partite

- 25 giocatori → 10/5.0 = 2.0 → 2 partite

- 30+ giocatori → sotto 2.0 → 2 partite (minimo assoluto)

Il range 2-5 garantisce che il limite non sia mai assurdo né troppo restrittivo. L'admin può poi modificarlo manualmente di ±1 rispetto al valore suggerito dal sistema.

Gli Sparring tra la stessa coppia **non rientrano** nel conteggio del limite, in quanto sessioni di allenamento.

**Malus scalato proporzionalmente:**

PARTITA_N_SU_LIMITE = numero partita tra quella coppia / limite massimo coppia

  Prima partita (1/limite):        nessun malus

  Partita intermedia (es. 2/4):    -8 punti

  Penultima partita (es. 3/4):    -18 punti

  Ultima consentita (limite/limite): -30 punti

### 8.10 Decay da Inattività

Attivo di default, disattivabile dall'admin a livello di lega.

SETTIMANE CONSECUTIVE SENZA PARTITE COMPETITIVE:

  2 settimane: nessun decay

  3 settimane: -5 punti fissi dal totale stagione

  4 settimane: -15 punti fissi dal totale stagione

  5+ settimane: -25 punti fissi dal totale stagione (cap)

ECCEZIONI al decay:

  → Giocatore ha dichiarato "pausa programmata" (max 2 volte a stagione)

  → Infortunio dichiarato e accettato dall'admin

  → Mancanza di avversari disponibili (sistema tiene traccia delle sfide inviate)

IMPORTANTE:

  → Lo Sparring NON protegge dal decay

  → L'Allenamento con Maestro NON protegge dal decay

  → Solo le partite competitive validate resettano il contatore

*Questa regola è deliberata per evitare che le modalità non competitive diventino una scorciatoia per aggirare il decay, mantenendo intatto l'incentivo a giocare partite reali.*

### 8.11 Protezione del Punteggio Minimo

- Il punteggio totale stagione non può mai scendere sotto 0.

- Un giocatore che ha giocato almeno 1 partita non può essere superato in classifica da un giocatore che non ha mai giocato.

- Esiste un "floor" per stagione: dopo N partite giocate, si garantisce un minimo di punti per partita (incentivo a partecipare anche se si perde sempre).

### 8.12 Esempio Pratico di Calcolo

**Scenario: **Giocatore A (Silver, livello 3) batte Giocatore B (Gold, livello 4) per 6-4 7-6.

P_BASE (vittoria)                           = 100

× M_LIVELLO (+1 livello)          = × 1.5  → 150

× M_RISULTATO (2-0 sets)          = × 1.2  → 180

+ B_COSTANZA (3 partite nelle ultime 4 sett.) = +10 → 190

+ B_DIVERSIFICAZIONE (INDICE_DIV = 0.75)     = +15 → 205

+ Prima partita vs B nella stagione          = +10 → 215

+ Striscia vittorie (3ª consecutiva vs diversi) = +20 → 235

ΔP per Giocatore A = +235 punti

Giocatore B (sconfitta):

  P_BASE (sconfitta)                  = 30

  × M_LIVELLO (-1 livello perso)  = × 1.1 → 33

  + B_COSTANZA (2 partite)              = +5  → 38

  - MALUS (1ª partita vs A: nessuno)    =     38

ΔP per Giocatore B = +38 punti (ha perso ma guadagna punti partecipazione)

### 8.13 Configurabilità Admin per Stagione

L'admin della lega può, prima dell'inizio stagione, modificare:

| **Parametro** | **Range** | **Default** |
| --- | --- | --- |
| Punti base vittoria | 50 — 200 | 100 |
| Punti base sconfitta | 0 — 50 | 30 |
| Intensità moltiplicatore livello | OFF / Soft / Normal / Hard | Normal |
| Bonus costanza | ON / OFF + peso | ON |
| Bonus diversificazione | ON / OFF + peso | ON |
| Sistema testa a testa | ON / OFF | ON |
| Cooldown rivalsa (giorni) | 7 — 30 | 21 |
| Limite partite per coppia | Calcolato dinamicamente ±1 | Dinamico |
| Decay inattività | ON / OFF + soglia settimane | ON |
| Playoff attivi | ON / OFF | OFF |
| **Sparring** | ON / OFF | ON |
| **Cap Sparring settimanale** | 1 — 2 per giocatore | 2 |
| **Punti Sparring a testa** | 5 — 15 | 12 |
| **Modulo Allenamento con Maestro** | ON / OFF | OFF |
| **XP per allenamento validato** | 10 — 30 | 20 |

## 9. Sparring e Allenamento con Maestro

Questa sezione definisce due modalità non competitive di attività sulla piattaforma, introdotte per arricchire l'esperienza del giocatore senza alterare l'integrità del sistema di ranking stagionale.

> **★ NUOVA FUNZIONALITÀ — Principio fondamentale** *Né lo Sparring né l'Allenamento con Maestro devono poter sostituire l'attività competitiva come fonte primaria di punti stagione. Il loro valore è simbolico/formativo e strettamente disaccoppiato dalla classifica di lega.*

### 9.1 Sparring

Lo Sparring è una sessione di gioco tra due membri della stessa lega, dichiarata consensualmente come "allenamento" e non come partita competitiva. È pensata per tenersi attivi, testare nuovi colpi o semplicemente giocare senza la pressione della classifica.

#### 9.1.1 Flusso di Registrazione

Il flusso ricalca la doppia validazione delle partite competitive:

1. Giocatore A dichiara la sessione come SPARRING

   (checkbox o selettore di tipologia: Partita | Sparring)

2. Sistema notifica Giocatore B

3. B ha 24h per CONFERMARE o CONTESTARE

4. Se confermato:

   → Entrambi ricevono +12 punti fissi stagione

   → Nessun moltiplicatore applicato

   → Nessun bonus (costanza, diversificazione, rivalsa, striscia)

   → Nessun malus ripetizione

5. Se contestato:

   → Apertura disputa gestita come per le partite competitive

   → L'admin può riclassificare la sessione o annullarla

#### 9.1.2 Regole e Vincoli

- **Ricompensa fissa: **+12 punti a testa (configurabile dall'admin nel range 5-15).

- **Cap settimanale: **massimo 1 o 2 Sparring dichiarabili a settimana per giocatore (default 2, configurabile a livello lega). Oltre il cap il sistema rifiuta la registrazione.

- **Esclusione dai bonus: **lo Sparring non attiva e non alimenta alcun bonus (costanza, diversificazione, rivalsa, striscia, moltiplicatore livello, moltiplicatore risultato).

- **Esclusione dai malus: **lo Sparring non genera malus ripetizione.

- **Non conta nel limite partite per coppia: **due giocatori che hanno già raggiunto il limite competitivo possono comunque fare Sparring tra loro.

- **Non protegge dal decay: **le settimane in cui un giocatore fa solo Sparring e nessuna partita competitiva contano come inattive ai fini del decay §8.10.

- **Non contribuisce alla striscia di vittorie: **lo Sparring è neutrale rispetto allo stato testa a testa e alla striscia in corso.

- **Tracciamento statistico: **lo Sparring è tracciato nel profilo lega del giocatore in una sezione dedicata, separata dalle partite competitive.

#### 9.1.3 Monitoraggio Anti-Abuso

Il motore di pattern detection (§7.2.4) monitora l'uso dello Sparring per individuare:

- Coppie che dichiarano Sparring esclusivamente con lo stesso partner in modo ripetitivo (possibile farming).

- Giocatori che raggiungono sistematicamente il cap settimanale senza mai giocare partite competitive.

In entrambi i casi l'admin riceve un alert per revisione manuale.

### 9.2 Allenamento con Maestro

L'Allenamento con Maestro è una sessione formativa individuale tra un giocatore e un utente con ruolo Maestro. Non è una partita, non ha avversario competitivo e non contribuisce alla classifica stagione.

#### 9.2.1 Ruolo Maestro

Il Maestro è un ruolo di lega (§2.1) con le seguenti caratteristiche:

- **Assegnazione: **l'admin di lega invita o promuove un utente al ruolo Maestro; il ruolo è sempre revocabile.

- **Configurazione individuale: **al momento dell'accettazione, l'utente sceglie se essere

- Maestro puro (non partecipa alla competizione stagionale; funge esclusivamente da validatore di allenamenti).

- Giocatore + Maestro (compete normalmente in classifica E valida allenamenti come Maestro per altri giocatori).

- Questa scelta può essere aggiornata dall'utente in qualsiasi momento con una finestra di preavviso di 7 giorni.

- **Visibilità: **un Maestro è evidenziato nell'elenco membri lega con un'icona dedicata.

- **Autonomia: **il Maestro valida i propri allenamenti dal proprio account; non è possibile per un giocatore dichiarare un allenamento senza la conferma esplicita del Maestro.

- **Compensi: **il pagamento del Maestro non è gestito dalla piattaforma in questa fase. L'accordo economico è esterno tra giocatore e Maestro.

#### 9.2.2 Flusso di Registrazione

1. Giocatore dichiara un allenamento svolto con Maestro X

   → Indica data, durata (opzionale), focus tecnico (opzionale)

2. Sistema notifica il Maestro

3. Maestro VALIDA o RIFIUTA la dichiarazione

   → Solo il Maestro può validare (validazione unilaterale, non doppia)

4. Se validato:

   → Il giocatore riceve +20 XP Allenamento (configurabile 10-30)

   → Gli XP si accumulano nel profilo globale

   → Gli XP contribuiscono al livello globale ma NON alla classifica stagione

5. Se rifiutato:

   → La dichiarazione è scartata, nessun XP assegnato

#### 9.2.3 Regole e Vincoli

- **Ricompensa: **+20 XP Allenamento per sessione validata (range configurabile 10-30).

- **Nessun cap: **non esiste un limite numerico di allenamenti con Maestro (la frequenza è autoregolata dal costo reale dell'allenamento esterno alla piattaforma).

- **Validazione obbligatoria del Maestro: **nessun XP senza conferma esplicita. Questo è il principale meccanismo anti-frode.

- **Impatto solo sul livello globale: **gli XP alimentano il rating globale del giocatore (profilo cross-lega, §3.1) ma

- non entrano nella classifica stagione.

- non contribuiscono al rating specifico di lega.

- non proteggono dal decay (§8.10).

- non attivano alcun bonus stagionale.

- **Curva di crescita: **il contributo degli XP al livello globale è progressivamente decrescente (il sistema applica una funzione a rendimenti decrescenti per evitare che un giocatore scali i livelli esclusivamente tramite allenamenti).

- **Tracciamento: **il profilo globale mostra gli XP totali accumulati, il numero di allenamenti validati e i Maestri con cui ha lavorato.

#### 9.2.4 Revoca Validazione

In caso di errore o segnalazione di anomalia, l'admin di lega può revocare una validazione di allenamento. La revoca:

- Rimuove gli XP associati.

- Viene notificata al giocatore e al Maestro.

- In caso di revoche ripetute sullo stesso Maestro, l'admin può revocare il ruolo Maestro.

#### 9.2.5 Badge Correlati

- **Studioso: **10 allenamenti validati in una stagione.

- **Dedicato: **25 allenamenti validati totali nella carriera.

- **Mentor (badge Maestro): **50 allenamenti validati da quel Maestro per altri giocatori.

## 10. Calendario Disponibilità e Frequenza Desiderata

Questa sezione introduce due strumenti di coordinamento che alimentano l'algoritmo di matchmaking (§6.3) e riducono la frizione organizzativa tra giocatori.

### 10.1 Calendario Disponibilità — Modello

Ogni giocatore, a livello di profilo lega, può dichiarare la propria disponibilità a giocare attraverso un calendario strutturato su due assi:

#### 10.1.1 Pattern Ricorrente

Il giocatore definisce un template settimanale di disponibilità (es. "sono disponibile ogni martedì 18-20 e sabato 9-12"). Questo pattern:

- Si rinnova automaticamente ogni settimana.

- Può essere modificato in qualsiasi momento (con effetto dalla settimana successiva).

- Ha granularità minima di 1 ora.

- Supporta slot multipli nella stessa giornata (es. 9-11 e 18-20).

#### 10.1.2 Override su Date Specifiche

Il giocatore può sovrascrivere il pattern ricorrente per date specifiche:

- **Aggiunta di disponibilità straordinaria: **"giovedì 23 aprile sono eccezionalmente disponibile 14-17".

- **Indisponibilità puntuale: **"martedì 29 aprile sono occupato" (cancella lo slot ricorrente).

- **Blocchi estesi: **"dal 1 al 15 agosto sono in ferie" (override multiplo su periodo).

#### 10.1.3 Occupazione Automatica

Gli slot del calendario vengono marcati automaticamente come occupati nei seguenti casi:

- Partita competitiva programmata sulla piattaforma in quello slot.

- Sparring programmato sulla piattaforma in quello slot.

- Allenamento con Maestro programmato in quello slot.

- Impegno personale inserito manualmente dal giocatore come "indisponibile" (es. appuntamento esterno).

L'occupazione automatica impedisce che lo stesso slot venga proposto per nuove sfide, evitando doppie prenotazioni.

#### 10.1.4 Visibilità

- **Agli altri membri della lega: **visibilità piena degli slot di disponibilità (con distinzione libero/occupato). Questo permette coordinamento manuale tra giocatori.

- **A utenti esterni alla lega: **nessuna visibilità.

- **All'admin e moderatore: **visibilità piena come i membri.

### 10.2 Uso del Calendario nel Matchmaking

Il motore Smart Match (§6.3) utilizza il calendario come segue:

**Intersezione slot:**

Per ogni coppia candidata (giocatore richiedente + avversario suggerito), il sistema calcola gli slot in cui entrambi sono disponibili nei prossimi 14 giorni. Gli avversari con zero slot compatibili vengono filtrati o presentati con priorità ridotta.

**Matching asimmetrico:**

Un giocatore che non ha dichiarato alcuna disponibilità è trattato come "proponibile con priorità ridotta". Il sistema non esclude questi utenti dal matching (per non penalizzare chi non usa il calendario) ma li posiziona dopo gli avversari con slot espliciti compatibili.

**Proposta di slot in sfida:**

Quando un giocatore invia una sfida tramite Smart Match, il sistema propone automaticamente 2-3 slot di intersezione come opzioni preferite nel messaggio di sfida.

### 10.3 Frequenza Desiderata

La frequenza desiderata è la soglia di disponibilità che un giocatore dichiara come proprio ritmo di gioco ideale settimanale.

#### 10.3.1 Modello

Il giocatore, a livello di profilo lega, dichiara:

- **Frequenza ideale: **numero di partite competitive desiderate a settimana (es. 1, 2, 3, 4+).

- **Frequenza massima: **numero di partite oltre il quale il giocatore preferisce non essere proposto (es. 3).

- **Unità temporale: **settimanale (default) o mensile (opzionale per chi gioca meno frequentemente).

La dichiarazione è modificabile in qualsiasi momento e si applica alla settimana corrente dal momento del cambio.

#### 10.3.2 Logica di Matching

L'algoritmo di Smart Match (§6.3) utilizza la frequenza come segue:

- Per ogni potenziale avversario calcola: partite già giocate nella settimana corrente vs frequenza massima dichiarata.

- Gli avversari che hanno già raggiunto la propria frequenza massima sono filtrati o presentati con priorità molto bassa.

- Gli avversari sotto la frequenza ideale hanno priorità maggiore (hanno maggiore probabilità di accettare).

- Gli avversari nella fascia intermedia (tra ideale e massima) hanno priorità standard.

#### 10.3.3 Visibilità

La frequenza desiderata è visibile agli altri membri della lega tramite un indicatore sintetico tipo semaforo:

- **Verde: **il giocatore è sotto la frequenza ideale → disponibile a ricevere sfide.

- **Giallo: **il giocatore ha raggiunto la frequenza ideale ma è sotto la massima → può accettare, ma con meno probabilità.

- **Rosso: **il giocatore ha saturato la frequenza massima per il periodo corrente → sfide probabilmente declinate.

L'indicatore numerico (es. "2/3 settimana") è visibile al giocatore nel proprio profilo ma mostrato in forma sintetica (solo semaforo) agli altri.

#### 10.3.4 Interazione Frequenza-Calendario

Frequenza e calendario sono complementari:

- Il calendario risponde a "QUANDO posso giocare".

- La frequenza risponde a "QUANTO voglio giocare".

Un giocatore che ha disponibilità 7 giorni su 7 ma frequenza massima 2 sarà matchato solo fino a 2 sfide a settimana, anche se gli slot lo permetterebbero. Viceversa, un giocatore con frequenza alta ma pochi slot disponibili verrà matchato meno spesso per mancanza di finestre temporali.

## 11. Anagrafica Campi di Lega

L'anagrafica campi è una base dati strutturata dei luoghi di gioco associati a una specifica lega. Completa il flusso di organizzazione partita (§6.2) rendendo esplicito e tracciabile il campo di gioco.

### 11.1 Scope e Proprietà

- **Scope per lega: **ogni lega ha la propria anagrafica campi, indipendente dalle altre. Non esiste un'anagrafica globale condivisa. Questa scelta mantiene la gestione semplice e riflette il fatto che ogni lega tende a ruotare su un insieme ristretto di club.

- **Proprietà: **l'anagrafica è proprietà dell'admin di lega, che ne detiene piena responsabilità di curatela.

- **Persistenza: **l'anagrafica persiste attraverso le stagioni della stessa lega.

### 11.2 Flusso di Popolamento

L'anagrafica si popola attraverso tre canali:

**Inserimento admin:**

L'admin di lega inserisce direttamente i campi. I campi inseriti dall'admin sono pubblicati immediatamente.

**Proposta giocatore:**

Qualsiasi giocatore membro può proporre l'aggiunta di un campo compilandone i dati. La proposta entra in stato "In attesa di validazione" e richiede approvazione dell'admin prima di essere pubblicata. L'admin può approvare, modificare o rifiutare la proposta.

**Importazione (futura):**

Possibile integrazione futura con servizi di prenotazione esterni (es. Playtomic) per import automatico di campi nell'area geografica della lega.

### 11.3 Schema Dati del Campo

Ogni record di anagrafica contiene i seguenti attributi:

| **Attributo** | **Obbligatorio** | **Descrizione** |
| --- | --- | --- |
| **Nome** | Sì | Nome del campo o del circolo (es. "TC Bologna — Campo 3"). |
| **Indirizzo** | Sì | Indirizzo completo con città; alla geocodifica si ottengono le coordinate per calcolo distanza nel matching. |
| **Coordinate (lat/lng)** | Auto | Calcolate automaticamente dalla geocodifica dell'indirizzo; editabili manualmente. |
| **Superficie** | No | Terra rossa / Cemento / Erba / Sintetico / Altro. |
| **Copertura** | No | Coperto / Scoperto / Misto. |
| **Numero campi** | No | Numero campi disponibili nel circolo (utile per leghe numerose). |
| **Link prenotazione** | No | URL al sistema di prenotazione esterno (Playtomic, sito del circolo, etc.). Aperto in nuova scheda. |
| **Telefono** | No | Contatto del circolo per prenotazioni telefoniche. |
| **Prezzo indicativo** | No | Fascia di prezzo oraria (es. 15-25 €/h). Informativo, non usato per matching. |
| **Note** | No | Campo libero per dettagli: parcheggio, spogliatoi, orari, etc. |
| **Stato** | Auto | Attivo / In attesa di validazione / Archiviato. |

### 11.4 Integrazione con il Flusso Partita

L'anagrafica campi si integra nel flusso di accordo partita (§6.2 step 2) in questo modo:

- Nel momento in cui due giocatori concordano una partita, l'interfaccia presenta un selettore con tutti i campi attivi dell'anagrafica di lega.

- Il selettore suggerisce in cima il campo preferito di almeno uno dei due giocatori (§3.2) e quelli più vicini se la geolocalizzazione è abilitata.

- Selezionato il campo, il sistema mostra un bottone "Prenota su [link]" che apre in nuova scheda il sito di prenotazione esterno associato.

- Il campo selezionato viene memorizzato come attributo della partita e compare nel dettaglio e nelle notifiche di reminder.

- In caso di cambio campo dell'ultimo momento, entrambi i giocatori possono modificarlo prima della registrazione risultato; il cambio è tracciato nello storico della partita.

### 11.5 Campo Preferito del Giocatore

Il "campo preferito" definito nel profilo lega del giocatore (§3.2) non è più testo libero ma un link strutturato all'anagrafica:

- Il giocatore sceglie un campo tra quelli attivi dell'anagrafica di lega.

- Può selezionare fino a 3 campi preferiti con ordine di preferenza.

- Il campo preferito contribuisce al matching geografico (§6.3) e alla prioritizzazione nel selettore campo in fase di accordo partita.

### 11.6 Gestione e Curatela

- **Modifica: **solo admin (e moderatore se delegato) può modificare un campo dell'anagrafica.

- **Archiviazione: **l'admin può archiviare un campo (es. club chiuso) senza cancellarlo; i campi archiviati restano nello storico delle partite passate ma non sono selezionabili per nuove partite.

- **Segnalazione errori: **i giocatori possono segnalare errori su un campo (dati errati, chiusura, etc.); la segnalazione genera una notifica all'admin.

## 12. Classifiche
### 12.1 Tipologie di Classifica

- **Classifica Stagione Corrente: **Punti accumulati nella stagione attiva, aggiornata in tempo reale dopo ogni partita validata. Include i punti Sparring (nel limite del cap) ma non gli XP Allenamento.

- **Classifica Storica Lega: **Somma pesata delle performance in tutte le stagioni della lega (le stagioni più recenti pesano di più).

- **Classifica Globale Piattaforma: **Ranking globale tra tutti i giocatori della piattaforma, basato sul rating ELO globale (include contributo XP Allenamento con Maestro).

- **Classifiche Statistiche Secondarie (visibili nel dettaglio lega):**

- Top vincitori (più partite vinte).

- Top attivi (più partite giocate).

- Miglior striscia di vittorie.

- Miglior diversificatore (più avversari unici).

- Più costante (miglior indice di regolarità).

- Re delle rivincite (più bonus rivalsa).

- Più studioso (classifica XP Allenamento di stagione, §9.2).

- Più sportivo in Sparring (numero di Sparring dichiarati, §9.1).

### 12.2 Visualizzazione Classifica

- Posizione attuale e variazione rispetto alla settimana precedente (freccia su/giù).

- Punti totali e dettaglio dei punti per componente (trasparenza algoritmo).

- Numero partite giocate / da giocare consigliato.

- Indicatore "caldo" (ha giocato di recente) o "freddo" (inattivo).

- Indicatore semaforico di frequenza desiderata (§10.3).

## 13. Notifiche e Comunicazioni
### 13.1 Notifiche in-App e Push

| **Evento** | **Destinatario** |
| --- | --- |
| Ricevuta sfida | Giocatore sfidato |
| Sfida accettata/rifiutata | Giocatore sfidante |
| Partita confermata (data/ora/campo) | Entrambi |
| Reminder partita (24h prima, 2h prima) | Entrambi |
| Risultato inserito, attesa conferma | Avversario |
| Risultato confermato, punti assegnati | Entrambi |
| Contestazione aperta | Admin + Entrambi |
| Cambio posizione in classifica | Giocatore |
| Nuova striscia di vittorie | Giocatore |
| Stagione in scadenza (2 settimane) | Tutti i membri lega |
| Nuova stagione aperta | Tutti i membri lega |
| Badge conquistato | Giocatore |
| Sparring da confermare | Avversario di Sparring |
| Allenamento da validare | Maestro |
| Allenamento validato (XP accreditati) | Giocatore |
| Nuovo campo proposto (richiede validazione) | Admin |
| Avversario disponibile negli slot compatibili | Giocatore (opzionale) |
| Cap Sparring settimanale raggiunto | Giocatore |

### 13.2 Bacheca Lega

Ogni lega ha una bacheca/feed interno con:

- Risultati delle partite recenti.

- Annunci dell'admin.

- Cambio di leadership in classifica.

- Achievement e badge conquistati.

- Commenti e reazioni (stile social leggero).

- Sparring dichiarati recentemente (sezione separata, meno prominente).

- Nuovi campi aggiunti all'anagrafica.

## 14. Funzionalità Aggiuntive Proposte
### 14.1 Sistema Badge e Achievement

Gamification per incentivare comportamenti virtuosi:

| **Badge** | **Condizione** |
| --- | --- |
| **Prima Vittoria** | Prima partita vinta nella lega |
| **In Fiamme** | 5 vittorie consecutive vs avversari diversi |
| **Ammazzagiganti** | Vittoria contro giocatore 2+ livelli superiore |
| **Muro** | Sconfitta col massimo dei set giocati per 5 volte |
| **Esploratore** | Giocato contro tutti i membri della lega almeno 1 volta |
| **Equilibrista** | Win rate tra 45-55% per un'intera stagione |
| **Campione** | Vince la classifica stagione |
| **Vendicatore** | Ottiene 3 rivincite nella stessa stagione |
| **Iron Man** | Gioca almeno 1 partita ogni settimana per tutta la stagione |
| **Sportivo** | Zero contestazioni e zero dispute in stagione |
| **Studioso** | 10 allenamenti con Maestro validati in una stagione |
| **Dedicato** | 25 allenamenti con Maestro validati totali (carriera) |
| **Mentor** | Badge Maestro: 50 allenamenti validati per altri giocatori |
| **Compagno di Banco** | 10 sessioni di Sparring validate in una stagione |

### 14.2 Statistiche Avanzate per Giocatore

- Grafico andamento rating nel tempo (separando contributo partite competitive e XP Allenamento).

- Heatmap attività (stile GitHub contributions), con distinzione visuale per tipologia (partita/Sparring/Allenamento).

- Performance per fascia oraria / giorno della settimana (derivata dal calendario).

- Performance per campo/luogo (dall'anagrafica campi).

- Analisi set: quante volte vince/perde il primo set, rimonte, etc.

- Head-to-head dettagliato vs ogni avversario.

- Rapporto tra partite competitive e Sparring nel tempo.

### 14.3 Modalità Torneo Interno alla Lega

L'admin può creare tornei spot all'interno della lega:

- Round robin.

- Eliminazione diretta.

- Doppio girone (andata e ritorno).

- I risultati del torneo contribuiscono (con peso configurabile) alla classifica stagione.

### 14.4 Modulo Doppio / Padel

Per le leghe che supportano il doppio (tennis o Padel):

- Coppie fisse o coppie variabili (ogni partita si può cambiare partner).

- Classifica doppio separata.

- I punti doppio contribuiscono (con peso configurabile) alla classifica generale o restano separati.

- Rating coppia specifico.

- Il sistema di punteggio si applica a livello di coppia (rating coppia) e individuale (contributo personale).

- La validazione del risultato richiede conferma da almeno un giocatore per squadra.

- Il matchmaking suggerisce coppie di livello equivalente.

- I livelli individuali contribuiscono al rating coppia con una media pesata (es. 60% livello più alto + 40% livello più basso).

- Il limite partite per coppia di giocatori va calcolato a livello di combinazione di 4, non di 2.

- Lo Sparring è disponibile anche in modalità doppio (4 giocatori, +12 punti a testa).

### 14.5 Dashboard Admin

Pannello di controllo completo per l'admin della lega:

- Overview stagione in corso: partite giocate, in attesa, pianificate.

- Alert anomalie (possibili frodi, dispute aperte, giocatori inattivi).

- Gestione manuale dei risultati in caso di dispute.

- Statistiche di salute della lega (engagement rate, partite per settimana).

- Esportazione dati (CSV, PDF per report stagione).

- Gestione Maestri di lega (invito, revoca, revisione validazioni).

- Gestione anagrafica campi (creazione, modifica, archiviazione, approvazione proposte).

- Monitoraggio uso Sparring (per identificare pattern anomali).

### 14.6 Integrazione Esterna (Futura)

- Import ranking FIT ufficiale.

- Connessione con app di prenotazione campi (es. Playtomic) per sync anagrafica e prenotazioni.

- Sincronizzazione calendario disponibilità con Google Calendar / Outlook.

- Condivisione risultati su social media (card automatica).

- Export statistiche personali (PDF "La mia stagione").

### 14.7 App Mobile (Fase Successiva)

- Interfaccia mobile-first per registrazione rapida risultati.

- Widget home screen con classifica e prossime partite.

- Notifiche push.

- Gestione veloce calendario e frequenza desiderata.

L'app mobile è posticipata: prima va consolidata la web app, successivamente si realizza la versione mobile nativa.

## 15. Considerazioni Tecniche di Alto Livello

Le specifiche tecniche dettagliate sono oggetto del Documento 2 (Specifiche di Sviluppo). In questa sede si sintetizzano solo le scelte strategiche che hanno impatto funzionale.

### 15.1 Supporto Linguistico

- MVP rilasciato in Inglese e Italiano.

- Tutte le stringhe UI sono esternalizzate in file di traduzione fin dall'inizio.

- Architettura predisposta per aggiunta futura di altre lingue senza refactoring.

### 15.2 Identità Visiva

Il design system prende ispirazione dallo stile Apple iOS: tipografia SF-like, palette neutra con accento blu, componenti con angoli morbidi, leggera trasparenza e ombre delicate. I principi guida sono: Clarity, Deference, Depth.

### 15.3 Modello di Monetizzazione

Il business model previsto è un mix di tre leve:

**Freemium per utente:**

- Tier FREE: max 1 lega creata, max 3 leghe joinate, statistiche base, banner advertising.

- Tier PREMIUM (~€4,99/mese): leghe illimitate (creazione e partecipazione), statistiche avanzate, export PDF, niente pubblicità, priorità nel matchmaking, calendario con sync esterno.

**Leghe Premium:**

- Tier FREE: funzionalità base, max 12 membri.

- Tier PREMIUM (~€9,99/mese per lega): playoff, sistema punteggio completamente personalizzabile, geo-verifica, anti-frode avanzato, export dati, membri illimitati, modulo Maestro attivabile, anagrafica campi con integrazioni esterne.

**Advertising:**

- Banner non intrusivi mostrati agli utenti FREE.

- Mai durante flussi critici (inserimento risultato, disputa, validazione, validazione allenamento).

- Posizioni consentite: sidebar dashboard (desktop), card interstitial nella lista partite (mobile, 1 ogni 5 elementi), banner sotto la top 3 della classifica.

### 15.4 Vincoli di Costo Infrastrutturale

Fino all'attivazione della monetizzazione, i costi infrastrutturali devono essere contenuti. La scelta tecnologica è orientata su servizi con free tier generoso e scalabilità a pagamento solo quando il progetto cresce.

## 16. Roadmap di Sviluppo
### 16.1 MVP (Versione 1.0) — 3-4 mesi

- Registrazione utenti e profilo base.

- Creazione lega e inviti.

- Gestione stagione base (senza playoff).

- Registrazione partite con doppia validazione.

- Sistema punteggi core (senza tutti i bonus).

- Classifica stagione.

- Supporto singolo; architettura predisposta per il doppio.

- Calendario disponibilità base (pattern ricorrente).

- Anagrafica campi base (solo admin inserisce).

### 16.2 Versione 1.5 — +2 mesi

- Sistema bonus completo (costanza, diversificazione, testa a testa).

- Anti-frode avanzato (geo-check, pattern detection).

- Badge e achievement.

- Dashboard admin completa.

- Notifiche push.

- Modulo doppio/Padel attivo.

- Sparring (dichiarazione, validazione, cap).

- Calendario disponibilità completo (override, occupazione automatica).

- Frequenza desiderata con indicatore semaforico.

- Anagrafica campi completa (proposte giocatori, integrazione flusso partita).

### 16.3 Versione 2.0 — +3 mesi

- Playoff.

- Statistiche avanzate.

- Modalità torneo.

- App mobile nativa.

- Modulo Allenamento con Maestro (ruolo, validazione, XP).

### 16.4 Versione 3.0 — +4 mesi

- Classifiche globali piattaforma.

- Integrazioni esterne (FIT, Playtomic, Google Calendar).

- Funzionalità social (commenti, reazioni).

- Monetizzazione completa (leghe premium).

## 17. Decisioni Chiave Consolidate

Le seguenti decisioni sono state validate durante la fase di analisi e costituiscono i vincoli di progetto:

| **Tema** | **Decisione** |
| --- | --- |
| **Numero di livelli** | 7 (Rookie → Elite) |
| **Punti base vittoria/sconfitta** | 100 / 30 (default) |
| **Limite partite per coppia** | Dinamico (formula su √N), range 2-5 |
| **Decay inattività** | Attivo di default, disattivabile per lega; non protetto da Sparring/Allenamento |
| **Playoff** | Non prioritari, rinviati a v2.0 |
| **Modulo Doppio/Padel** | Prioritario, previsto in v1.5 come modulo attivabile |
| **App Mobile** | Dopo il consolidamento della web app |
| **Costi infrastruttura** | Contenuti fino a monetizzazione attiva |
| **Lingue MVP** | Inglese + Italiano, con predisposizione multilingua |
| **Monetizzazione** | Mix: freemium utente + leghe premium + advertising |
| **Identità visiva** | Stile ispirato Apple iOS (pulito, moderno, chiaro) |
| **Sparring** | Sessione allenamento consensuale; +12 punti fissi a testa; cap 1-2/settimana (default 2); doppia validazione; esclusa da bonus/malus/decay/limite coppia |
| **Allenamento con Maestro** | Ruolo Maestro dedicato (puro o giocatore+maestro); +20 XP per sessione validata; XP alimentano solo livello globale, non classifica stagione; nessun cap; validazione unilaterale del Maestro |
| **Calendario Disponibilità** | Pattern ricorrente + override su date; granularità 1h; visibile ai membri di lega; matching asimmetrico (chi non dichiara è proponibile con priorità ridotta) |
| **Frequenza Desiderata** | Soglia partite settimanali/mensili; indicatore semaforico pubblico; utilizzata dallo Smart Match per prioritizzare avversari realmente disponibili |
| **Anagrafica Campi** | Scope per lega (non globale); inserimento admin + proposte giocatori con validazione admin; integrazione nel flusso accordo partita con link prenotazione esterno |

*Le righe evidenziate sono le decisioni introdotte nella revisione 2.0.*

*Fine del Documento 1 — Analisi Funzionale. Per le specifiche tecniche di sviluppo si rimanda al Documento 2.*
