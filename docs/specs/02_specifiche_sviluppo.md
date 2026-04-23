---
documento: 02 — Specifiche di Sviluppo
progetto: "Tennisillo — a friendly neighborhood racket"
versione: "2.0"
data: 2026-04
autori:
  - Ilijasevic Marko
  - Lorenzo Raimondo
stato: Approvato per sviluppo
documento_correlato: docs/specs/01_analisi_funzionale.md
note_revisione: >
  Revisione 2.0 — Specifiche MVP + moduli (Sparring, Master Lessons,
  Calendario, Frequenza, Anagrafica Campi), allineate ad Analisi Funzionale v2.0.
---

# Specifiche di Sviluppo — Tennisillo

> Questo documento è la **fonte di verità tecnica** del progetto ed è pensato per
> essere consumato da strumenti di sviluppo AI-assisted (Claude Code, Cursor, Copilot).
> Per l'analisi funzionale vedere
> [`01_analisi_funzionale.md`](./01_analisi_funzionale.md).
> Per lo storico delle revisioni vedere
> [`CHANGELOG_SPECS.md`](./CHANGELOG_SPECS.md).

## Executive Summary

Il presente documento contiene le specifiche tecniche complete per lo sviluppo del portale web descritto nel Documento 1 (Analisi Funzionale v2.0). Le specifiche sono strutturate per essere consumate direttamente da strumenti di sviluppo AI-assisted (Claude, Cursor, Copilot) per accelerare l'implementazione.

Questa revisione 2.0 integra le nuove funzionalità introdotte nell'Analisi Funzionale: Sparring, Allenamento con Maestro, Calendario Disponibilità, Frequenza Desiderata e Anagrafica Campi per lega.

**Contenuti del documento:**

- Stack tecnologico definitivo con giustificazioni di costo e scalabilità.

- Struttura monorepo basata su Turborepo con separazione tra frontend, backend, motore di punteggio e pacchetti condivisi.

- Schema database completo in Prisma (PostgreSQL su Supabase) con tutte le entità, relazioni ed enum, esteso con i modelli per Sparring, Allenamento, Calendario, Frequenza e Anagrafica Campi.

- Specifica del Scoring Engine come pacchetto TypeScript puro, deterministico e privo di dipendenze esterne, con fast-path dedicati per Sparring e XP Allenamento.

- API REST completa (endpoint, moduli NestJS, flussi asincroni con BullMQ) estesa con i nuovi moduli.

- Struttura del frontend Next.js con App Router, routing internazionalizzato e specifiche UI delle pagine chiave.

- Sistema i18n pronto per Inglese + Italiano, estendibile a più lingue.

- Architettura feature flags e predisposizione Stripe per la monetizzazione futura.

- Design system Apple-inspired con token (colori, tipografia, spaziature, ombre) e componenti base.

- Roadmap in 7 sprint con prompt suggeriti per interazione con AI dev tools.

**Principi architetturali:** mobile-first, API-first, modular design (doppio/Padel, Sparring e Allenamento come moduli attivabili), i18n-ready, audit trail completo, scoring engine deterministico, Supabase-first per sfruttare Auth, Storage e Realtime con un unico provider.

Costo infrastrutturale stimato: 0-5 €/mese in fase zero, 30-50 €/mese in fase 1.

## Indice

1. Contesto e Istruzioni per lo Sviluppatore AI

2. Stack Tecnologico Definitivo

3. Database Schema (Prisma)

4. Scoring Engine

5. Training Sessions Engine (Sparring + Master Lessons)

6. Matchmaking Engine (Calendario + Frequenza)

7. API Backend (NestJS)

8. Frontend (Next.js)

9. Sistema i18n

10. Monetizzazione — Architettura Predisposta

11. Design System Apple-Inspired

12. Ordine di Sviluppo e Prompt Suggeriti

13. Riepilogo Decisioni Architetturali Finali

## 1. Contesto e Istruzioni per lo Sviluppatore AI
### 1.1 Come Usare Questo Documento

Questo documento è strutturato per essere utilizzato con uno strumento di sviluppo AI (Claude, Cursor, Copilot o equivalente). Ogni sezione è autonoma e può essere passata come prompt contestuale. L'ordine di sviluppo consigliato segue la numerazione delle sezioni e degli sprint.

**Convenzioni usate:**

- **CODE** → nomi di file, variabili, funzioni.

- **ENTITÀ** → modelli del database.

- *corsivo* → decisioni da prendere durante lo sviluppo.

- **[CRITICAL]** → vincolo critico, non ignorare.

- **[SECURITY]** → requisito di sicurezza.

- **[BILLING]** → impatto sulla monetizzazione.

- **[NEW-v2]** → elemento introdotto nella revisione 2.0.

### 1.2 Principi Architetturali Globali

- Mobile-first UI (web responsive, app mobile futura)

- API-first backend (tutto esposto via REST, WebSocket per real-time)

- Modular design (doppio/Padel, Sparring e Allenamento con Maestro come moduli attivabili per lega, non hardcoded)

- i18n-ready dall'inizio (stringhe esternalizzate, mai hardcoded nell'UI)

- Audit trail completo (ogni azione è tracciata con timestamp e userId)

- Deterministic scoring engine (stesso input = stesso output, sempre)

- Isolamento del contributo non-competitivo: Sparring e XP Allenamento sono tracciati in entità separate dai Match competitivi, per mantenere pulita la catena di calcolo del ranking stagionale.

- Supabase-first (sfruttare al massimo RLS, Auth, Realtime di Supabase)

### 1.3 Modifiche Architetturali Chiave della Revisione 2.0

> **★ NUOVO IN v2.0 — Separazione entità competitive / non competitive** *Sparring e Allenamenti con Maestro NON sono rappresentati come varianti del modello Match ma come entità distinte (TrainingSession). Questo garantisce che il calculator del Scoring Engine principale operi solo su partite validate competitive, mantenendo la purezza della logica di ranking.*

> **★ NUOVO IN v2.0 — Modulo di matchmaking come servizio dedicato** *Il nuovo MatchmakingEngine è un servizio query-oriented che combina calendario disponibilità, frequenza desiderata, storico partite e compatibilità di livello. L'output è una lista ordinata di candidati che il frontend può presentare all'utente.*

> **★ NUOVO IN v2.0 — Anagrafica campi come aggregato di lega** *I Venue sono aggregati scoped per League (foreign key leagueId NOT NULL). Non esiste anagrafica globale condivisa. Le proposte dei giocatori passano da uno stato PENDING_VALIDATION a APPROVED solo per azione dell'admin.*

## 2. Stack Tecnologico Definitivo
### 2.1 Tecnologie

FRONTEND

  Framework:     Next.js 14+ (App Router)

  Language:      TypeScript (strict mode)

  Styling:       Tailwind CSS + shadcn/ui (componenti base)

  Design System: Custom Apple-inspired (vedi §11)

  State:         Zustand (client state) + TanStack Query (server state)

  Forms:         React Hook Form + Zod (validazione)

  Charts:        Recharts

  i18n:          next-intl

  Icons:         Lucide React

  Calendar UI:   react-big-calendar [NEW-v2]

  Maps:          Mapbox GL JS (per anagrafica campi) [NEW-v2]

BACKEND

  Runtime:       Node.js 20+

  Framework:     NestJS (TypeScript)

  ORM:           Prisma

  Validation:    class-validator + class-transformer

  Queue:         BullMQ (Redis-backed)

  WebSocket:     Socket.io

  Testing:       Jest + Supertest

  Geocoding:     Mapbox Geocoding API (anagrafica campi) [NEW-v2]

INFRASTRUTTURA

  Database:      PostgreSQL via Supabase

  Auth:          Supabase Auth (JWT, OAuth Google + Apple)

  Cache:         Redis via Upstash

  Storage:       Cloudflare R2 (avatar, loghi lega)

  Frontend host: Vercel

  Backend host:  Railway

  Email:         Resend + React Email (template)

  Push notify:   Firebase Cloud Messaging

  Monitoring:    Sentry (free tier)

MONETIZZAZIONE

  Payments:      Stripe (integrazione passiva MVP, attiva in v1.5)

  Feature flags: Growthbook (open source, self-hosted su Railway)

### 2.2 Stima Costi Infrastruttura

| **Componente** | **Tecnologia** | **Costo stimato** |
| --- | --- | --- |
| Frontend | Next.js | Gratuito |
| Backend | Node.js + NestJS | Gratuito |
| Database | PostgreSQL su Supabase | Gratis fino a 500MB, poi ~25 $/mese |
| Cache | Redis su Upstash | Gratis fino 10k req/giorno |
| Hosting frontend | Vercel | Gratis (hobby) → 20 $/mese (pro) |
| Hosting backend | Railway | ~5 $/mese |
| Notifiche push | Firebase FCM | Gratuito |
| Email | Resend | Gratis fino 3k email/mese |
| Storage immagini | Cloudflare R2 | Gratis fino a 10GB |
| Mapbox (geocoding + tiles) | Mapbox [NEW-v2] | Gratis fino 50k req/mese |
| **TOTALE FASE 0** |  | **~0-5 $/mese** |
| **TOTALE FASE 1** |  | **~30-50 $/mese** |

Supabase è particolarmente strategico: fornisce in un unico servizio PostgreSQL, autenticazione (OAuth Google/Apple incluso), storage file e API REST auto-generate, riducendo drasticamente il codice boilerplate da scrivere.

*L'aggiunta di Mapbox per geocoding e visualizzazione mappa dei campi ha costo marginale (free tier ampiamente sufficiente per la fase iniziale).*

### 2.3 Struttura Monorepo

tennis-league/

├── apps/

│   ├── web/                    # Next.js frontend

│   └── api/                    # NestJS backend

├── packages/

│   ├── db/                     # Prisma schema + migrations + seed

│   ├── scoring-engine/         # Motore punteggi partite competitive (puro TS)

│   ├── training-engine/        # [NEW-v2] Sparring + Master XP calculator

│   ├── matchmaking-engine/     # [NEW-v2] Smart match con calendario/frequenza

│   ├── shared-types/           # Tipi condivisi frontend/backend

│   └── ui/                     # Design system componenti

├── tools/

│   └── scripts/                # Utility CLI (seed, migration, etc.)

├── turbo.json                  # Turborepo config

└── package.json                # Root workspace

> **[CRITICAL] **Il scoring-engine, il training-engine e il matchmaking-engine sono package isolati senza dipendenze da framework. Questo garantisce testabilità totale e portabilità futura (es. possono girare su Edge Functions). I tre package sono indipendenti tra loro.

## 3. Database Schema (Prisma)
### 3.1 Overview delle Modifiche v2.0

Lo schema è stato esteso per supportare le nuove funzionalità. Le modifiche principali:

- **Nuovi enum: **MemberRole esteso con MASTER; MasterMode; TrainingSessionType; TrainingSessionStatus; VenueStatus; VenueSurface; FrequencyUnit; AvailabilityOverrideType.

- **Nuovi modelli: **TrainingSession, TrainingValidation, MasterProfile, AvailabilityPattern, AvailabilityOverride, Venue, VenueProposal, PlayerFrequencyPreference, PlayerFavoriteVenue.

- **Modelli estesi: **User (globalXP), LeagueMember (frequenza), Match (venueId), LeagueSettings (moduli attivabili), Notification (nuovi tipi).

### 3.2 Schema Completo

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ─────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────
enum UserRole { SUPER_ADMIN USER }
enum LeagueType { PUBLIC PRIVATE }
enum LeagueSport { TENNIS_SINGLES TENNIS_DOUBLES TENNIS_BOTH PADEL }

enum MemberRole {
  ADMIN
  MODERATOR
  PLAYER
  GUEST
  MASTER          // [NEW-v2] ruolo dedicato per validare allenamenti
}

enum MasterMode {  // [NEW-v2]
  PURE            // Solo maestro (non partecipa alla competizione)
  HYBRID          // Giocatore + maestro
}

enum SeasonStatus {
  DRAFT REGISTRATION ACTIVE PLAYOFFS COMPLETED ARCHIVED
}

enum MatchStatus {
  PENDING_ACCEPTANCE
  SCHEDULED
  PENDING_RESULT
  PENDING_VALIDATION
  DISPUTED
  VALIDATED
  CANCELLED
  WALKOVER
}

enum MatchFormat { BEST_OF_1 BEST_OF_3 SUPER_TIEBREAK CUSTOM }

enum PlayerLevel {
  ROOKIE BRONZE SILVER GOLD PLATINUM DIAMOND ELITE
}

enum TrainingSessionType {  // [NEW-v2]
  SPARRING          // Sessione tra due membri, contribuisce a punti stagione (+12 fissi)
  MASTER_LESSON     // Lezione con Maestro, contribuisce solo a XP globali
}

enum TrainingSessionStatus {  // [NEW-v2]
  PENDING_VALIDATION
  VALIDATED
  REJECTED
  DISPUTED
  REVOKED           // Revocata dall'admin dopo validazione
}

enum VenueStatus {  // [NEW-v2]
  ACTIVE
  PENDING_VALIDATION   // Proposta da giocatore, in attesa di admin
  ARCHIVED
}

enum VenueSurface {  // [NEW-v2]
  CLAY HARD GRASS SYNTHETIC OTHER
}

enum VenueCover {  // [NEW-v2]
  INDOOR OUTDOOR MIXED
}

enum FrequencyUnit {  // [NEW-v2]
  WEEKLY MONTHLY
}

enum AvailabilityOverrideType {  // [NEW-v2]
  AVAILABLE         // Aggiunta disponibilità straordinaria
  UNAVAILABLE       // Blocca uno slot ricorrente
}

enum NotificationType {
  CHALLENGE_RECEIVED
  CHALLENGE_ACCEPTED
  CHALLENGE_DECLINED
  MATCH_REMINDER
  RESULT_PENDING_VALIDATION
  RESULT_VALIDATED
  DISPUTE_OPENED
  DISPUTE_RESOLVED
  RANKING_CHANGE
  SEASON_STARTING
  SEASON_ENDING
  BADGE_EARNED
  LEAGUE_INVITE
  // [NEW-v2]
  SPARRING_PENDING_CONFIRM
  SPARRING_CONFIRMED
  MASTER_LESSON_PENDING_VALIDATION
  MASTER_LESSON_VALIDATED
  MASTER_LESSON_REJECTED
  VENUE_PROPOSAL_RECEIVED
  VENUE_PROPOSAL_APPROVED
  SPARRING_CAP_REACHED
  AVAILABILITY_MATCH_FOUND
}

enum DisputeStatus { OPEN UNDER_REVIEW RESOLVED DISMISSED }
enum SubscriptionTier { FREE PREMIUM }
```

**User (esteso)**

```prisma
model User {
  id                    String            @id @default(cuid())
  supabaseId            String            @unique
  email                 String            @unique
  username              String            @unique
  displayName           String
  avatarUrl             String?
  city                  String?
  birthYear             Int?
  phone                 String?
  role                  UserRole          @default(USER)
  subscriptionTier      SubscriptionTier  @default(FREE)
  subscriptionExpiresAt DateTime?
  globalRating          Float             @default(1500)
  globalLevel           PlayerLevel       @default(ROOKIE)
  globalExperiencePoints Int              @default(0)  // [NEW-v2] XP totali da master lessons
  reputationScore       Float             @default(100)
  preferredLocale       String            @default("en")
  onboardingCompleted   Boolean           @default(false)
  createdAt             DateTime          @default(now())
  updatedAt             DateTime          @updatedAt
  deletedAt             DateTime?

  memberships      LeagueMember[]
  sentChallenges   Match[]           @relation("Challenger")
  notifications    Notification[]
  achievements     UserAchievement[]
  auditLogs        AuditLog[]
  onboarding       UserOnboarding?
  // [NEW-v2]
  masterProfile          MasterProfile?
  trainingSessionsAsP1   TrainingSession[] @relation("TrainingP1")
  trainingSessionsAsP2   TrainingSession[] @relation("TrainingP2")
  trainingSessionsAsMaster TrainingSession[] @relation("TrainingMaster")
  venueProposals         VenueProposal[]
}
```

**LeagueMember (esteso)**

```prisma
model LeagueMember {
  id            String      @id @default(cuid())
  leagueId      String
  league        League      @relation(fields: [leagueId], references: [id])
  userId        String
  user          User        @relation(fields: [userId], references: [id])
  role          MemberRole  @default(PLAYER)
  // [NEW-v2] configurazione maestro (valido solo se role = MASTER o hybrid flag)
  masterMode    MasterMode?
  masterBio     String?
  isAlsoPlayer  Boolean     @default(false)  // true se MASTER che gioca anche
  nickname      String?
  bio           String?
  homeVenueId   String?                        // [NEW-v2] FK ad anagrafica Venue
  homeVenue     Venue?      @relation(fields: [homeVenueId], references: [id])
  leagueRating  Float       @default(1500)
  leagueLevel   PlayerLevel @default(ROOKIE)
  joinedAt      DateTime    @default(now())
  isActive      Boolean     @default(true)

  @@unique([leagueId, userId])

  seasonProfiles        SeasonPlayer[]
  headToHeads           HeadToHead[]      @relation("Player1HTH")
  headToHeadsOpp        HeadToHead[]      @relation("Player2HTH")
  // [NEW-v2]
  availabilityPattern   AvailabilityPattern?
  availabilityOverrides AvailabilityOverride[]
  frequencyPreference   PlayerFrequencyPreference?
  favoriteVenues        PlayerFavoriteVenue[]
}
```

**LeagueSettings (esteso)**

```prisma
model LeagueSettings {
  id                         String      @id @default(cuid())
  leagueId                   String      @unique
  league                     League      @relation(fields: [leagueId], references: [id])

  // Formato
  defaultMatchFormat         MatchFormat @default(BEST_OF_3)
  allowCustomFormat          Boolean     @default(false)

  // Punteggio — default per nuove stagioni
  defaultPointsWin           Int         @default(100)
  defaultPointsLoss          Int         @default(30)
  defaultLevelMultiplier     String      @default("NORMAL")
  defaultBonusConsistency    Boolean     @default(true)
  defaultBonusDiversity      Boolean     @default(true)
  defaultHeadToHead          Boolean     @default(true)
  defaultDecayEnabled        Boolean     @default(true)

  // Anti-frode
  geoVerificationEnabled     Boolean     @default(false)
  geoVerificationRadius      Int         @default(500)
  resultWindowHours          Int         @default(12)
  autoConfirmHours           Int         @default(24)

  // Comunicazioni
  reminderHoursBefore        Int[]       @default([24, 2])

  // [NEW-v2] Moduli attivabili
  sparringEnabled            Boolean     @default(true)
  sparringPointsPerPlayer    Int         @default(12)   // range 5-15
  sparringWeeklyCapPerPlayer Int         @default(2)    // range 1-2
  masterLessonsEnabled       Boolean     @default(false)
  masterXpPerSession         Int         @default(20)   // range 10-30
  // [NEW-v2] Anagrafica campi
  venuesEnabled              Boolean     @default(true)
  allowPlayerVenueProposals  Boolean     @default(true)
  // [NEW-v2] Calendario/frequenza
  availabilityEnabled        Boolean     @default(true)
  frequencyPreferenceEnabled Boolean     @default(true)
  defaultFrequencyUnit       FrequencyUnit @default(WEEKLY)
}
```

**TrainingSession — [NEW-v2]**

Modello unificato per Sparring e lezioni con Maestro. Il campo `type` discrimina la tipologia; la logica applicativa applica regole diverse per ciascuna.

```prisma
model TrainingSession {
  id             String                 @id @default(cuid())
  leagueId       String
  league         League                 @relation(fields: [leagueId], references: [id])
  seasonId       String?                // NULL per MASTER_LESSON (non stagione-specific)
  season         Season?                @relation(fields: [seasonId], references: [id])

  type           TrainingSessionType    // SPARRING | MASTER_LESSON
  status         TrainingSessionStatus  @default(PENDING_VALIDATION)

  // SPARRING: p1 e p2 sono i due membri che si allenano
  // MASTER_LESSON: p1 = giocatore, p2 = NULL, masterId = User.id del maestro
  player1Id      String
  player1        User                   @relation("TrainingP1", fields: [player1Id], references: [id])
  player2Id      String?
  player2        User?                  @relation("TrainingP2", fields: [player2Id], references: [id])
  masterId       String?                // solo per MASTER_LESSON
  master         User?                  @relation("TrainingMaster", fields: [masterId], references: [id])

  scheduledAt    DateTime?
  completedAt    DateTime               @default(now())
  durationMinutes Int?                  // opzionale, per master lesson
  focusNote      String?                // es. "lavorato su servizio"
  venueId        String?
  venue          Venue?                 @relation(fields: [venueId], references: [id])

  // Risultato calcolo
  pointsAwarded  Int                    @default(0)   // SPARRING: +12 a testa
  xpAwarded      Int                    @default(0)   // MASTER_LESSON: +20

  // Validazione
  validatedById  String?                // userId di chi ha validato
  validatedAt    DateTime?
  rejectedReason String?

  // Revoca admin
  revokedById    String?
  revokedAt      DateTime?
  revokedReason  String?

  createdAt      DateTime               @default(now())
  updatedAt      DateTime               @updatedAt

  @@index([leagueId, type])
  @@index([seasonId])
  @@index([player1Id])
  @@index([masterId])
}
```

**MasterProfile — [NEW-v2]**

```prisma
model MasterProfile {
  id                  String    @id @default(cuid())
  userId              String    @unique
  user                User      @relation(fields: [userId], references: [id])
  certifications      String[]  // array di certificazioni dichiarate (libere)
  yearsOfExperience   Int?
  specializations     String[]  // es. ["servizio", "gioco da fondo", "junior"]
  totalLessonsValidated Int     @default(0)
  activeSince         DateTime  @default(now())
}
```

**AvailabilityPattern — [NEW-v2]**

Pattern ricorrente settimanale del membro della lega. Un pattern per membro-lega.

```prisma
model AvailabilityPattern {
  id           String        @id @default(cuid())
  memberId     String        @unique
  member       LeagueMember  @relation(fields: [memberId], references: [id])
  // slots[] è un array JSON di { dayOfWeek: 0-6, startMinute: 0-1439, endMinute: 0-1439 }
  // La granularità minima applicativa è 60 minuti ma il DB accetta qualsiasi valore.
  slots        Json          // es. [{"dow":2,"start":1080,"end":1200}, ...]
  updatedAt    DateTime      @updatedAt
  createdAt    DateTime      @default(now())
}
```

**AvailabilityOverride — [NEW-v2]**

```prisma
model AvailabilityOverride {
  id           String        @id @default(cuid())
  memberId     String
  member       LeagueMember  @relation(fields: [memberId], references: [id])
  type         AvailabilityOverrideType
  startsAt     DateTime
  endsAt       DateTime
  note         String?
  createdAt    DateTime      @default(now())

  @@index([memberId, startsAt])
}
```

**PlayerFrequencyPreference — [NEW-v2]**

```prisma
model PlayerFrequencyPreference {
  id                  String         @id @default(cuid())
  memberId            String         @unique
  member              LeagueMember   @relation(fields: [memberId], references: [id])
  idealFrequency      Int            // partite desiderate per unità
  maxFrequency        Int            // limite oltre il quale non proporre
  unit                FrequencyUnit  @default(WEEKLY)
  updatedAt           DateTime       @updatedAt
}
```

**Venue (Anagrafica Campi) — [NEW-v2]**

```prisma
model Venue {
  id              String        @id @default(cuid())
  leagueId        String        // [CRITICAL] scoped per lega, NO global venues
  league          League        @relation(fields: [leagueId], references: [id])
  status          VenueStatus   @default(ACTIVE)
  name            String
  address         String
  latitude        Float?
  longitude       Float?
  surface         VenueSurface?
  cover           VenueCover?
  courtCount      Int?
  bookingUrl      String?        // link sito esterno prenotazione
  phone           String?
  priceRangeLow   Int?           // in centesimi EUR
  priceRangeHigh  Int?
  notes           String?
  createdById     String?        // userId, NULL se creato da admin direttamente
  approvedById    String?        // userId admin che ha approvato la proposta
  archivedAt      DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  members         LeagueMember[]
  matches         Match[]
  trainingSessions TrainingSession[]
  proposals       VenueProposal[]
  favoritedBy     PlayerFavoriteVenue[]

  @@index([leagueId, status])
  @@index([leagueId, latitude, longitude])
}
```

**VenueProposal — [NEW-v2]**

```prisma
model VenueProposal {
  id              String      @id @default(cuid())
  leagueId        String
  venueId         String?     // valorizzato se la proposta è stata accettata
  venue           Venue?      @relation(fields: [venueId], references: [id])
  proposedById    String
  proposedBy      User        @relation(fields: [proposedById], references: [id])
  // snapshot dati proposti (prima dell'eventuale editing admin)
  proposedData    Json
  status          VenueStatus @default(PENDING_VALIDATION)
  reviewedById    String?
  reviewNotes     String?
  createdAt       DateTime    @default(now())
  reviewedAt      DateTime?
}
```

**PlayerFavoriteVenue — [NEW-v2]**

```prisma
model PlayerFavoriteVenue {
  id         String       @id @default(cuid())
  memberId   String
  member     LeagueMember @relation(fields: [memberId], references: [id])
  venueId    String
  venue      Venue        @relation(fields: [venueId], references: [id])
  priority   Int          @default(1)  // 1-3, ordine di preferenza

  @@unique([memberId, venueId])
  @@unique([memberId, priority])
}
```

**Match (esteso)**

```prisma
model Match {
  id                     String        @id @default(cuid())
  seasonId               String
  season                 Season        @relation(fields: [seasonId], references: [id])
  player1Id              String
  player1                SeasonPlayer  @relation("MatchPlayer1", fields: [player1Id], references: [id])
  player2Id              String
  player2                SeasonPlayer  @relation("MatchPlayer2", fields: [player2Id], references: [id])
  challengerId           String
  challenger             User          @relation("Challenger", fields: [challengerId], references: [id])
  status                 MatchStatus   @default(PENDING_ACCEPTANCE)
  format                 MatchFormat   @default(BEST_OF_3)
  scheduledAt            DateTime?
  // [NEW-v2] venue è un FK all'anagrafica campi (precedente: stringa libera)
  venueId                String?
  venue                  Venue?        @relation(fields: [venueId], references: [id])
  venueTextFallback      String?       // conservato per import legacy / casi freeform
  completedAt            DateTime?
  resultWindowExpiresAt  DateTime?
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  result       MatchResult?
  validation   MatchValidation?
  dispute      Dispute?
  scoreDeltas  ScoreDelta[]
  pairCount    Int              @default(1)

  @@index([seasonId])
  @@index([player1Id, player2Id])
}
```

*Gli altri modelli (MatchResult, MatchValidation, Dispute, ScoreDelta, HeadToHead, Achievement, UserAchievement, Notification, Announcement, AuditLog, StripeCustomer, UserOnboarding, Season, SeasonSettings, SeasonPlayer, SeasonRanking, League) restano sostanzialmente invariati rispetto alla v1.0 salvo le FK aggiuntive verso i nuovi modelli dove indicato.*

### 3.3 Indici e Performance

Per supportare il nuovo algoritmo di matchmaking ad alta frequenza di query, si aggiungono i seguenti indici:

- Idx AvailabilityPattern.memberId (unique già presente).

- Idx AvailabilityOverride (memberId, startsAt) per query su range temporale.

- Idx TrainingSession (leagueId, type) per filtri rapidi Sparring vs MasterLesson.

- Idx TrainingSession (player1Id, completedAt) per conteggio cap settimanale.

- Idx Venue (leagueId, status) per liste rapide in UI.

- Idx geo su Venue (leagueId, latitude, longitude) per eventuali query di prossimità in SQL raw.

### 3.4 Row Level Security (Supabase)

Policy RLS da applicare sui nuovi modelli:

- **TrainingSession: **SELECT consentito a membri della lega del record; INSERT solo dal player1 (SPARRING) o dal player (MASTER_LESSON); UPDATE su status solo dal validatore pertinente (player2 per sparring, master per lesson, admin per revoca).

- **Venue: **SELECT su ACTIVE consentito a tutti i membri della lega; CREATE diretto solo da ADMIN/MODERATOR; proposte da PLAYER passano per VenueProposal.

- **AvailabilityPattern / AvailabilityOverride: **SELECT consentito a tutti i membri della stessa lega (visibilità piena come da Analisi §10.1.4); UPDATE solo dal proprietario.

- **PlayerFrequencyPreference: **SELECT per membri della stessa lega (è esposta come semaforo); UPDATE solo dal proprietario.

## 4. Scoring Engine

Il Scoring Engine resta invariato nella sua logica centrale rispetto alla v1.0. Opera esclusivamente su Match competitivi validati. Le nuove entità TrainingSession sono gestite dal Training Engine (§5) in modo completamente disaccoppiato.

### 4.1 Struttura del Package

packages/scoring-engine/

├── src/

│   ├── index.ts                    # Export pubblico

│   ├── types.ts                    # Interfacce input/output

│   ├── calculator.ts               # Entry point calcolo

│   ├── components/

│   │   ├── base.ts                 # P_BASE

│   │   ├── levelMultiplier.ts      # M_LIVELLO

│   │   ├── resultMultiplier.ts     # M_RISULTATO

│   │   ├── consistency.ts          # B_COSTANZA (conta SOLO partite competitive)

│   │   ├── diversity.ts            # B_DIVERSIFICAZIONE

│   │   ├── headToHead.ts           # B_RIVALSA / DOMINANZA

│   │   ├── winStreak.ts            # Striscia vittorie

│   │   ├── repeatPenalty.ts        # MALUS_RIPETIZIONE

│   │   └── decay.ts                # DECAY_INATTIVITÀ

│   └── utils/

│       ├── levelUtils.ts

│       └── seasonUtils.ts

└── __tests__/

    ├── calculator.test.ts

    ├── levelMultiplier.test.ts

    └── ... (test per ogni componente)

> **[CRITICAL] **Il consistency.ts e il decay.ts NON devono considerare TrainingSession. Lo Sparring e l'Allenamento con Maestro non proteggono dal decay né alimentano la costanza. Questo è un vincolo funzionale (vedi Analisi Funzionale §8.10).

### 4.2 Tipi Core del Scoring Engine

I tipi restano identici alla v1.0. Si mantiene il principio di determinismo totale: stesso input → stesso output.

```typescript
// packages/scoring-engine/src/types.ts

export type PlayerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ScoringConfig {
  pointsWin: number;              // default: 100
  pointsLoss: number;             // default: 30
  levelMultiplierMode: 'OFF' | 'SOFT' | 'NORMAL' | 'HARD';
  bonusConsistencyEnabled: boolean;
  bonusDiversityEnabled: boolean;
  headToHeadEnabled: boolean;
  decayEnabled: boolean;
  decayStartWeek: number;
  decayPointsPerWeek: number[];
  rivalCooldownDays: number;
  maxMatchesPerPair: number;
}

// PlayerSeasonContext: importante!
// Il campo matchesLast4Weeks conta SOLO partite competitive validate.
// Lo Sparring NON deve incrementare questo contatore a livello applicativo.
export interface PlayerSeasonContext {
  seasonPlayerId: string;
  level: PlayerLevel;
  rating: number;
  matchesLast4Weeks: number;                // [NOTE-v2] solo Match, non TrainingSession
  uniqueOpponentsThisSeason: string[];
  totalMatchesThisSeason: number;
  currentWinStreak: number;
  winStreakOpponentIds: string[];
  weeksInactiveConsecutive: number;         // [NOTE-v2] solo Match, non TrainingSession
  pausesUsed: number;
}

export interface HeadToHeadContext {
  matchesBetweenPairThisSeason: number;     // [NOTE-v2] Sparring NON conta
  lastWinnerId: string | null;
  lastRivalBonusAt: Date | null;
}
```

### 4.3 Entry Point del Calcolatore

La funzione calculateMatchScore() resta invariata. Si raccomanda di aggiungere una JSDoc esplicita:

```typescript
/**
 * Calcola il delta punti per vincitore e sconfitto di una Match competitiva validata.
 *
 * PRECONDIZIONI (responsabilità del chiamante):
 * - Il Match deve essere VALIDATED (status).
 * - Il Match NON può essere una TrainingSession — quelle usano training-engine.
 * - matchesLast4Weeks, weeksInactiveConsecutive, matchesBetweenPairThisSeason
 *   devono essere calcolati contando SOLO Match competitivi (no Sparring).
 *
 * OUTPUT:
 * - deltaTotal >= 0 garantito (clamp at 0).
 * - Sempre idempotente e deterministico.
 */
export function calculateMatchScore(
  input: ScoreCalculationInput
): ScoreCalculationOutput { /* ... invariato v1.0 ... */ }
```

### 4.4 Implementazione Componenti Chiave

L'implementazione resta quella della v1.0 per:

- levelMultiplier.ts (MULTIPLIERS per OFF/SOFT/NORMAL/HARD).

- diversity.ts (indice normalizzato + bonus nuovo avversario).

- headToHead.ts (rivalsa/dominanza con cooldown).

- repeatPenalty.ts (malus scalato sul limite dinamico).

Vedi Documento 2 v1.0 per il codice completo; nessuna modifica necessaria.

## 5. Training Sessions Engine

Package dedicato alla gestione delle sessioni non competitive: Sparring e Master Lesson. È un package autonomo perché la logica è fondamentalmente diversa da quella del Scoring Engine: niente moltiplicatori, niente bonus dinamici, regole semplici e verifiche di cap.

> **★ NUOVO IN v2.0 — Perché un package separato** *Mantenere Sparring e Master Lesson fuori dal Scoring Engine principale preserva la determinismo e semplicità del motore di ranking. Inoltre permette di evolvere indipendentemente le regole non competitive (es. aggiungere tipi futuri come **"**Gruppo di allenamento**"**) senza toccare il calcolo del ranking.*

### 5.1 Struttura del Package

packages/training-engine/

├── src/

│   ├── index.ts

│   ├── types.ts

│   ├── sparring.ts              # Calcolo punti Sparring

│   ├── masterLesson.ts          # Calcolo XP Master Lesson

│   ├── capChecker.ts            # Verifica cap settimanale sparring

│   ├── xpCurve.ts               # Curva rendimenti decrescenti per XP → rating globale

│   └── utils/

│       └── dateUtils.ts

└── __tests__/

### 5.2 Tipi Core

```typescript
// packages/training-engine/src/types.ts

export interface SparringConfig {
  pointsPerPlayer: number;        // default 12, range 5-15
  weeklyCapPerPlayer: number;     // default 2, range 1-2
}

export interface SparringCalculationInput {
  config: SparringConfig;
  player1Id: string;
  player2Id: string;
  // Conteggio Sparring già validati nella settimana ISO corrente per ciascun giocatore
  player1SparringThisWeek: number;
  player2SparringThisWeek: number;
}

export interface SparringCalculationOutput {
  accepted: boolean;
  rejectionReason?: 'CAP_REACHED_P1' | 'CAP_REACHED_P2' | 'SPARRING_DISABLED';
  pointsP1: number;
  pointsP2: number;
}

export interface MasterLessonConfig {
  xpPerSession: number;           // default 20, range 10-30
}

export interface MasterLessonCalculationInput {
  config: MasterLessonConfig;
  playerId: string;
  masterId: string;
  // XP totali già accumulati dal giocatore (per calcolo curva diminishing returns)
  playerCurrentXp: number;
}

export interface MasterLessonCalculationOutput {
  xpAwarded: number;
  globalRatingDelta: number;      // Quanto contribuiscono gli XP al rating globale
}
```

### 5.3 Sparring — Implementazione

```typescript
// packages/training-engine/src/sparring.ts
import {
  SparringCalculationInput,
  SparringCalculationOutput
} from './types';

export function calculateSparring(
  input: SparringCalculationInput
): SparringCalculationOutput {
  const { config, player1SparringThisWeek, player2SparringThisWeek } = input;

  // Cap check
  if (player1SparringThisWeek >= config.weeklyCapPerPlayer) {
    return {
      accepted: false,
      rejectionReason: 'CAP_REACHED_P1',
      pointsP1: 0,
      pointsP2: 0,
    };
  }
  if (player2SparringThisWeek >= config.weeklyCapPerPlayer) {
    return {
      accepted: false,
      rejectionReason: 'CAP_REACHED_P2',
      pointsP1: 0,
      pointsP2: 0,
    };
  }

  // Ricompensa fissa, nessun moltiplicatore
  return {
    accepted: true,
    pointsP1: config.pointsPerPlayer,
    pointsP2: config.pointsPerPlayer,
  };
}
```

### 5.4 Master Lesson — Implementazione

Gli XP Allenamento alimentano il rating globale con una curva a rendimenti decrescenti, per evitare che un giocatore scali i livelli globali esclusivamente accumulando allenamenti.

```typescript
// packages/training-engine/src/xpCurve.ts

/**
 * Conversione XP → delta rating globale, con rendimenti decrescenti.
 * Formula: delta = xpAwarded * factor(currentXp)
 *   factor(x) = 0.5 se x < 100
 *              = 0.3 se x < 500
 *              = 0.15 se x < 1500
 *              = 0.05 se x >= 1500
 * Ciò significa che servono molti più allenamenti per salire di livello
 * via XP che via partite competitive.
 */
export function xpToGlobalRatingDelta(
  xpAwarded: number,
  currentXp: number
): number {
  let factor: number;
  if (currentXp < 100)       factor = 0.5;
  else if (currentXp < 500)  factor = 0.3;
  else if (currentXp < 1500) factor = 0.15;
  else                       factor = 0.05;
  return Math.round(xpAwarded * factor * 100) / 100;  // 2 decimali
}

// packages/training-engine/src/masterLesson.ts
export function calculateMasterLesson(
  input: MasterLessonCalculationInput
): MasterLessonCalculationOutput {
  const { config, playerCurrentXp } = input;
  const xpAwarded = config.xpPerSession;
  const globalRatingDelta = xpToGlobalRatingDelta(xpAwarded, playerCurrentXp);
  return { xpAwarded, globalRatingDelta };
}
```

### 5.5 Cap Checker

Servizio di utilità per verificare il cap settimanale di Sparring per un dato giocatore. Usato dall'API prima di accettare la registrazione di uno Sparring.

```typescript
// packages/training-engine/src/capChecker.ts
import { startOfWeek, endOfWeek } from 'date-fns';

export function isWithinSparringCap(
  validatedSparringThisWeek: number,
  weeklyCap: number
): boolean {
  return validatedSparringThisWeek < weeklyCap;
}

// Helper date: ritorna (start, end) della settimana ISO per un timestamp dato.
export function getIsoWeekBounds(at: Date): { start: Date; end: Date } {
  return {
    start: startOfWeek(at, { weekStartsOn: 1 }),  // lunedì
    end:   endOfWeek(at, { weekStartsOn: 1 }),
  };
}
```

### 5.6 Test Unitari Minimi Richiesti

- Sparring: cap rispettato, cap superato da P1, cap superato da P2, configurazioni estreme (5 e 15 punti).

- Master Lesson: curva XP a rendimenti decrescenti verificata su 4 fasce (<100, <500, <1500, >=1500).

- Cap checker: edge case del cambio settimana ISO.

- Determinismo: stesso input → stesso output per 1000 invocazioni.

## 6. Matchmaking Engine

Package dedicato all'algoritmo di Smart Match. Combina calendario disponibilità, frequenza desiderata, storico partite e compatibilità di livello per restituire candidati ordinati per probabilità di accettazione della sfida.

### 6.1 Struttura del Package

packages/matchmaking-engine/

├── src/

│   ├── index.ts

│   ├── types.ts

│   ├── matcher.ts               # Entry point: findCandidates()

│   ├── scorers/

│   │   ├── levelScorer.ts       # Compatibilità livello

│   │   ├── diversityScorer.ts   # Bonus avversari nuovi

│   │   ├── availabilityScorer.ts # Intersezione slot calendario

│   │   ├── frequencyScorer.ts   # Semaforo verde/giallo/rosso

│   │   └── geoScorer.ts         # Distanza geografica (opzionale)

│   ├── aggregator.ts            # Combinazione punteggi → score finale

│   └── utils/

│       └── slotIntersection.ts  # Algoritmo intersezione intervalli temporali

└── __tests__/

### 6.2 Tipi Core

```typescript
// packages/matchmaking-engine/src/types.ts

export type PlayerLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TimeSlot {
  dayOfWeek: number;    // 0 (dom) - 6 (sab), ISO 1-7 opzionale
  startMinute: number;  // 0-1439
  endMinute: number;    // 0-1439
}

export interface SpecificOverride {
  type: 'AVAILABLE' | 'UNAVAILABLE';
  startsAt: Date;
  endsAt: Date;
}

export interface CandidateContext {
  memberId: string;
  level: PlayerLevel;
  rating: number;
  availabilityPattern: TimeSlot[];              // può essere vuoto
  availabilityOverrides: SpecificOverride[];
  // Frequenza
  hasFrequencyDeclared: boolean;
  currentPeriodMatches: number;                 // partite già giocate nel periodo
  idealFrequency: number;
  maxFrequency: number;
  // Storico partite (stagione corrente)
  matchesWithRequesterThisSeason: number;
  lastMatchWithRequesterAt: Date | null;
  maxMatchesPerPair: number;
  // Geo (opzionale)
  favoriteVenueLat?: number;
  favoriteVenueLng?: number;
}

export interface RequesterContext {
  memberId: string;
  level: PlayerLevel;
  rating: number;
  // Slot di interesse per cui cercare compatibilità (prossimi 14 gg)
  availabilityPattern: TimeSlot[];
  availabilityOverrides: SpecificOverride[];
  favoriteVenueLat?: number;
  favoriteVenueLng?: number;
}

export interface MatchmakingConfig {
  horizonDays: number;                 // default 14
  maxCandidates: number;               // default 20
  requireAvailabilityIntersection: boolean; // default false
  enableGeoScoring: boolean;           // default false
  weights: {
    level: number;        // default 0.25
    diversity: number;    // default 0.20
    availability: number; // default 0.25
    frequency: number;    // default 0.20
    geo: number;          // default 0.10
  };
}

export interface CandidateResult {
  memberId: string;
  finalScore: number;            // 0-100
  breakdown: {
    level: number;
    diversity: number;
    availability: number;
    frequency: number;
    geo: number;
  };
  suggestedSlots: Array<{ startsAt: Date; endsAt: Date }>;  // top 3 slot comuni
  frequencyStatus: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  warnings: string[];
}
```

### 6.3 Entry Point

```typescript
// packages/matchmaking-engine/src/matcher.ts
import { RequesterContext, CandidateContext, MatchmakingConfig, CandidateResult } from './types';
import { scoreLevel } from './scorers/levelScorer';
import { scoreDiversity } from './scorers/diversityScorer';
import { scoreAvailability } from './scorers/availabilityScorer';
import { scoreFrequency } from './scorers/frequencyScorer';
import { scoreGeo } from './scorers/geoScorer';
import { aggregate } from './aggregator';

export function findCandidates(
  requester: RequesterContext,
  candidates: CandidateContext[],
  config: MatchmakingConfig
): CandidateResult[] {
  const results: CandidateResult[] = [];

  for (const cand of candidates) {
    // Hard filters
    if (cand.memberId === requester.memberId) continue;
    if (cand.matchesWithRequesterThisSeason >= cand.maxMatchesPerPair) {
      continue; // limite coppia raggiunto
    }

    // Sub-scorers (ognuno ritorna 0-100)
    const level = scoreLevel(requester.level, cand.level);
    const diversity = scoreDiversity(cand.matchesWithRequesterThisSeason);
    const avail = scoreAvailability(requester, cand, config.horizonDays);
    const freq = scoreFrequency(cand);
    const geo = config.enableGeoScoring ? scoreGeo(requester, cand) : 50;

    if (config.requireAvailabilityIntersection && avail.score === 0) continue;

    const finalScore = aggregate({ level, diversity, avail: avail.score, freq: freq.score, geo }, config.weights);

    results.push({
      memberId: cand.memberId,
      finalScore,
      breakdown: { level, diversity, availability: avail.score, frequency: freq.score, geo },
      suggestedSlots: avail.topSlots,
      frequencyStatus: freq.status,
      warnings: freq.warnings,
    });
  }

  return results
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, config.maxCandidates);
}
```

### 6.4 Scorer Rilevanti

**levelScorer.ts — compatibilità livello (già presente logicamente in v1.0):**

```typescript
// Max score quando differenza livello = 0, decrescente linearmente fino a 0 per diff >= 3
export function scoreLevel(a: PlayerLevel, b: PlayerLevel): number {
  const diff = Math.abs(a - b);
  if (diff === 0) return 100;
  if (diff === 1) return 80;
  if (diff === 2) return 40;
  return 10;
}
```

**availabilityScorer.ts — intersezione slot calendario:**

```typescript
export function scoreAvailability(
  requester: RequesterContext,
  candidate: CandidateContext,
  horizonDays: number
): { score: number; topSlots: Array<{ startsAt: Date; endsAt: Date }> } {
  // Matching asimmetrico: se candidato non ha dichiarato nulla, score ridotto ma > 0
  if (candidate.availabilityPattern.length === 0 &&
      candidate.availabilityOverrides.length === 0) {
    return { score: 35, topSlots: [] };
  }

  // Materializza slot dei prossimi N giorni per entrambi (pattern + override)
  const requesterSlots = materializeSlots(requester, horizonDays);
  const candidateSlots = materializeSlots(candidate, horizonDays);

  // Calcola intersezione (vedi utils/slotIntersection.ts)
  const intersection = intersectSlots(requesterSlots, candidateSlots);

  if (intersection.length === 0) {
    return { score: 0, topSlots: [] };
  }

  // Scoring: più ore totali di intersezione + prossimità temporale alta
  const totalHours = intersection.reduce((sum, s) => sum + (s.endsAt.getTime() - s.startsAt.getTime()) / 3600000, 0);
  const normalizedScore = Math.min(100, totalHours * 10);

  return {
    score: normalizedScore,
    topSlots: intersection.slice(0, 3),
  };
}
```

**frequencyScorer.ts — semaforo verde/giallo/rosso:**

```typescript
export function scoreFrequency(c: CandidateContext): {
  score: number;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  warnings: string[];
} {
  if (!c.hasFrequencyDeclared) {
    // Neutro: ipotizziamo capacità standard, score medio
    return { score: 50, status: 'UNKNOWN', warnings: [] };
  }

  const { currentPeriodMatches, idealFrequency, maxFrequency } = c;

  if (currentPeriodMatches >= maxFrequency) {
    return {
      score: 5,
      status: 'RED',
      warnings: ['MAX_FREQUENCY_REACHED'],
    };
  }

  if (currentPeriodMatches >= idealFrequency) {
    return {
      score: 50,
      status: 'YELLOW',
      warnings: [],
    };
  }

  return {
    score: 100,
    status: 'GREEN',
    warnings: [],
  };
}
```

### 6.5 Aggregator

```typescript
export function aggregate(
  scores: { level: number; diversity: number; avail: number; freq: number; geo: number },
  weights: MatchmakingConfig['weights']
): number {
  const weighted =
    scores.level * weights.level +
    scores.diversity * weights.diversity +
    scores.avail * weights.availability +
    scores.freq * weights.frequency +
    scores.geo * weights.geo;

  // Normalize (somma pesi dovrebbe essere ~1.0)
  const sumWeights = Object.values(weights).reduce((a, b) => a + b, 0);
  return Math.round(weighted / sumWeights);
}
```

### 6.6 Performance e Caching

L'algoritmo ha complessità O(N) in numero di candidati, ma per leghe con 100+ membri la materializzazione degli slot nei prossimi 14 giorni può diventare costosa. Ottimizzazioni previste:

- Materializzazione slot in cache Redis con TTL 6h (invalidata on AvailabilityPattern/Override update).

- Pre-computing di un "availability vector" per membro aggiornato on-write.

- Query Prisma ottimizzata con `include` selettivo per caricare solo i dati necessari in una transazione.

## 7. API Backend (NestJS)
### 7.1 Struttura Moduli

apps/api/src/

├── main.ts

├── app.module.ts

├── modules/

│   ├── auth/

│   │   ├── auth.module.ts

│   │   ├── auth.controller.ts

│   │   ├── auth.service.ts

│   │   └── guards/

│   │       ├── jwt.guard.ts

│   │       ├── roles.guard.ts

│   │       └── master.guard.ts                # [NEW-v2]

│   ├── users/

│   ├── leagues/

│   ├── seasons/

│   ├── matches/

│   │   ├── matches.module.ts

│   │   ├── matches.controller.ts

│   │   ├── matches.service.ts

│   │   ├── matches.gateway.ts

│   │   └── dto/

│   ├── training-sessions/                     # [NEW-v2]

│   │   ├── training-sessions.module.ts

│   │   ├── training-sessions.controller.ts

│   │   ├── training-sessions.service.ts

│   │   ├── sparring.service.ts

│   │   ├── master-lesson.service.ts

│   │   └── dto/

│   ├── scoring/

│   │   ├── scoring.module.ts

│   │   ├── scoring.service.ts

│   │   ├── scoring.processor.ts

│   │   └── decay.service.ts

│   ├── matchmaking/                           # [NEW-v2]

│   │   ├── matchmaking.module.ts

│   │   ├── matchmaking.controller.ts

│   │   ├── matchmaking.service.ts

│   │   └── dto/

│   ├── availability/                          # [NEW-v2]

│   │   ├── availability.module.ts

│   │   ├── availability.controller.ts

│   │   ├── availability.service.ts

│   │   └── dto/

│   ├── frequency/                             # [NEW-v2]

│   │   ├── frequency.module.ts

│   │   ├── frequency.controller.ts

│   │   └── frequency.service.ts

│   ├── venues/                                # [NEW-v2]

│   │   ├── venues.module.ts

│   │   ├── venues.controller.ts

│   │   ├── venues.service.ts

│   │   ├── venue-proposals.controller.ts

│   │   ├── geocoding.service.ts

│   │   └── dto/

│   ├── masters/                               # [NEW-v2]

│   │   ├── masters.module.ts

│   │   ├── masters.controller.ts

│   │   └── masters.service.ts

│   ├── rankings/

│   ├── notifications/

│   ├── achievements/

│   └── admin/

└── common/

    ├── decorators/

    ├── filters/

    ├── interceptors/

    └── pipes/

### 7.2 Endpoint API — Esistenti

Gli endpoint della v1.0 restano invariati e completamente retrocompatibili.

### 7.3 Endpoint API — Nuovi [NEW-v2]

**TRAINING SESSIONS — Sparring & Master Lesson**

```
// Sparring
POST   /leagues/:leagueId/sparring                # dichiara sparring (P1 → crea)
  body: { player2Id, scheduledAt, venueId?, focusNote? }
POST   /sparring/:id/confirm                      # P2 conferma
POST   /sparring/:id/reject                       # P2 rifiuta
GET    /sparring/:id
GET    /leagues/:leagueId/sparring?userId=&from=&to=

// Master Lesson
POST   /leagues/:leagueId/master-lessons          # giocatore dichiara lesson
  body: { masterId, scheduledAt, durationMinutes?, focusNote?, venueId? }
POST   /master-lessons/:id/validate               # maestro valida → +XP
POST   /master-lessons/:id/reject                 # maestro rifiuta
GET    /master-lessons/:id
GET    /users/me/master-lessons
GET    /users/me/global-xp                        # XP totali + storico

// Revoca admin (entrambi i tipi)
POST   /admin/training-sessions/:id/revoke        # [ADMIN] revoca con motivo
```

**AVAILABILITY — Calendario**

```
GET    /members/:memberId/availability            # pattern + overrides (prox 60gg)
PUT    /members/me/availability/pattern           # upsert pattern ricorrente
  body: { slots: [{ dayOfWeek, startMinute, endMinute }, ...] }
POST   /members/me/availability/overrides         # crea override
  body: { type: 'AVAILABLE'|'UNAVAILABLE', startsAt, endsAt, note? }
DELETE /availability/overrides/:id
GET    /leagues/:leagueId/availability/overview   # mappa collettiva disponibilità
```

**FREQUENCY — Frequenza desiderata**

```
GET    /members/:memberId/frequency               # pubblico: solo status semaforo
GET    /members/me/frequency                      # dettaglio completo
PUT    /members/me/frequency                      # upsert preferenza
  body: { idealFrequency, maxFrequency, unit }
```

**VENUES — Anagrafica campi**

```
GET    /leagues/:leagueId/venues                  # lista (filtri: status, surface, ecc.)
POST   /leagues/:leagueId/venues                  # [ADMIN] crea venue
GET    /venues/:id
PATCH  /venues/:id                                # [ADMIN]
DELETE /venues/:id                                # [ADMIN] in realtà archivia

// Proposte (dai giocatori)
POST   /leagues/:leagueId/venue-proposals         # [PLAYER] propone un nuovo venue
GET    /leagues/:leagueId/venue-proposals         # [ADMIN] lista pending
POST   /venue-proposals/:id/approve               # [ADMIN] → crea Venue
POST   /venue-proposals/:id/reject                # [ADMIN]

// Campi preferiti del giocatore
GET    /members/me/favorite-venues
PUT    /members/me/favorite-venues                # upsert lista ordinata
  body: { venues: [{ venueId, priority }] }

// Geocoding helper
POST   /venues/geocode                            # wrapper Mapbox; cache Redis
```

**MATCHMAKING — Smart Match**

```
GET    /seasons/:seasonId/matchmaking/candidates  # [NEW-v2]
  query: { limit=10, requireAvailability=false, enableGeo=false }
  returns: CandidateResult[] (da matchmaking-engine)

GET    /seasons/:seasonId/matchmaking/slots       # [NEW-v2]
  query: { candidateMemberId, horizonDays=14 }
  returns: slot di intersezione tra me e il candidato
```

**MASTERS — Gestione ruolo maestro**

```
POST   /leagues/:leagueId/masters                 # [ADMIN] invita/promuove a MASTER
  body: { userId, masterMode: 'PURE'|'HYBRID' }
PATCH  /leagues/:leagueId/masters/:memberId       # aggiorna masterMode o revoca
GET    /leagues/:leagueId/masters                 # lista maestri attivi
GET    /masters/:userId/profile                   # MasterProfile + statistiche
PATCH  /users/me/master-profile                   # edit certs/specializations
```

### 7.4 Flusso Scoring Asincrono (invariato)

Il processor BullMQ per scoring competitive resta invariato. Si aggiunge un processor separato per gli eventi di Training Session:

```typescript
// apps/api/src/modules/training-sessions/training.processor.ts

@Processor('training')
export class TrainingProcessor {
  @Process('sparring-validated')
  async handleSparringValidated(job: Job<{ sessionId: string }>) {
    // 1. Carica TrainingSession + config lega
    // 2. Invoca training-engine/sparring.calculateSparring()
    // 3. Se accepted → aggiorna SeasonRanking.totalPoints (P1 +12, P2 +12)
    //    Incrementa contatore Sparring settimanale in cache
    // 4. Invia notifiche WebSocket a P1 e P2
    // 5. Verifica badge "Compagno di Banco" (10 sparring validati)
    // [NOTE] NON aggiorna matchesLast4Weeks, NON aggiorna winStreak,
    // NON tocca HeadToHead, NON tocca pairCount
  }

  @Process('master-lesson-validated')
  async handleMasterLessonValidated(job: Job<{ sessionId: string }>) {
    // 1. Carica TrainingSession + config lega
    // 2. Invoca training-engine/masterLesson.calculateMasterLesson()
    // 3. Aggiorna User.globalExperiencePoints += xpAwarded
    // 4. Aggiorna User.globalRating += globalRatingDelta
    // 5. Eventuale promozione di globalLevel se raggiunge soglia
    // 6. Notifica giocatore e maestro
    // 7. Verifica badge "Studioso", "Dedicato", "Mentor"
    // [NOTE] NON tocca SeasonRanking — XP sono extra-stagione
  }

  @Process('training-session-revoked')
  async handleRevocation(job: Job<{ sessionId: string }>) {
    // Storno punti/XP assegnati; notifica parti coinvolte
  }
}
```

> **[CRITICAL] **Il processor training NON deve mai scrivere su ScoreDelta, HeadToHead, o incrementare contatori usati dal calculator competitivo (matchesLast4Weeks, winStreak). Il rispetto di questo invariante è verificato da test di integrazione.

### 7.5 Guards e Autorizzazioni

```typescript
// MasterGuard: consente l'azione solo se il user loggato è MASTER nella lega del record
@Injectable()
export class MasterGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const userId = req.user.id;
    const sessionId = req.params.id;
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: { league: { include: { members: true } } }
    });
    if (!session || session.type !== 'MASTER_LESSON') return false;
    const membership = session.league.members.find(m => m.userId === userId);
    return membership?.role === 'MASTER' && session.masterId === userId;
  }
}
```

## 8. Frontend (Next.js)
### 8.1 Struttura Route (App Router)

apps/web/src/app/

├── [locale]/

│   ├── layout.tsx

│   ├── page.tsx

│   ├── (auth)/

│   │   ├── login/page.tsx

│   │   ├── register/page.tsx

│   │   └── onboarding/page.tsx

│   ├── (app)/

│   │   ├── layout.tsx

│   │   ├── dashboard/page.tsx

│   │   ├── profile/

│   │   │   ├── page.tsx

│   │   │   └── [username]/page.tsx

│   │   ├── leagues/

│   │   │   ├── page.tsx

│   │   │   ├── new/page.tsx

│   │   │   └── [leagueId]/

│   │   │       ├── page.tsx

│   │   │       ├── seasons/[seasonId]/...

│   │   │       ├── members/page.tsx

│   │   │       ├── settings/page.tsx                       # [ADMIN]

│   │   │       ├── venues/                                 # [NEW-v2]

│   │   │       │   ├── page.tsx                            # lista con mappa

│   │   │       │   ├── new/page.tsx                        # [ADMIN] crea

│   │   │       │   ├── propose/page.tsx                    # [PLAYER] proponi

│   │   │       │   └── [venueId]/page.tsx

│   │   │       ├── availability/                           # [NEW-v2]

│   │   │       │   └── page.tsx                            # calendario collettivo

│   │   │       ├── masters/                                # [NEW-v2]

│   │   │       │   └── page.tsx

│   │   │       └── training/                               # [NEW-v2]

│   │   │           ├── sparring/page.tsx

│   │   │           └── lessons/page.tsx

│   │   ├── matches/...

│   │   ├── sparring/                                       # [NEW-v2]

│   │   │   ├── new/page.tsx                                # dichiara

│   │   │   └── [id]/page.tsx                               # conferma/dettaglio

│   │   ├── lessons/                                        # [NEW-v2]

│   │   │   ├── new/page.tsx                                # dichiara

│   │   │   └── [id]/page.tsx

│   │   ├── availability/                                   # [NEW-v2]

│   │   │   └── page.tsx                                    # mio calendario

│   │   └── notifications/page.tsx

│   └── (admin)/

│       └── dashboard/page.tsx

### 8.2 Pagine Chiave — Specifiche UI
#### 8.2.1 Dashboard Utente (invariato + aggiunte v2)

La dashboard esistente è estesa con:

- Widget "Prossimi slot disponibili" che mostra gli slot della settimana con indicatore di intersezione con altri membri.

- Indicatore semaforico di frequenza personale.

- CTA "Dichiara Sparring" e "Registra allenamento" (se moduli attivi).

- Feed attività che include eventi di Sparring/Master Lesson oltre a partite.

#### 8.2.2 [NEW-v2] Pagina Calendario Disponibilità (/availability)

LAYOUT: vista settimanale + pannello overrides

SEZIONE 1 — Pattern Ricorrente

  Griglia 7 giorni × 24 ore (slot da 1h)

  Drag-to-paint per selezionare slot disponibili

  Toggle "Visibile ai membri della lega" (default ON)

  Pulsante "Salva pattern"

SEZIONE 2 — Override (Date specifiche)

  Lista degli override attivi e futuri

  Pulsante "Aggiungi disponibilità straordinaria" → date+slot

  Pulsante "Blocca periodo" → range date

SEZIONE 3 — Anteprima "prossimi 14 giorni"

  Heatmap con slot liberi/occupati

  Evidenza delle partite/sparring/lezioni già programmate

#### 8.2.3 [NEW-v2] Pagina Frequenza Desiderata

SEZIONE: Profilo membro / impostazioni di lega

INPUT:

  - Unità: [Settimanale | Mensile]

  - Frequenza ideale: slider 1-7

  - Frequenza massima: slider 1-10

  - Preview: "Con queste impostazioni, gli altri vedranno:

              Verde fino a 2 partite, giallo fino a 3, rosso da 4."

DISPLAY NEL PROFILO PUBBLICO DI LEGA:

  Badge semaforo accanto al nome del membro

  Tooltip: "Sotto la frequenza ideale (1/3 questa settimana)"

#### 8.2.4 [NEW-v2] Pagina Anagrafica Campi (/leagues/[id]/venues)

LAYOUT: split desktop (lista + mappa), stack mobile

HEADER:

  - Search bar (nome, indirizzo)

  - Filtri: surface, cover, stato

  - CTA "Aggiungi campo" ([ADMIN]) o "Proponi campo" ([PLAYER])

LISTA (colonna sx):

  Card per ogni Venue con:

    - Nome + indicatore status

    - Indirizzo, superficie, coperto/scoperto

    - Numero campi, prezzo range

    - "Prenota" (link esterno), "Chiama" (tel:), "Indicazioni" (maps:)

    - ★ aggiungi/rimuovi ai favoriti

MAPPA (colonna dx):

  Mapbox GL con pin per ogni venue attivo

  Click pin → focus card corrispondente

PER ADMIN — sezione extra in alto:

  Banner "Proposte in attesa (3)" → vista dedicata per approvazione

#### 8.2.5 [NEW-v2] Flusso Sparring

PAGINA "Dichiara Sparring" (/sparring/new):

  - Step 1: seleziona avversario (lista membri lega attivi)

  - Step 2: data/ora (con suggerimenti da calendario intersezione)

  - Step 3: venue (dropdown da anagrafica)

  - Step 4: note opzionali (focus tecnico)

  - Validation client: verifica cap settimanale (chiamata HEAD API)

PAGINA DETTAGLIO (/sparring/:id):

  - Stati:

    PENDING_VALIDATION (per chi ha dichiarato): "In attesa di conferma"

    PENDING_VALIDATION (per P2): CTA "Conferma" o "Rifiuta"

    VALIDATED: card con esito "+12 punti a testa"

    REJECTED/DISPUTED: motivazione + eventuale CTA contestazione

#### 8.2.6 [NEW-v2] Flusso Allenamento con Maestro

PAGINA "Dichiara allenamento" (/lessons/new):

  - Step 1: seleziona maestro (lista MASTER della lega con avatar/bio)

  - Step 2: data/ora, durata opzionale, focus note

  - Step 3: venue (opzionale)

  - Conferma: dichiarazione va al maestro per validazione

PAGINA DETTAGLIO (/lessons/:id):

  - Per giocatore: stato validazione

  - Per maestro: CTA "Valida" / "Rifiuta"

  - Post-validazione: XP ricevuti, progresso verso prossimo livello globale

PANNELLO MAESTRO (/leagues/:id/masters):

  - Lista lezioni da validare

  - Statistiche personali (totale validate, badge Mentor)

#### 8.2.7 [NEW-v2] Smart Match Panel nel flusso sfida

COMPONENTE: SmartMatchSuggestionsPanel

Posizione: pagina "Cerca avversario" o dashboard stagione

Per ogni candidato mostra:

  - Avatar, nome, livello

  - Score 0-100 (barra colorata)

  - Breakdown espandibile:

      Compatibilità livello: ##/100

      Diversificazione: ##/100

      Disponibilità: ##/100

      Frequenza: semaforo

      Distanza: ##/100 (se geo attivo)

  - 2-3 slot suggeriti (cliccabili per pre-compilare sfida)

  - Badge "Nuovo avversario" / "Partita n/N in stagione"

## 9. Sistema i18n
### 9.1 Struttura File Traduzioni (estesa)

I file en.json e it.json sono estesi con nuove chiavi per i moduli introdotti. Esempio delle nuove chiavi:

```json
{
  "sparring": {
    "title": "Sparring Session",
    "declare": "Declare sparring",
    "confirm": "Confirm sparring",
    "reject": "Reject",
    "capReached": "Weekly sparring cap reached",
    "awarded": "{points} points awarded to each player"
  },
  "masterLesson": {
    "title": "Master Lesson",
    "declare": "Declare lesson",
    "validate": "Validate lesson",
    "xpAwarded": "{xp} experience points awarded",
    "masterRole": {
      "PURE": "Master only",
      "HYBRID": "Player + Master"
    }
  },
  "availability": {
    "pattern": "Recurring availability",
    "override": "Override specific date",
    "addSlot": "Add slot",
    "blockPeriod": "Block period",
    "visibleToLeague": "Visible to league members"
  },
  "frequency": {
    "title": "Desired frequency",
    "ideal": "Ideal per {unit}",
    "max": "Max per {unit}",
    "status": {
      "GREEN": "Available for matches",
      "YELLOW": "Reached ideal frequency",
      "RED": "Fully booked this {unit}",
      "UNKNOWN": "Frequency not set"
    }
  },
  "venues": {
    "title": "Venues",
    "add": "Add venue",
    "propose": "Propose venue",
    "surface": {
      "CLAY": "Clay",
      "HARD": "Hard court",
      "GRASS": "Grass",
      "SYNTHETIC": "Synthetic",
      "OTHER": "Other"
    },
    "cover": {
      "INDOOR": "Indoor",
      "OUTDOOR": "Outdoor",
      "MIXED": "Mixed"
    },
    "bookingAction": "Book on external site"
  },
  "matchmaking": {
    "suggestions": "Suggested opponents",
    "score": "Match score",
    "breakdown": {
      "level": "Level compatibility",
      "diversity": "Diversification bonus",
      "availability": "Calendar overlap",
      "frequency": "Opponent availability",
      "geo": "Geographic proximity"
    }
  }
}
```

## 10. Monetizzazione — Architettura Predisposta
### 10.1 Feature Flags per Tier (aggiornato)

```typescript
// packages/shared-types/src/features.ts
export const FEATURE_FLAGS = {
  // FREE
  CREATE_LEAGUE: 'create_league',
  JOIN_LEAGUES: 'join_leagues',
  BASIC_STATS: 'basic_stats',
  BASIC_RANKING: 'basic_ranking',
  // FREE [NEW-v2] — disponibili anche in tier gratuito
  SPARRING: 'sparring',
  AVAILABILITY_BASIC: 'availability_basic',
  FREQUENCY: 'frequency',
  VENUES_BASIC: 'venues_basic',

  // PREMIUM USER
  CREATE_UNLIMITED_LEAGUES: 'create_unlimited_leagues',
  JOIN_UNLIMITED_LEAGUES: 'join_unlimited_leagues',
  ADVANCED_STATS: 'advanced_stats',
  EXPORT_STATS: 'export_stats',
  NO_ADS: 'no_ads',
  PRIORITY_MATCHMAKING: 'priority_matchmaking',
  // PREMIUM USER [NEW-v2]
  CALENDAR_EXTERNAL_SYNC: 'calendar_external_sync',  // Google Cal / Outlook

  // PREMIUM LEAGUE
  LEAGUE_PLAYOFFS: 'league_playoffs',
  LEAGUE_CUSTOM_SCORING: 'league_custom_scoring',
  LEAGUE_GEO_VERIFICATION: 'league_geo_verification',
  LEAGUE_ADVANCED_ANTICHEAT: 'league_advanced_anticheat',
  LEAGUE_EXPORT: 'league_export',
  LEAGUE_UNLIMITED_MEMBERS: 'league_unlimited_members',
  // PREMIUM LEAGUE [NEW-v2]
  LEAGUE_MASTER_MODULE: 'league_master_module',     // abilita Master Lessons
  LEAGUE_VENUES_ADVANCED: 'league_venues_advanced', // geocoding automatico, mappa completa

  // ADS
  SHOW_ADS: 'show_ads',
} as const;
```

### 10.2 Posizionamento Advertising

> **[CRITICAL] **Gli annunci non devono mai apparire durante flussi critici. Lista aggiornata v2: inserimento risultato, disputa, validazione Sparring, validazione Master Lesson, creazione/proposta Venue.

Posizioni consentite (invariate + 1 aggiunta):

- Banner nella sidebar del dashboard (desktop).

- Card interstitial tra la lista partite (mobile, 1 ogni 5 elementi).

- Banner nella pagina classifica (sotto la top 3).

- Nessun ad nelle pagine dettaglio TrainingSession.

- Nessun ad nella pagina anagrafica Venue (l'area contiene link esterni e già è cluttered).

## 11. Design System Apple-Inspired

Invariato rispetto alla v1.0. Si aggiungono token per le nuove componenti UI:

### 11.1 Nuovi Token [NEW-v2]

```typescript
// packages/ui/src/tokens.ts (aggiunte v2)
export const tokens = {
  // ... token v1.0 invariati
  colors: {
    // ...
    frequency: {
      GREEN:  '#34C759',  // SystemGreen iOS
      YELLOW: '#FFCC00',  // SystemYellow iOS
      RED:    '#FF3B30',  // SystemRed iOS
      UNKNOWN:'#8E8E93',
    },
    training: {
      SPARRING: '#5AC8FA',       // SystemTeal
      MASTER_LESSON: '#BF5AF2',  // SystemPurple
    },
    venue: {
      ACTIVE: '#34C759',
      PENDING: '#FF9500',
      ARCHIVED: '#8E8E93',
    }
  },
} as const;
```

### 11.2 Nuovi Componenti Base

- FrequencyBadge: pallino colorato + label. Props: status, compact.

- AvailabilityGrid: griglia 7×24 drag-selectable. Props: slots, onChange, readOnly.

- VenueCard: card con hero image opzionale, indirizzo, superficie, cover badge, CTA prenotazione.

- VenueMapPin: marker Mapbox stilizzato coerente con palette iOS.

- TrainingSessionBadge: chip colorato per SPARRING o MASTER_LESSON.

- CandidateScoreRow: riga per Smart Match con barra di score, breakdown espandibile, CTA sfida rapida.

## 12. Ordine di Sviluppo e Prompt Suggeriti
### 12.1 Sprint di Sviluppo (aggiornata)

La roadmap è estesa da 6 a 7 sprint per integrare i nuovi moduli. Gli sprint 1-4 restano sostanzialmente invariati (con estensioni schema nel 1); si aggiungono due sprint dedicati ai nuovi moduli prima dello sprint finale di rifinitura.

### Sprint 1 — Fondamenta (2 settimane)

- Setup monorepo (Turborepo + workspaces).

- Setup Supabase (DB, Auth, Storage).

- Schema Prisma completo v2.0 + prime migration (include tutti i nuovi modelli).

- NestJS boilerplate + modulo Auth.

- Next.js boilerplate + routing i18n + design tokens (inclusi token v2).

### Sprint 2 — Utenti e Leghe (2 settimane)

- CRUD Utenti + onboarding flow.

- CRUD Leghe (crea, invita, entra con codice).

- UI: profilo utente, lista leghe, dettaglio lega.

### Sprint 3 — Stagioni e Partite (3 settimane)

- CRUD Stagioni + calcolo durata ottimale.

- Flusso sfida completo (invio → accettazione → scheduling).

- Registrazione risultato + doppia validazione.

- Sistema disputa base.

- UI: dashboard stagione, lista partite, inserimento risultato.

### Sprint 4 — Scoring Engine (2 settimane)

- Package scoring-engine completo con tutti i componenti.

- Test unitari (copertura > 90%).

- Integrazione con BullMQ + worker asincrono.

- UI: breakdown punti per partita, classifica live.

### Sprint 5 [NEW-v2] — Calendario, Frequenza, Anagrafica Campi (3 settimane)

- Modelli Prisma: AvailabilityPattern, AvailabilityOverride, PlayerFrequencyPreference, Venue, VenueProposal, PlayerFavoriteVenue.

- Moduli API: availability, frequency, venues.

- Package matchmaking-engine completo con test.

- UI: pagina calendario disponibilità, pagina frequenza, pagina anagrafica campi con mappa Mapbox.

- Integrazione del venueId nel flusso partita esistente.

- Smart Match Panel nel flusso sfida.

### Sprint 6 [NEW-v2] — Training Module: Sparring + Master Lesson (2 settimane)

- Modelli Prisma: TrainingSession, MasterProfile, estensione MemberRole.

- Moduli API: training-sessions, masters.

- Package training-engine completo con test.

- BullMQ processor dedicato (training.processor).

- UI: flusso sparring (dichiara/conferma), flusso master lesson (dichiara/valida), pannello maestro.

- Badge Compagno di Banco, Studioso, Dedicato, Mentor.

### Sprint 7 — Gamification, Admin e Rifinitura (2 settimane)

- Sistema achievement + badge (copre anche i badge v2).

- Sistema notifiche (in-app + email) incluso tutti i nuovi tipi NotificationType.

- WebSocket per aggiornamenti live classifica.

- Anti-frode: pattern detection + reputazione (inclusi pattern sparring anomali).

- Dashboard admin lega con gestione maestri, proposte venue, monitoring sparring.

- Feature flags + predisposizione monetizzazione.

- Ottimizzazione performance (caching Redis per matchmaking).

- Testing E2E + bug fixing.

### 12.2 Prompt Suggeriti per Claude / Cursor

**Prompt Sprint 1 (aggiornato):**

"Sei un esperto sviluppatore TypeScript full-stack. Stiamo costruendo [NOME APP],

 un portale per leghe tennis amatoriali (Analisi Funzionale v2.0).

 Stack: Next.js 14, NestJS, Prisma, Supabase, Turborepo.

 Genera il setup completo del monorepo con Turborepo includendo:

   - apps/web (Next.js 14 App Router, TypeScript strict, Tailwind)

   - apps/api (NestJS con Prisma)

   - packages/db (schema Prisma v2.0 — allego schema completo)

   - packages/scoring-engine (scaffold)

   - packages/training-engine (scaffold) [NUOVO]

   - packages/matchmaking-engine (scaffold) [NUOVO]

   - packages/shared-types

   - packages/ui

 Configura anche: ESLint, Prettier, path aliases, variabili d'ambiente."

**Prompt Sprint 5 (Matchmaking + Venues + Availability):**

"Implementa i seguenti moduli backend NestJS secondo le specifiche allegate:

  1. availability/ (CRUD pattern + overrides, policy RLS visibilità lega)

  2. frequency/ (CRUD preferenze, endpoint pubblico con solo status semaforo)

  3. venues/ (CRUD + proposte giocatori con validazione admin, geocoding Mapbox)

  4. matchmaking/ (endpoint /candidates che usa matchmaking-engine)

 Includi DTO con class-validator, test Jest e Supertest per ogni modulo.

 Implementa anche il package matchmaking-engine con tutti gli scorers e test unitari."

**Prompt Sprint 6 (Training):**

"Implementa il package training-engine in TypeScript puro (zero dipendenze):

  - sparring.ts con calculateSparring() che rispetta il cap settimanale

  - masterLesson.ts con calculateMasterLesson() e curva XP diminishing returns

  - capChecker.ts con getIsoWeekBounds() su date-fns

 Allegati: types.ts, specifiche §5 del Documento 2 v2.0.

 Includi test unitari con copertura > 95%.

 Parallelamente implementa moduli API training-sessions/ e masters/ secondo §7.3.

 [CRITICAL] verifica via test di integrazione che il training.processor NON

 modifichi mai ScoreDelta, HeadToHead, matchesLast4Weeks o winStreak."

## 13. Riepilogo Decisioni Architetturali Finali

| **Decisione** | **Scelta** | **Motivazione** |
| --- | --- | --- |
| **Monorepo** | Turborepo | Condivisione tipi, engine isolati |
| **DB** | Supabase / PostgreSQL | Auth + DB + Storage in uno, free tier |
| **Scoring** | Package isolato | Testabilità, portabilità, determinismo |
| **Training engine** | Package separato [NEW-v2] | Isola la logica non-competitiva dal ranking |
| **Matchmaking engine** | Package separato [NEW-v2] | Algoritmo complesso, facilmente A/B testable |
| **Real-time** | WebSocket (Socket.io) | Classifica live senza polling |
| **Queue** | BullMQ | Calcolo asincrono, retry automatici |
| **i18n** | next-intl | Supporto EN/IT ora, estendibile |
| **Feature flags** | Growthbook | Open source, self-hosted, zero costo |
| **Pagamenti** | Stripe (passivo MVP) | Standard industria, attivazione futura |
| **Modulo doppio/Padel** | Post-MVP modulare | Non blocca MVP, architettura predisposta |
| **Playoff** | Post-MVP | Priorità ad altro, schema predisposto |
| **Sparring** | Entità TrainingSession [NEW-v2] | Separata da Match, +12 pt fissi, cap settimanale |
| **Master Lessons** | XP globali [NEW-v2] | Validazione unilaterale maestro, curva rendimenti decrescenti |
| **Ruolo Maestro** | MemberRole.MASTER + MasterMode [NEW-v2] | Ibrido (HYBRID) o puro (PURE) |
| **Calendario** | Pattern + Override [NEW-v2] | Slot granularità 1h, visibilità lega |
| **Frequenza desiderata** | Entity + semaforo [NEW-v2] | Public-safe indicator, privacy nei numeri |
| **Anagrafica Campi** | Venue scoped per lega [NEW-v2] | Zero anagrafica globale; proposte con validazione admin |
| **Geocoding** | Mapbox [NEW-v2] | Free tier generoso, API REST semplice |

*Le righe evidenziate rappresentano le decisioni architetturali introdotte nella revisione 2.0.*

*Fine del Documento 2 — Specifiche di Sviluppo v2.0. Da utilizzarsi in abbinamento al Documento 1 (Analisi Funzionale v2.0) per avere il quadro completo del progetto.*
