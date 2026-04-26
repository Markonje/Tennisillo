-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'USER');

-- CreateEnum
CREATE TYPE "LeagueType" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "LeagueSport" AS ENUM ('TENNIS_SINGLES', 'TENNIS_DOUBLES', 'TENNIS_BOTH', 'PADEL');

-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MODERATOR', 'PLAYER', 'GUEST', 'MASTER');

-- CreateEnum
CREATE TYPE "MasterMode" AS ENUM ('PURE', 'HYBRID');

-- CreateEnum
CREATE TYPE "SeasonStatus" AS ENUM ('DRAFT', 'REGISTRATION', 'ACTIVE', 'PLAYOFFS', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING_ACCEPTANCE', 'SCHEDULED', 'PENDING_RESULT', 'PENDING_VALIDATION', 'DISPUTED', 'VALIDATED', 'CANCELLED', 'WALKOVER');

-- CreateEnum
CREATE TYPE "MatchFormat" AS ENUM ('BEST_OF_1', 'BEST_OF_3', 'SUPER_TIEBREAK', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PlayerLevel" AS ENUM ('ROOKIE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ELITE');

-- CreateEnum
CREATE TYPE "TrainingSessionType" AS ENUM ('SPARRING', 'MASTER_LESSON');

-- CreateEnum
CREATE TYPE "TrainingSessionStatus" AS ENUM ('PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'DISPUTED', 'REVOKED');

-- CreateEnum
CREATE TYPE "VenueStatus" AS ENUM ('ACTIVE', 'PENDING_VALIDATION', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VenueSurface" AS ENUM ('CLAY', 'HARD', 'GRASS', 'SYNTHETIC', 'OTHER');

-- CreateEnum
CREATE TYPE "VenueCover" AS ENUM ('INDOOR', 'OUTDOOR', 'MIXED');

-- CreateEnum
CREATE TYPE "FrequencyUnit" AS ENUM ('WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "AvailabilityOverrideType" AS ENUM ('AVAILABLE', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CHALLENGE_RECEIVED', 'CHALLENGE_ACCEPTED', 'CHALLENGE_DECLINED', 'MATCH_REMINDER', 'RESULT_PENDING_VALIDATION', 'RESULT_VALIDATED', 'DISPUTE_OPENED', 'DISPUTE_RESOLVED', 'RANKING_CHANGE', 'SEASON_STARTING', 'SEASON_ENDING', 'BADGE_EARNED', 'LEAGUE_INVITE', 'SPARRING_PENDING_CONFIRM', 'SPARRING_CONFIRMED', 'MASTER_LESSON_PENDING_VALIDATION', 'MASTER_LESSON_VALIDATED', 'MASTER_LESSON_REJECTED', 'VENUE_PROPOSAL_RECEIVED', 'VENUE_PROPOSAL_APPROVED', 'SPARRING_CAP_REACHED', 'AVAILABILITY_MATCH_FOUND');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "city" TEXT,
    "birthYear" INTEGER,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "subscriptionExpiresAt" TIMESTAMP(3),
    "globalRating" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "globalLevel" "PlayerLevel" NOT NULL DEFAULT 'ROOKIE',
    "globalExperiencePoints" INTEGER NOT NULL DEFAULT 0,
    "reputationScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "preferredLocale" TEXT NOT NULL DEFAULT 'en',
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "type" "LeagueType" NOT NULL DEFAULT 'PRIVATE',
    "sport" "LeagueSport" NOT NULL DEFAULT 'TENNIS_SINGLES',
    "ownerId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueMember" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'PLAYER',
    "masterMode" "MasterMode",
    "masterBio" TEXT,
    "isAlsoPlayer" BOOLEAN NOT NULL DEFAULT false,
    "nickname" TEXT,
    "bio" TEXT,
    "homeVenueId" TEXT,
    "leagueRating" DOUBLE PRECISION NOT NULL DEFAULT 1500,
    "leagueLevel" "PlayerLevel" NOT NULL DEFAULT 'ROOKIE',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LeagueMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeagueSettings" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "defaultMatchFormat" "MatchFormat" NOT NULL DEFAULT 'BEST_OF_3',
    "allowCustomFormat" BOOLEAN NOT NULL DEFAULT false,
    "defaultPointsWin" INTEGER NOT NULL DEFAULT 100,
    "defaultPointsLoss" INTEGER NOT NULL DEFAULT 30,
    "defaultLevelMultiplier" TEXT NOT NULL DEFAULT 'NORMAL',
    "defaultBonusConsistency" BOOLEAN NOT NULL DEFAULT true,
    "defaultBonusDiversity" BOOLEAN NOT NULL DEFAULT true,
    "defaultHeadToHead" BOOLEAN NOT NULL DEFAULT true,
    "defaultDecayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "geoVerificationEnabled" BOOLEAN NOT NULL DEFAULT false,
    "geoVerificationRadius" INTEGER NOT NULL DEFAULT 500,
    "resultWindowHours" INTEGER NOT NULL DEFAULT 12,
    "autoConfirmHours" INTEGER NOT NULL DEFAULT 24,
    "reminderHoursBefore" INTEGER[] DEFAULT ARRAY[24, 2]::INTEGER[],
    "sparringEnabled" BOOLEAN NOT NULL DEFAULT true,
    "sparringPointsPerPlayer" INTEGER NOT NULL DEFAULT 12,
    "sparringWeeklyCapPerPlayer" INTEGER NOT NULL DEFAULT 2,
    "masterLessonsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "masterXpPerSession" INTEGER NOT NULL DEFAULT 20,
    "venuesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "allowPlayerVenueProposals" BOOLEAN NOT NULL DEFAULT true,
    "availabilityEnabled" BOOLEAN NOT NULL DEFAULT true,
    "frequencyPreferenceEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultFrequencyUnit" "FrequencyUnit" NOT NULL DEFAULT 'WEEKLY',

    CONSTRAINT "LeagueSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "maxPlayers" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonSettings" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "pointsWin" INTEGER NOT NULL DEFAULT 100,
    "pointsLoss" INTEGER NOT NULL DEFAULT 30,
    "levelMultiplierMode" TEXT NOT NULL DEFAULT 'NORMAL',
    "bonusConsistencyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "bonusDiversityEnabled" BOOLEAN NOT NULL DEFAULT true,
    "headToHeadEnabled" BOOLEAN NOT NULL DEFAULT true,
    "decayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "decayRateWeek2" INTEGER NOT NULL DEFAULT 0,
    "decayRateWeek3" INTEGER NOT NULL DEFAULT 5,
    "decayRateWeek4" INTEGER NOT NULL DEFAULT 15,
    "decayRateWeek5Plus" INTEGER NOT NULL DEFAULT 25,
    "pairLimitOverride" INTEGER,
    "h2hCooldownDays" INTEGER NOT NULL DEFAULT 7,
    "resultWindowHours" INTEGER NOT NULL DEFAULT 12,
    "autoConfirmHours" INTEGER NOT NULL DEFAULT 24,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeasonSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonPlayer" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "currentPoints" INTEGER NOT NULL DEFAULT 0,
    "currentRank" INTEGER,
    "matchesPlayed" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "isEligible" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonRanking" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "challengerId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING_ACCEPTANCE',
    "format" "MatchFormat" NOT NULL DEFAULT 'BEST_OF_3',
    "scheduledAt" TIMESTAMP(3),
    "venueId" TEXT,
    "venueTextFallback" TEXT,
    "completedAt" TIMESTAMP(3),
    "resultWindowExpiresAt" TIMESTAMP(3),
    "pairCount" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchResult" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "sets" JSONB NOT NULL,
    "winnerId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "plausibilityPassed" BOOLEAN NOT NULL DEFAULT true,
    "plausibilityNotes" TEXT,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchValidation" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "validatedById" TEXT NOT NULL,
    "validatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "autoValidated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "MatchValidation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "status" "DisputeStatus" NOT NULL DEFAULT 'OPEN',
    "openedById" TEXT NOT NULL,
    "resolvedById" TEXT,
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreDelta" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "deltaPoints" INTEGER NOT NULL,
    "breakdown" JSONB NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreDelta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeadToHead" (
    "id" TEXT NOT NULL,
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "lastMatchAt" TIMESTAMP(3),

    CONSTRAINT "HeadToHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingSession" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "seasonId" TEXT,
    "type" "TrainingSessionType" NOT NULL,
    "status" "TrainingSessionStatus" NOT NULL DEFAULT 'PENDING_VALIDATION',
    "player1Id" TEXT NOT NULL,
    "player2Id" TEXT,
    "masterId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "durationMinutes" INTEGER,
    "focusNote" TEXT,
    "venueId" TEXT,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "validatedById" TEXT,
    "validatedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "revokedById" TEXT,
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MasterProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "certifications" TEXT[],
    "yearsOfExperience" INTEGER,
    "specializations" TEXT[],
    "totalLessonsValidated" INTEGER NOT NULL DEFAULT 0,
    "activeSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MasterProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityPattern" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "slots" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityPattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AvailabilityOverride" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "type" "AvailabilityOverrideType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AvailabilityOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerFrequencyPreference" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "idealFrequency" INTEGER NOT NULL,
    "maxFrequency" INTEGER NOT NULL,
    "unit" "FrequencyUnit" NOT NULL DEFAULT 'WEEKLY',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerFrequencyPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venue" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "status" "VenueStatus" NOT NULL DEFAULT 'ACTIVE',
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "surface" "VenueSurface",
    "cover" "VenueCover",
    "courtCount" INTEGER,
    "bookingUrl" TEXT,
    "phone" TEXT,
    "priceRangeLow" INTEGER,
    "priceRangeHigh" INTEGER,
    "notes" TEXT,
    "createdById" TEXT,
    "approvedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VenueProposal" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "venueId" TEXT,
    "proposedById" TEXT NOT NULL,
    "proposedData" JSONB NOT NULL,
    "status" "VenueStatus" NOT NULL DEFAULT 'PENDING_VALIDATION',
    "reviewedById" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "VenueProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerFavoriteVenue" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "venueId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PlayerFavoriteVenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "badgeUrl" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "leagueId" TEXT,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "payload" JSONB NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "seasonId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserOnboarding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "skillLevel" "PlayerLevel",
    "birthYear" INTEGER,
    "city" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOnboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeCustomer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseId_key" ON "User"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "League_slug_key" ON "League"("slug");

-- CreateIndex
CREATE INDEX "League_slug_idx" ON "League"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueMember_leagueId_userId_key" ON "LeagueMember"("leagueId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LeagueSettings_leagueId_key" ON "LeagueSettings"("leagueId");

-- CreateIndex
CREATE INDEX "Season_leagueId_status_idx" ON "Season"("leagueId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonSettings_seasonId_key" ON "SeasonSettings"("seasonId");

-- CreateIndex
CREATE INDEX "SeasonPlayer_seasonId_currentRank_idx" ON "SeasonPlayer"("seasonId", "currentRank");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonPlayer_seasonId_memberId_key" ON "SeasonPlayer"("seasonId", "memberId");

-- CreateIndex
CREATE INDEX "SeasonRanking_seasonId_computedAt_idx" ON "SeasonRanking"("seasonId", "computedAt");

-- CreateIndex
CREATE INDEX "Match_seasonId_idx" ON "Match"("seasonId");

-- CreateIndex
CREATE INDEX "Match_player1Id_player2Id_idx" ON "Match"("player1Id", "player2Id");

-- CreateIndex
CREATE UNIQUE INDEX "MatchResult_matchId_key" ON "MatchResult"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "MatchValidation_matchId_key" ON "MatchValidation"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Dispute_matchId_key" ON "Dispute"("matchId");

-- CreateIndex
CREATE INDEX "ScoreDelta_matchId_idx" ON "ScoreDelta"("matchId");

-- CreateIndex
CREATE INDEX "ScoreDelta_playerId_idx" ON "ScoreDelta"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "HeadToHead_player1Id_player2Id_seasonId_key" ON "HeadToHead"("player1Id", "player2Id", "seasonId");

-- CreateIndex
CREATE INDEX "TrainingSession_leagueId_type_idx" ON "TrainingSession"("leagueId", "type");

-- CreateIndex
CREATE INDEX "TrainingSession_seasonId_idx" ON "TrainingSession"("seasonId");

-- CreateIndex
CREATE INDEX "TrainingSession_player1Id_idx" ON "TrainingSession"("player1Id");

-- CreateIndex
CREATE INDEX "TrainingSession_masterId_idx" ON "TrainingSession"("masterId");

-- CreateIndex
CREATE UNIQUE INDEX "MasterProfile_userId_key" ON "MasterProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AvailabilityPattern_memberId_key" ON "AvailabilityPattern"("memberId");

-- CreateIndex
CREATE INDEX "AvailabilityOverride_memberId_startsAt_idx" ON "AvailabilityOverride"("memberId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerFrequencyPreference_memberId_key" ON "PlayerFrequencyPreference"("memberId");

-- CreateIndex
CREATE INDEX "Venue_leagueId_status_idx" ON "Venue"("leagueId", "status");

-- CreateIndex
CREATE INDEX "Venue_leagueId_latitude_longitude_idx" ON "Venue"("leagueId", "latitude", "longitude");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerFavoriteVenue_memberId_venueId_key" ON "PlayerFavoriteVenue"("memberId", "venueId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerFavoriteVenue_memberId_priority_key" ON "PlayerFavoriteVenue"("memberId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_idx" ON "UserAchievement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_userId_achievementId_leagueId_key" ON "UserAchievement"("userId", "achievementId", "leagueId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Announcement_leagueId_idx" ON "Announcement"("leagueId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOnboarding_userId_key" ON "UserOnboarding"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_userId_key" ON "StripeCustomer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StripeCustomer_stripeCustomerId_key" ON "StripeCustomer"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "League" ADD CONSTRAINT "League_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_homeVenueId_fkey" FOREIGN KEY ("homeVenueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueSettings" ADD CONSTRAINT "LeagueSettings_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonSettings" ADD CONSTRAINT "SeasonSettings_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonPlayer" ADD CONSTRAINT "SeasonPlayer_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonPlayer" ADD CONSTRAINT "SeasonPlayer_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonRanking" ADD CONSTRAINT "SeasonRanking_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonRanking" ADD CONSTRAINT "SeasonRanking_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "SeasonPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "SeasonPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "SeasonPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchResult" ADD CONSTRAINT "MatchResult_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchValidation" ADD CONSTRAINT "MatchValidation_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreDelta" ADD CONSTRAINT "ScoreDelta_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoreDelta" ADD CONSTRAINT "ScoreDelta_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "SeasonPlayer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadToHead" ADD CONSTRAINT "HeadToHead_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadToHead" ADD CONSTRAINT "HeadToHead_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeadToHead" ADD CONSTRAINT "HeadToHead_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_player1Id_fkey" FOREIGN KEY ("player1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_player2Id_fkey" FOREIGN KEY ("player2Id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_masterId_fkey" FOREIGN KEY ("masterId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingSession" ADD CONSTRAINT "TrainingSession_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MasterProfile" ADD CONSTRAINT "MasterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityPattern" ADD CONSTRAINT "AvailabilityPattern_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AvailabilityOverride" ADD CONSTRAINT "AvailabilityOverride_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerFrequencyPreference" ADD CONSTRAINT "PlayerFrequencyPreference_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venue" ADD CONSTRAINT "Venue_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueProposal" ADD CONSTRAINT "VenueProposal_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VenueProposal" ADD CONSTRAINT "VenueProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerFavoriteVenue" ADD CONSTRAINT "PlayerFavoriteVenue_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "LeagueMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerFavoriteVenue" ADD CONSTRAINT "PlayerFavoriteVenue_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "Venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserOnboarding" ADD CONSTRAINT "UserOnboarding_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeCustomer" ADD CONSTRAINT "StripeCustomer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
