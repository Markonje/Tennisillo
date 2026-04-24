import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { MeController } from './me/me.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HealthController, MeController],
})
export class AppModule {}
