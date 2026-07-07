import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { LeagueModule } from './leagues/league.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SeasonModule } from './seasons/season.module';
import { MatchesModule } from './matches/matches.module';
import { ScoringModule } from './scoring/scoring.module';
import { AvailabilityModule } from './availability/availability.module';
import { FrequencyModule } from './frequency/frequency.module';
import { VenuesModule } from './venues/venues.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { TrainingSessionsModule } from './training-sessions/training-sessions.module';
import { MastersModule } from './masters/masters.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AchievementsModule } from './achievements/achievements.module';
import { AdminModule } from './admin/admin.module';
import { CommonModule } from './common/common.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    AuthModule,
    UserModule,
    LeagueModule,
    OnboardingModule,
    SeasonModule,
    MatchesModule,
    ScoringModule,
    AvailabilityModule,
    FrequencyModule,
    VenuesModule,
    MatchmakingModule,
    TrainingSessionsModule,
    MastersModule,
    NotificationsModule,
    AchievementsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
