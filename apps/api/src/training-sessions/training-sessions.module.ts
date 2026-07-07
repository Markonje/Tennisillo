import { Module } from '@nestjs/common';
import { ScoringModule } from '../scoring/scoring.module';
import { TrainingSessionsController } from './training-sessions.controller';
import { TrainingSessionsService } from './training-sessions.service';
import { SessionLeagueAdminGuard } from './guards/session-league-admin.guard';

@Module({
  imports: [ScoringModule],
  controllers: [TrainingSessionsController],
  providers: [TrainingSessionsService, SessionLeagueAdminGuard],
  exports: [TrainingSessionsService],
})
export class TrainingSessionsModule {}
