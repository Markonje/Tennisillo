import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker } from 'bullmq';
import { MatchesService } from './matches.service';
import { AUTO_CONFIRM_JOB, MATCHES_QUEUE, parseRedisUrl } from './match-queue.service';

/**
 * BullMQ worker for the 24h auto-confirm delayed job (specs/01 §7.1).
 * Skips startup when Redis is not configured; the lazy deadline check in
 * MatchesService covers auto-confirm in that case.
 */
@Injectable()
export class MatchAutoConfirmWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MatchAutoConfirmWorker.name);
  private worker: Worker | null = null;

  constructor(private readonly matches: MatchesService) {}

  onModuleInit(): void {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) return;

    try {
      this.worker = new Worker(
        MATCHES_QUEUE,
        async (job) => {
          if (job.name !== AUTO_CONFIRM_JOB) return;
          const { matchId } = job.data as { matchId: string };
          const confirmed = await this.matches.autoConfirmIfDue(matchId);
          if (confirmed) {
            this.logger.log(`Match ${matchId} auto-confirmed after validation window expiry`);
          }
        },
        { connection: { ...parseRedisUrl(redisUrl), maxRetriesPerRequest: null } },
      );
      this.worker.on('error', () => {
        // connection errors are expected when Redis is unreachable; lazy
        // auto-confirm covers correctness, so keep the log quiet
      });
    } catch (err) {
      this.logger.warn(`Auto-confirm worker not started: ${(err as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close().catch(() => undefined);
  }
}
