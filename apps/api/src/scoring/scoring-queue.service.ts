import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import { parseRedisUrl } from '../matches/match-queue.service';
import { ScoringService } from './scoring.service';

export const SCORING_QUEUE = 'scoring';
export const SCORE_MATCH_JOB = 'score-match';
export const DECAY_SWEEP_JOB = 'decay-sweep';

/**
 * Async scoring flow (specs/02 §7.4): validated matches are scored by a
 * BullMQ worker. When Redis is unavailable the job runs INLINE so the
 * ranking is always consistent — the engine is pure and fast, so the
 * synchronous fallback is safe.
 */
@Injectable()
export class ScoringQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(ScoringQueueService.name);
  private queue: Queue | null = null;
  private warned = false;

  constructor(private readonly scoring: ScoringService) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set — scoring runs inline (no async worker)');
      return;
    }
    try {
      this.queue = new Queue(SCORING_QUEUE, {
        connection: { ...parseRedisUrl(redisUrl), enableOfflineQueue: false },
      });
      this.queue.on('error', (err) => {
        if (!this.warned) {
          this.warned = true;
          this.logger.warn(`Redis unavailable (${err.message}) — scoring falls back inline`);
        }
      });
    } catch (err) {
      this.logger.warn(`Failed to init scoring queue: ${(err as Error).message}`);
      this.queue = null;
    }
  }

  /** Enqueues the scoring job, or runs it inline when the queue is unavailable. */
  async scheduleScoring(matchId: string): Promise<void> {
    if (this.queue) {
      try {
        await this.queue.add(
          SCORE_MATCH_JOB,
          { matchId },
          { jobId: `${SCORE_MATCH_JOB}:${matchId}`, removeOnComplete: true, removeOnFail: true },
        );
        return;
      } catch {
        // fall through to inline processing
      }
    }
    try {
      await this.scoring.processValidatedMatch(matchId);
    } catch (err) {
      this.logger.error(`Inline scoring failed for match ${matchId}`, (err as Error).stack);
    }
  }

  /** Registers the weekly decay sweep as a repeatable job (Redis only). */
  async scheduleWeeklyDecaySweep(): Promise<boolean> {
    if (!this.queue) return false;
    try {
      await this.queue.add(
        DECAY_SWEEP_JOB,
        {},
        {
          repeat: { pattern: '0 3 * * 1' }, // every Monday 03:00
          jobId: DECAY_SWEEP_JOB,
          removeOnComplete: true,
        },
      );
      return true;
    } catch {
      return false;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close().catch(() => undefined);
  }
}
