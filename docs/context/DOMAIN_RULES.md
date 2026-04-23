# DOMAIN_RULES.md — Regole di business in forma sintetica

> Una regola per riga, senza fronzoli. Fonte: `docs/specs/01_analisi_funzionale.md`.
> Quando scrivi codice, controlla che queste regole siano rispettate.
> Se trovi una regola qui che contraddice una spec, **non decidere da solo**: segnalalo.

---

## Isolamento del contributo non-competitivo (CRITICO)

- Sparring e Master Lesson **non** alimentano `matchesLast4Weeks`.
- Sparring e Master Lesson **non** aggiornano `winStreak` né lo interrompono.
- Sparring e Master Lesson **non** aggiornano `HeadToHead`.
- Sparring e Master Lesson **non** creano `ScoreDelta` nel Scoring Engine.
- Sparring **non** incrementa il `pairCount` (contatore partite per coppia).
- Sparring e Master Lesson **non** proteggono dal decay inattività.
- Solo le partite competitive **validate** resettano il contatore di inattività.

## Sparring

- Punti fissi: +12 a testa (configurabile 5-15).
- Nessun moltiplicatore applicato.
- Cap settimanale: 1 o 2 per giocatore (default 2). Oltre cap → il sistema rifiuta.
- Validazione tramite doppia conferma (come le partite competitive).
- In caso di contestazione, admin può riclassificare o annullare.
- Sparring tra coppia che ha già saturato il limite competitivo: sempre permesso.
- Tracciato in sezione dedicata del profilo lega, separato dalle partite.

## Master Lesson

- XP fissi: +20 per sessione validata (configurabile 10-30).
- Validazione **unilaterale** del Maestro (il giocatore dichiara, il maestro conferma).
- Senza validazione del maestro → nessun XP.
- XP alimentano **solo** il rating globale, mai la classifica stagione.
- XP → rating globale con curva a rendimenti decrescenti (vedi `xpCurve.ts`).
- Nessun cap di sessioni.
- Admin può revocare una validazione in caso di errore; la revoca rimuove gli XP.

## Ruolo Maestro

- Assegnabile solo dall'admin di lega.
- Sempre revocabile.
- Modalità: `PURE` (solo valida) o `HYBRID` (gioca + valida).
- Il cambio modalità richiede 7 giorni di preavviso.
- Il compenso del maestro **non** è gestito dalla piattaforma (accordo esterno).

## Punteggi partita competitiva

- `ΔP = P_BASE × M_LIVELLO × M_RISULTATO + B_COSTANZA + B_DIVERSIFICAZIONE + B_RIVALSA − MALUS_RIPETIZIONE − DECAY`.
- Punti base vittoria: 100 (range configurabile 50-200).
- Punti base sconfitta: 30 (range configurabile 0-50).
- `ΔP` totale **non può mai essere negativo**: clamp a 0.
- Il punteggio totale stagione **non può mai scendere sotto 0**.
- Un giocatore con 0 partite giocate **non può superare** in classifica chi ha giocato almeno 1.

## Bonus Costanza

- Conta **solo** partite competitive nelle ultime 4 settimane solari del giocatore.
- 4+ partite → +20 pt per partita; 3 → +10; 2 → +5; 1 → 0; 0 → attiva decay.
- Striscia vittorie: vale solo con **avversari diversi**. Si azzera alla prima sconfitta.

## Bonus Diversificazione

- Indice normalizzato: `INDICE_DIV = (avversari_unici) / MIN(totale_partite, N-1)` dove N = giocatori attivi.
- Soglie: ≥0.8 → +15/partita; ≥0.6 → +8; ≥0.4 → +3; <0.4 → 0.
- Prima partita vs nuovo avversario in stagione: +10 fissi.

## Testa a Testa (B_RIVALSA / B_DOMINANZA)

- Bonus rivalsa: +25 a chi ribalta l'esito dell'ultima sfida con lo stesso avversario.
- Bonus dominanza: +15 a chi ribadisce la vittoria.
- **Max 1 applicazione per coppia ogni 21 giorni** (configurabile 7-30).
- Dopo 2 partite consecutive tra stessa coppia, bonus azzerati fino a che entrambi non hanno giocato contro altri 2 avversari diversi.

## Limite partite per coppia (stagione)

- Calcolo dinamico: `ARROTONDA(MAX(2, MIN(5, 10 / √N)))`.
- Admin può variare ±1 rispetto al valore suggerito.
- Malus ripetizione scalato proporzionalmente alla posizione verso il limite.

## Decay inattività

- Default ON. Disattivabile per lega.
- Soglie: 2 settimane → 0; 3 → −5; 4 → −15; 5+ → −25 (cap).
- Eccezioni: pausa programmata (max 2/stagione), infortunio accettato, mancanza avversari disponibili.

## Matchmaking

- Limite sfide pendenti: max 3 per giocatore.
- Cooldown rivincita: configurabile (default 7 giorni, o fino a N avversari diversi).
- Smart Match priorità: livello ±1, diversificazione alta, disponibilità overlap, frequenza sotto soglia, prossimità geografica.
- Matching asimmetrico: chi non dichiara disponibilità è **proponibile con priorità ridotta**, non escluso.

## Registrazione risultati

- Finestra temporale configurabile per registrare (default 12h dall'orario concordato).
- Auto-conferma dopo 24h se l'avversario non risponde (disattivabile).
- Punteggi impossibili secondo regole tennis → rifiutati.
- Punteggi statisticamente anomali → flag di revisione.

## Calendario disponibilità

- Granularità minima applicativa: 60 minuti.
- Pattern ricorrente + override su date specifiche.
- Override tipo `AVAILABLE` (aggiunge) o `UNAVAILABLE` (cancella slot ricorrente).
- Occupazione automatica su slot per match/sparring/lesson programmati.
- Visibile a tutti i membri della stessa lega; non visibile fuori.

## Frequenza desiderata

- Due valori: `idealFrequency` e `maxFrequency`.
- Unità: `WEEKLY` (default) o `MONTHLY`.
- Visibile come semaforo (verde/giallo/rosso), numerico solo al proprietario.

## Anagrafica campi (Venue)

- Scope **per lega**: un `Venue` appartiene sempre a una `League`. Nessuna anagrafica globale.
- Campi inseriti dall'admin → pubblicati subito.
- Proposte da giocatore → stato `PENDING_VALIDATION` finché admin non approva.
- Admin può archiviare un venue ma non eliminarlo: lo storico delle partite passate resta consistente.
- Giocatore può selezionare fino a 3 campi preferiti con ordine.

## Autorizzazioni (riassunto)

- Super Admin: piattaforma.
- Admin Lega: tutto nella propria lega.
- Moderatore: invita, convalida, inserisce/contesta risultati.
- Maestro: valida le proprie lezioni; niente altro.
- Giocatore: inserisce/contesta i propri risultati, propone venue.
- Guest: partecipa a una singola stagione senza iscrizione permanente.

## Privacy e sicurezza

- Nessun dato finanziario sensibile in URL o log.
- La reputazione è visibile solo all'admin, mai ad altri giocatori.
- Le facial images non vengono raccolte né analizzate.
- Nessuna creazione automatica di account di terzi.
