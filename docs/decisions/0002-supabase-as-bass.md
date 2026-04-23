# ADR 0002 — Supabase come backend-as-a-service

- **Data**: 2026-04
- **Stato**: Accettato
- **Autori**: Ilijasevic Marko, Lorenzo Raimondo
- **Correlato**: `docs/specs/02_specifiche_sviluppo.md` §2.1, §2.2, §3.4

## Contesto

Il progetto ha bisogno, fin dal MVP, di:
- PostgreSQL gestito.
- Autenticazione utenti (email + OAuth Google/Apple).
- Storage di file (avatar, loghi lega).
- Realtime (opzionale ma utile per classifica live).
- Policy di sicurezza a livello di riga (tenant: lega/utente).

Vincolo primario: **costi infrastrutturali contenuti** fino all'attivazione della
monetizzazione (obiettivo: 0-5 $/mese in fase 0, 30-50 $/mese in fase 1).

## Opzioni valutate

1. **Stack self-hosted** (PostgreSQL + Keycloak/Auth.js + MinIO).
   - Pro: controllo totale, nessun vendor lock-in.
   - Contro: operatività pesante per un team di 2 persone; molti servizi da gestire;
     costi VM non trascurabili.

2. **Firebase**.
   - Pro: estremamente veloce da avviare, pricing generoso.
   - Contro: NoSQL (Firestore) non si presta al modello relazionale ricco richiesto
     (stagioni, match, classifiche, aggregati); vendor lock-in molto forte;
     i nostri engine preferiscono SQL.

3. **AWS RDS + Cognito + S3** (o equivalente GCP/Azure).
   - Pro: scalabilità, enterprise.
   - Contro: overhead di configurazione, costi non trascurabili già in fase 0.

4. **Supabase** ← scelto.
   - Pro: PostgreSQL nativo (compatibile con Prisma), Auth + Storage + Realtime
     in un'unica console, RLS built-in, free tier generoso (500MB DB, 1GB storage,
     50k utenti auth); facile esportare altrove in futuro perché sotto ci sta
     PostgreSQL standard.
   - Contro: dipendenza da un unico provider per più servizi (mitigata dall'essere
     in gran parte open source e self-hostable come fallback).

## Decisione

Usiamo **Supabase** come backend-as-a-service per:

- Database PostgreSQL (sola persistenza del progetto).
- Autenticazione utenti (email magic link + OAuth Google + Apple).
- Storage file pubblici (avatar, loghi) — tenendo però **Cloudflare R2 come storage
  principale** per file grandi o con traffico alto (vedi sotto).
- Row Level Security policy per il multitenancy lega-per-lega.

Il backend NestJS (`apps/api`) si interfaccia al DB via **Prisma**, non via Supabase
client, per mantenere portabilità. Usa invece il client Supabase solo per verificare
JWT e (eventualmente) per azioni admin su Auth e Storage.

## Conseguenze

**Positive**
- Setup in 1 giornata anziché 2 settimane.
- Nessun costo per i primi 500MB / 50k utenti.
- Il giorno in cui vogliamo migrare altrove: ci basta esportare il `pg_dump`, tutto
  il resto (auth, storage) è reimplementabile — non c'è feature database esclusiva
  di Supabase in uso.

**Negative / da gestire**
- Le policy RLS vanno scritte con cura: una policy sbagliata espone dati cross-lega.
  Ogni modello nuovo richiede una migration RLS esplicita e test.
- Cloudflare R2 viene usato in parallelo per file pesanti (immagini partite, export
  CSV), perché più economico di Supabase Storage a volumi alti.
- Il team deve creare un progetto Supabase "dev" e uno "prod" con credenziali
  separate fin dallo Sprint 1.

## Riferimenti

- [Supabase docs](https://supabase.com/docs)
- [Row Level Security in PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Prisma + Supabase guide](https://www.prisma.io/docs/guides/database/supabase)
