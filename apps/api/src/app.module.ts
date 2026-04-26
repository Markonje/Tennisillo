import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './users/user.module';
import { LeagueModule } from './leagues/league.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { HealthController } from './health/health.controller';
import { MeController } from './me/me.controller';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, LeagueModule, OnboardingModule],
  controllers: [HealthController, MeController],
})
export class AppModule {}
