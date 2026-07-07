import { Module } from '@nestjs/common';
import { ScoringModule } from '../scoring/scoring.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { MatchQueueService } from './match-queue.service';
import { MatchAutoConfirmWorker } from './match-auto-confirm.worker';
import { MatchLeagueAdminGuard } from './guards/match-league-admin.guard';

@Module({
  imports: [ScoringModule, NotificationsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchQueueService, MatchAutoConfirmWorker, MatchLeagueAdminGuard],
  exports: [MatchesService],
})
export class MatchesModule {}
