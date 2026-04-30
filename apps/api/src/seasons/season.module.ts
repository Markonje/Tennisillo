import { Module } from '@nestjs/common';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { AuthModule } from '../auth/auth.module';
import { LeagueAdminGuard } from './guards/league-admin.guard';
import { SeasonAdminGuard } from './guards/season-admin.guard';

@Module({
  imports: [AuthModule],
  controllers: [SeasonController],
  providers: [SeasonService, LeagueAdminGuard, SeasonAdminGuard],
  exports: [SeasonService],
})
export class SeasonModule {}
