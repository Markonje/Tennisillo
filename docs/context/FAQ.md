# FAQ.md — Decisioni ricorrenti già prese

> Raccolta di domande che tornano spesso durante lo sviluppo, con la risposta già data.
> Se la stessa domanda viene posta più di due volte → aggiungi una voce qui.
> Se non c'è risposta qui e non è nelle specs, **chiedi all'utente**: non decidere da solo.

---

### Q: Lo Sparring conta per la classifica stagione?

**Sì, con riserva.** Dà +12 punti fissi a testa che sommano al punteggio stagione,
ma **non** alimenta bonus (costanza, diversificazione, testa-a-testa, striscia),
non applica moltiplicatori, non conta nel limite partite per coppia e non protegge
dal decay. Serve per tenere attivi gli utenti e premiare simbolicamente l'allenamento
tra membri, senza diventare una scorciatoia per fare punti senza competere.

---

### Q: Le Master Lesson danno punti stagione?

**No.** Danno solo XP Allenamento, che vanno esclusivamente al rating **globale**
(cross-lega), con curva a rendimenti decrescenti. Non toccano in alcun modo la
classifica di stagione.

---

### Q: Chi valida una Master Lesson?

**Solo il Maestro**, in modo unilaterale. Il giocatore dichiara l'avvenuta lezione,
il maestro conferma o rifiuta. È il principale meccanismo anti-frode: senza maestro
che convalida, nessun XP.

---

### Q: Un giocatore può essere anche Maestro?

**Sì**, se sceglie la modalità `HYBRID` al momento dell'accettazione del ruolo.
In `HYBRID` compete normalmente in classifica e contemporaneamente valida Master Lesson
per altri giocatori. La modalità `PURE` è l'alternativa: solo valida, non compete.
Il cambio di modalità richiede 7 giorni di preavviso.

---

### Q: L'anagrafica campi è globale o per lega?

**Per lega.** Ogni lega ha la propria anagrafica di venue, non condivisa.
Questo riflette il fatto che una lega tende a ruotare su un insieme ristretto di club.
Se in futuro servirà un'anagrafica globale (es. per import Playtomic), si farà come
lookup esterno, non come modifica dello scope di `Venue`.

---

### Q: Come funziona il limite partite per coppia?

Formula dinamica: `ARROTONDA(MAX(2, MIN(5, 10 / √N)))` dove N è il numero di giocatori
attivi. Il range è 2-5. L'admin può variare di ±1 rispetto al valore suggerito.
Gli Sparring **non** rientrano nel conteggio.

---

### Q: Cosa succede se un avversario non risponde alla richiesta di validazione?

**Auto-conferma dopo 24h** (valore default, configurabile per lega; può essere
anche disattivato, nel qual caso la partita resta in `PENDING_VALIDATION` finché
non arriva risposta esplicita o interviene l'admin).

---

### Q: Si possono modificare i punteggi dopo la validazione?

**Solo tramite disputa** e decisione dell'admin. La decisione dell'admin è
definitiva e inappellabile nella stagione corrente.

---

### Q: Il giocatore che non dichiara disponibilità viene escluso dal matching?

**No.** Viene "proponibile con priorità ridotta" (matching asimmetrico).
L'idea è non penalizzare chi non usa il calendario, ma privilegiare chi lo fa
perché aumenta la probabilità di accettazione della sfida.

---

### Q: Come si fa a sapere se un avversario è libero di giocare questa settimana?

Tramite il **semaforo di frequenza**: verde = sotto la frequenza ideale, giallo = tra
ideale e massima, rosso = saturato. Il numero esatto (es. "2/3") è visibile solo al
proprietario; agli altri arriva solo il colore.

---

### Q: Posso usare `localStorage` in un componente React?

**No di default.** Preferisci Zustand (client state) o TanStack Query (server state)
per il caso d'uso specifico. Se davvero serve `localStorage`, discutilo prima:
alcuni sandbox (es. artifact) lo vietano, e va comunque gestito con `try/catch`
per i browser in modalità privata.

---

### Q: Il codice va scritto in inglese o italiano?

**Codice, commenti, nomi di variabili, documentazione inline, Git commit: inglese.**
Conversazione con l'utente, specifiche, ADR, FAQ: **italiano**.
I file di traduzione `en.json` e `it.json` sono ovviamente entrambi.

---

### Q: Che package manager si usa?

**pnpm** (consigliato per Turborepo). Se il team preferisce npm, va deciso prima
dello Sprint 1 e aggiornato in ADR 0001.

---

### Q: Dove si mettono le chiavi API e i secret?

**Mai nel repository.** File `.env.local` gitignorato per lo sviluppo.
In produzione: variabili d'ambiente configurate sulla piattaforma (Vercel, Railway).
Per condividere secret nel team: 1Password / Bitwarden, mai Slack / email.

---

### Q: Lo Scoring Engine può chiamare il database?

**No.** È un package TS puro e deterministico. Prende tutti gli input come parametri
(incluse le date) e restituisce il delta. Chi lo chiama (il NestJS processor) si
occupa di fetch/persist. Questo garantisce testabilità totale e possibilità futura
di eseguirlo su Edge Functions o client.

---

### Q: Quando creo un nuovo ADR?

Quando prendi una decisione architetturale **non reversibile a costo zero**:
scelta di un servizio esterno, cambio di paradigma (es. REST vs GraphQL), pattern
che verrà replicato in più moduli, regole di dominio che emergono dal codice e non
erano nelle specs originali. Per decisioni tattiche piccole (es. "uso map invece di
forEach") non serve ADR.

---

### Q: Posso introdurre una nuova libreria npm?

**Discuti prima.** Il vincolo è: mantenere costi zero in fase 0, evitare dipendenze
pesanti o poco mantenute, preferire ciò che Turborepo e Next.js già ottimizzano.
Se la libreria è davvero necessaria, apri la PR citando il motivo e l'alternativa
valutata.
