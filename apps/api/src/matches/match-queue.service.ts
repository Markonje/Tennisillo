import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { RedisOptions } from 'bullmq';

export const MATCHES_QUEUE = 'matches';
export const AUTO_CONFIRM_JOB = 'auto-confirm';

export function parseRedisUrl(url: string): RedisOptions {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    ...(u.protocol === 'rediss:' ? { tls: {} } : {}),
    // stop hammering an unreachable Redis: give up after a few attempts
    retryStrategy: (times: number) => (times > 3 ? null : Math.min(times * 500, 2000)),
  };
}

/**
 * Thin BullMQ wrapper for match-related delayed jobs.
 *
 * Proactive auto-confirm runs through this queue; when Redis is not
 * configured or unreachable the enqueue becomes a no-op and correctness is
 * guaranteed by the lazy deadline check in MatchesService (every read/mutation
 * of a PENDING_VALIDATION match finalizes it if the window has expired).
 */
@Injectable()
export class MatchQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(MatchQueueService.name);
  private queue: Queue | null = null;
  private warned = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      this.logger.warn('REDIS_URL not set — delayed jobs disabled (lazy auto-confirm only)');
      return;
    }
    try {
      this.queue = new Queue(MATCHES_QUEUE, {
        connection: { ...parseRedisUrl(redisUrl), enableOfflineQueue: false },
      });
      this.queue.on('error', (err) => {
        if (!this.warned) {
          this.warned = true;
          this.logger.warn(`Redis unavailable (${err.message}) — falling back to lazy auto-confirm`);
        }
      });
    } catch (err) {
      this.logger.warn(`Failed to init match queue: ${(err as Error).message}`);
      this.queue = null;
    }
  }

  /** Schedules the auto-confirm job; returns false when the queue is unavailable. */
  async scheduleAutoConfirm(matchId: string, runAt: Date): Promise<boolean> {
    if (!this.queue) return false;
    try {
      const delay = Math.max(0, runAt.getTime() - Date.now());
      await this.queue.add(
        AUTO_CONFIRM_JOB,
        { matchId },
        { delay, jobId: `${AUTO_CONFIRM_JOB}:${matchId}`, removeOnComplete: true, removeOnFail: true },
      );
      return true;
    } catch (err) {
      if (!this.warned) {
        this.warned = true;
        this.logger.warn(`Could not enqueue auto-confirm: ${(err as Error).message}`);
      }
      return false;
    }
  }

  /** Removes a pending auto-confirm job (e.g. after manual confirm or dispute). */
  async cancelAutoConfirm(matchId: string): Promise<void> {
    if (!this.queue) return;
    try {
      const job = await this.queue.getJob(`${AUTO_CONFIRM_JOB}:${matchId}`);
      if (job) await job.remove();
    } catch {
      // best-effort: the processor re-checks match status anyway
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue?.close().catch(() => undefined);
  }
}
