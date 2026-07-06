import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { LeagueModule } from './leagues/league.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SeasonModule } from './seasons/season.module';
import { MatchesModule } from './matches/matches.module';
import { CommonModule } from './common/common.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [PrismaModule, CommonModule, AuthModule, UserModule, LeagueModule, OnboardingModule, SeasonModule, MatchesModule],
  controllers: [HealthController],
})
export class AppModule {}
