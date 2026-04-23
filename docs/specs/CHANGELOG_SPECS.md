# CHANGELOG_SPECS.md — Storico revisioni delle specifiche

> Questo file tiene traccia delle modifiche apportate ai documenti di specifica.
> Quando modifichi `01_analisi_funzionale.md` o `02_specifiche_sviluppo.md`:
>
> 1. Sposta la versione precedente in `archive/` con suffisso di versione.
> 2. Aggiungi qui una voce in cima (ordine cronologico inverso) con il diff concettuale.
> 3. Nella chat con Claude Code basterà dire: *"Applica le modifiche della vX.Y"* e
>    Claude leggerà solo il changelog, non l'intero documento. Risparmio di token garantito.
>
> Formato consigliato: [Keep a Changelog](https://keepachangelog.com/) adattato.

---

## [2.0] — 2026-04 (baseline iniziale del repository)

Versione di partenza del progetto importata dai documenti Word forniti dai committenti.
Non c'è un "diff" rispetto a una versione precedente perché è il primo import nel repo;
le note di revisione sotto descrivono **cosa la v2.0 aggiunge rispetto a una virtuale v1.0**
(utile per contesto storico).

### Analisi Funzionale

**Aggiunto**
- §2 Ruolo `Maestro` (puro o ibrido con Giocatore) nella tabella permessi.
- §8.13 Parametri stagione configurabili: cap Sparring, punti Sparring, modulo Maestro, XP per lezione.
- §9 Sezione completa "Sparring e Allenamento con Maestro" con regole, cap, validazione, anti-abuso.
- §10 Sezione completa "Calendario Disponibilità e Frequenza Desiderata".
- §11 Sezione completa "Anagrafica Campi di Lega".
- §12.1 Classifiche secondarie: "Più studioso" e "Più sportivo in Sparring".
- §13.1 Nuovi tipi di notifica (Sparring, Master Lesson, proposta campo, cap raggiunto, slot compatibili).
- §14.1 Nuovi badge: Studioso, Dedicato, Mentor, Compagno di Banco.
- §17 Righe evidenziate per le decisioni introdotte in v2.0.

**Modificato**
- §3.2 "Campo preferito" del profilo lega non è più testo libero ma link strutturato all'anagrafica Venue.
- §6.2 Flusso partita: step 2 ora usa selettore dall'anagrafica campi + link prenotazione esterno.
- §6.3 Smart Matchmaking: aggiunti criteri "Compatibilità oraria" e "Frequenza desiderata"; "Matching asimmetrico" per chi non dichiara disponibilità.
- §7.2.4 Pattern detection esteso per monitorare abusi di Sparring.
- §8.6 Bonus Costanza: Sparring **non** alimenta la costanza.
- §8.9 Cap partite per coppia: Sparring **non** rientra nel conteggio.
- §8.10 Decay inattività: Sparring e Master Lesson **non** proteggono dal decay.

### Specifiche di Sviluppo

**Aggiunto**
- §3.2 Nuovi modelli Prisma: `TrainingSession`, `MasterProfile`, `AvailabilityPattern`, `AvailabilityOverride`, `PlayerFrequencyPreference`, `Venue`, `VenueProposal`, `PlayerFavoriteVenue`.
- §3.2 Nuovi enum: `MasterMode`, `TrainingSessionType`, `TrainingSessionStatus`, `VenueStatus`, `VenueSurface`, `VenueCover`, `FrequencyUnit`, `AvailabilityOverrideType`.
- §3.2 Estensione enum esistenti: `MemberRole.MASTER`, nuovi `NotificationType`.
- §5 Intera sezione "Training Sessions Engine" (package `training-engine`).
- §6 Intera sezione "Matchmaking Engine" (package `matchmaking-engine`).
- §7.3 Endpoint API per training, availability, frequency, venues, masters, matchmaking.
- §8.2 Nuove pagine frontend: calendario, frequenza, anagrafica campi, sparring, master lesson, smart match panel.
- §9 Nuove chiavi i18n per i moduli aggiunti.
- §10 Nuovi feature flag (sparring free, master module premium, venues advanced premium).
- §11 Nuovi token colore (frequenza semaforo, training session, venue status) e componenti (`FrequencyBadge`, `AvailabilityGrid`, `VenueCard`, `VenueMapPin`, `TrainingSessionBadge`, `CandidateScoreRow`).
- §12 Sprint 5 e Sprint 6 aggiunti alla roadmap (totale sprint: 7 anziché 6).

**Modificato**
- §3.2 Modello `User`: aggiunto `globalExperiencePoints`.
- §3.2 Modello `LeagueMember`: aggiunti `masterMode`, `masterBio`, `isAlsoPlayer`, `homeVenueId`.
- §3.2 Modello `LeagueSettings`: aggiunti flag `sparringEnabled`, `masterLessonsEnabled`, `venuesEnabled`, `availabilityEnabled`, `frequencyPreferenceEnabled` e relativi parametri.
- §3.2 Modello `Match`: `venue` è ora FK a `Venue` (precedente: stringa libera). Mantenuto `venueTextFallback` per import legacy.
- §4 Scoring Engine: nota esplicita che `consistency.ts` e `decay.ts` **non** devono considerare `TrainingSession`.
- §13 Tabella decisioni architetturali estesa con le scelte v2.0 (training/matchmaking engine separati, Venue scoped per lega, Mapbox per geocoding).

### Vincolo chiave introdotto in v2.0

Il rispetto dell'**isolamento del contributo non-competitivo** è un invariante del
progetto: il processor delle Training Session non può modificare contatori usati
dal calculator competitivo (`matchesLast4Weeks`, `winStreak`, `HeadToHead`, `ScoreDelta`,
`pairCount`). Si veda `docs/decisions/0003-engine-separati.md`.

---

## Template per revisioni future

Quando esce la prossima revisione (es. 2.1, 2.2, 3.0), aggiungi una voce come questa in cima:

```markdown
## [X.Y] — YYYY-MM-DD

### Analisi Funzionale

**Aggiunto**
- §X.Y Breve descrizione.

**Modificato**
- §X.Y Cosa è cambiato e perché.

**Rimosso**
- §X.Y Cosa è stato tolto.

### Specifiche di Sviluppo

**Aggiunto**
- §X.Y …

**Modificato**
- §X.Y …

### Impatto sullo sviluppo

- Moduli da adeguare: …
- Migration Prisma richiesta: sì/no, motivo.
- Test da aggiornare: …
```
