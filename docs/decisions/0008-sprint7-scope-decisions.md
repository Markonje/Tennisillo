# ADR 0008 — Sprint 7: perimetro gamification/admin e rinvii motivati

- **Stato**: accettato
- **Data**: 2026-07-07
- **Contesto**: Sprint 7 — Gamification, Admin, Rifinitura (chiusura MVP).

## Implementato

1. **Notifiche in-app**: `NotificationsModule` (lista, contatore non lette,
   mark read/all) + pagina `/notifications` con deep-link per tipo. Tutti i
   flussi scrivevano già righe `Notification`; ora la disputa notifica anche
   gli admin (spec 01 §13.1).
2. **Email via Resend REST** (`MailService`): nessun SDK, chiamata `fetch`
   diretta. Senza `RESEND_API_KEY` è un no-op loggato — ogni ambiente
   funziona senza credenziali. Cablata su: sfida ricevuta, risultato da
   confermare, disputa aperta.
3. **Achievement competitivi** (`AchievementsModule`): Prima Vittoria,
   In Fiamme, Ammazzagiganti, Esploratore, Vendicatore agganciati al
   post-scoring; Campione alla transizione `COMPLETED`. I badge training
   restano nel flusso Sprint 6. Catalogo creato lazy (upsert per code).
4. **Reputazione** (spec 01 §7.2.5): conferma manuale +1, disputa persa
   -10 (submitter), disputa infondata -5 (opener), clamp [0,100]. Visibile
   solo all'admin (dashboard).
5. **Anti-frode on-demand** (spec 01 §7.2.4 + §9.1.3): pattern detection
   calcolata alla richiesta dell'overview admin — coppie al limite, vittorie
   alternate (ultimi 4 scontri), farming sparring (coppie ≥3, giocatori al
   cap senza partite competitive in 4 settimane), inattivi 21+ giorni,
   reputazione < 70. A taglia MVP (leghe di decine di membri) non serve un
   motore in background.
6. **Dashboard admin** `/leagues/[id]/admin`: KPI stagione, dispute aperte
   con link, proposte campo, alert anti-frode, audit recente (query JSONB
   `payload.leagueId`).

## Rinviato con motivazione

| Voce | Motivo |
| --- | --- |
| WebSocket live (Socket.io) | Nessun beneficio finché non c'è traffico concorrente reale; le pagine si aggiornano con `router.refresh()` a ogni azione. L'introduzione richiede gateway autenticato ES256 + client — post-MVP. |
| Growthbook feature flags | Istanza self-hosted inesistente; `FEATURE_FLAGS` in shared-types già predispone i codici. |
| Stripe passivo | Nessuna chiave; `SubscriptionTier`/`StripeCustomer` già a schema. |
| Caching Redis matchmaking | Upstash non configurato; vedi ADR 0006 §7. |
| E2E Playwright | Richiede credenziali di test browser (Supabase email+password) non disponibili in sessione; la copertura E2E è garantita dai 13 test di integrazione su DB reale (flussi 3b/5/6 completi). Da aggiungere quando l'utente fornisce 2 utenze di test. |
| Badge full-season (Equilibrista, Iron Man, Sportivo, Muro) | Richiedono snapshot statistici per stagione non modellati; valutabili a chiusura stagione in v1.5. |
| Reminder partita 24h/2h, RANKING_CHANGE, SEASON_STARTING/ENDING | Richiedono scheduler (BullMQ repeatable + Redis). Predisposti i `NotificationType`; si attivano con Upstash. |
| Bacheca lega (§13.2) | Modello `Announcement` pronto; UI feed post-MVP. |
| Export CSV/PDF admin | Post-MVP. |
