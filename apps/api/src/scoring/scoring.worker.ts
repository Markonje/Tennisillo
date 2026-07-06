import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { parseRedisUrl } from '../matches/match-queue.service';
import { ScoringService } from './scoring.service';
import {
  DECAY_SWEEP_JOB,
  SCORE_MATCH_JOB,
  SCORING_QUEUE,
  ScoringQueueService,
} from './scoring-queue.service';

/**
 * BullMQ worker for the scoring queue (specs/02 §7.4). Skips startup when
 * Redis is not configured — ScoringQueueService then runs jobs inline.
 */
@Injectable()
export class ScoringWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ScoringWorker.name);
  private worker: Worker | null = null;

  constructor(
    private readonly scoring: ScoringService,
    private readonly queue: ScoringQueueService,
  ) {}

  onModuleInit(): void {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return;

    try {
      this.worker = new Worker(
        SCORING_QUEUE,
        async (job) => {
          if (job.name === SCORE_MATCH_JOB) {
            const { matchId } = job.data as { matchId: string };
            await this.scoring.processValidatedMatch(matchId);
          } else if (job.name === DECAY_SWEEP_JOB) {
            const applied = await this.scoring.runDecaySweep();
            this.logger.log(`Decay sweep applied to ${applied} players`);
          }
        },
        { connection: { ...parseRedisUrl(redisUrl), maxRetriesPerRequest: null } },
      );
      this.worker.on('error', () => {
        // connection noise while Redis is unreachable; inline fallback covers scoring
      });
      void this.queue.scheduleWeeklyDecaySweep();
    } catch (err) {
      this.logger.warn(`Scoring worker not started: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close().catch(() => undefined);
  }
}
