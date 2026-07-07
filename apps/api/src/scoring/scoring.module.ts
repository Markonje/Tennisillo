import { Module } from '@nestjs/common';
import { AchievementsModule } from '../achievements/achievements.module';
import { ScoringService } from './scoring.service';
import { ScoringQueueService } from './scoring-queue.service';
import { ScoringWorker } from './scoring.worker';

@Module({
  imports: [AchievementsModule],
  providers: [ScoringService, ScoringQueueService, ScoringWorker],
  exports: [ScoringService, ScoringQueueService],
})
export class ScoringModule {}
