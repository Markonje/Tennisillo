import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { ScoringQueueService } from './scoring-queue.service';
import { ScoringWorker } from './scoring.worker';

@Module({
  providers: [ScoringService, ScoringQueueService, ScoringWorker],
  exports: [ScoringService, ScoringQueueService],
})
export class ScoringModule {}
