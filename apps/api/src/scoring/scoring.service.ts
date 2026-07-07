import { Injectable, Logger } from '@nestjs/common';
import { MatchFormat, MatchStatus, Prisma, SeasonStatus } from '@tennisillo/db';
import {
  calculateMatchScore,
  type HeadToHeadContext,
  type PlayerSeasonContext,
  type ScoringConfig,
  type SetFromWinner,
} from '@tennisillo/scoring-engine';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { toEngineLevel } from './utils/level-map';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const MS_PER_4_WEEKS = 4 * MS_PER_WEEK;
/** Spec §8.8/§8.13: rival bonus cooldown default. SeasonSettings has no field yet. */
const RIVAL_COOLDOWN_DAYS = 21;

interface HistoricalMatch {
  id: string;
  completedAt: Date;
  playerId: string; // perspective player's SeasonPlayer id
  opponentId: string;
  won: boolean;
}

/**
 * Applies the scoring engine to a VALIDATED competitive match: gathers the
 * per-player season contexts from the DB (competitive matches ONLY — never
 * TrainingSession), runs the pure engine, persists ScoreDelta rows and
 * refreshes SeasonPlayer points + SeasonRanking.
 */
@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Idempotent: returns false when the match is not scorable or already scored. */
  async processValidatedMatch(matchId: string): Promise<boolean> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        result: true,
        season: { include: { settings: true } },
        player1: { include: { member: true } },
        player2: { include: { member: true } },
      },
    });
    if (!match || match.status !== MatchStatus.VALIDATED || !match.result) return false;
    if (!match.completedAt) return false;

    const existing = await this.prisma.scoreDelta.findFirst({ where: { matchId } });
    if (existing) return false; // already scored

    const winnerId = match.result.winnerId;
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;
    const winnerSp = winnerId === match.player1Id ? match.player1 : match.player2;
    const loserSp = winnerId === match.player1Id ? match.player2 : match.player1;
    const completedAt = match.completedAt;

    const activePlayersInSeason = await this.prisma.seasonPlayer.count({
      where: { seasonId: match.seasonId, isEligible: true },
    });

    const [winnerHistory, loserHistory] = await Promise.all([
      this.loadHistory(match.seasonId, winnerId, matchId, completedAt),
      this.loadHistory(match.seasonId, loserId, matchId, completedAt),
    ]);

    const winnerCtx = this.buildContext(
      winnerId,
      toEngineLevel(winnerSp.member.leagueLevel),
      winnerSp.member.leagueRating,
      winnerHistory,
      loserId,
      completedAt,
      match.season.startsAt ?? winnerSp.joinedAt,
    );
    const loserCtx = this.buildContext(
      loserId,
      toEngineLevel(loserSp.member.leagueLevel),
      loserSp.member.leagueRating,
      loserHistory,
      winnerId,
      completedAt,
      match.season.startsAt ?? loserSp.joinedAt,
    );

    const h2h = await this.buildH2hContext(winnerHistory, loserId, completedAt);

    const output = calculateMatchScore({
      matchId,
      winnerId,
      loserId,
      config: this.toConfig(match.season.settings),
      winner: winnerCtx,
      loser: loserCtx,
      h2h,
      matchDate: completedAt,
      sets: this.toWinnerSets(match.result.sets, winnerId === match.player1Id, match.format),
      activePlayersInSeason,
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.scoreDelta.createMany({
        data: [
          {
            matchId,
            playerId: winnerId,
            deltaPoints: output.winner.deltaTotal,
            breakdown: output.winner.breakdown as unknown as Prisma.InputJsonValue,
          },
          {
            matchId,
            playerId: loserId,
            deltaPoints: output.loser.deltaTotal,
            breakdown: output.loser.breakdown as unknown as Prisma.InputJsonValue,
          },
        ],
      });
      await tx.seasonPlayer.update({
        where: { id: winnerId },
        data: { currentPoints: { increment: output.winner.deltaTotal } },
      });
      await tx.seasonPlayer.update({
        where: { id: loserId },
        data: { currentPoints: { increment: output.loser.deltaTotal } },
      });
      await this.recomputeRanking(tx, match.seasonId);
    });

    await this.audit.record('SCORE_COMPUTED', winnerSp.member.userId, 'Match', matchId, {
      winnerDelta: output.winner.deltaTotal,
      loserDelta: output.loser.deltaTotal,
      rivalBonusApplied: output.rivalBonusApplied,
    });

    this.logger.log(
      `Scored match ${matchId}: winner +${output.winner.deltaTotal}, loser +${output.loser.deltaTotal}`,
    );
    return true;
  }

  /**
   * Weekly decay sweep (spec §8.10). Applies the decay penalty to players of
   * ACTIVE seasons with decay enabled who have no validated competitive match
   * in 3+ weeks, at most once every 7 days per player (bookkept via AuditLog).
   * Sparring/lessons never protect from decay: only Match rows count here.
   */
  async runDecaySweep(now = new Date()): Promise<number> {
    const seasons = await this.prisma.season.findMany({
      where: { status: SeasonStatus.ACTIVE },
      include: { settings: true },
    });

    let applied = 0;
    for (const season of seasons) {
      if (season.settings && !season.settings.decayEnabled) continue;
      const config = this.toConfig(season.settings);

      const players = await this.prisma.seasonPlayer.findMany({
        where: { seasonId: season.id, isEligible: true },
        include: { member: true },
      });

      for (const player of players) {
        const lastMatch = await this.prisma.match.findFirst({
          where: {
            seasonId: season.id,
            status: MatchStatus.VALIDATED,
            OR: [{ player1Id: player.id }, { player2Id: player.id }],
          },
          orderBy: { completedAt: 'desc' },
          select: { completedAt: true },
        });
        const reference =
          lastMatch?.completedAt ?? season.startsAt ?? player.joinedAt;
        const weeksInactive = Math.floor((now.getTime() - reference.getTime()) / MS_PER_WEEK);

        const penalty = this.decayFor(weeksInactive, config);
        if (penalty <= 0) continue;

        // at most one decay application per player per week
        const lastDecay = await this.prisma.auditLog.findFirst({
          where: { action: 'DECAY_APPLIED', entityType: 'SeasonPlayer', entityId: player.id },
          orderBy: { createdAt: 'desc' },
        });
        if (lastDecay && now.getTime() - lastDecay.createdAt.getTime() < MS_PER_WEEK) continue;

        const effective = Math.min(penalty, player.currentPoints); // season total floor: 0
        if (effective <= 0) continue;

        await this.prisma.$transaction(async (tx) => {
          await tx.seasonPlayer.update({
            where: { id: player.id },
            data: { currentPoints: { decrement: effective } },
          });
          await this.recomputeRanking(tx, season.id);
        });
        await this.audit.record('DECAY_APPLIED', player.member.userId, 'SeasonPlayer', player.id, {
          seasonId: season.id,
          weeksInactive,
          penalty: effective,
        });
        applied += 1;
      }
    }
    return applied;
  }

  /** Public ranking refresh, reused by the training flow (sparring points). */
  async refreshRanking(seasonId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.recomputeRanking(tx, seasonId);
    });
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private decayFor(weeksInactive: number, config: ScoringConfig): number {
    if (!config.decayEnabled || weeksInactive < config.decayStartWeek) return 0;
    const idx = Math.min(
      weeksInactive - config.decayStartWeek,
      config.decayPointsPerWeek.length - 1,
    );
    return config.decayPointsPerWeek[idx] ?? 0;
  }

  private toConfig(
    settings: {
      pointsWin: number;
      pointsLoss: number;
      levelMultiplierMode: string;
      bonusConsistencyEnabled: boolean;
      bonusDiversityEnabled: boolean;
      headToHeadEnabled: boolean;
      decayEnabled: boolean;
      decayRateWeek2: number;
      decayRateWeek3: number;
      decayRateWeek4: number;
      decayRateWeek5Plus: number;
      pairLimitOverride: number | null;
    } | null,
  ): ScoringConfig {
    const mode = settings?.levelMultiplierMode ?? 'NORMAL';
    return {
      pointsWin: settings?.pointsWin ?? 100,
      pointsLoss: settings?.pointsLoss ?? 30,
      levelMultiplierMode:
        mode === 'OFF' || mode === 'SOFT' || mode === 'HARD' ? mode : 'NORMAL',
      bonusConsistencyEnabled: settings?.bonusConsistencyEnabled ?? true,
      bonusDiversityEnabled: settings?.bonusDiversityEnabled ?? true,
      headToHeadEnabled: settings?.headToHeadEnabled ?? true,
      decayEnabled: settings?.decayEnabled ?? true,
      decayStartWeek: 2,
      decayPointsPerWeek: [
        settings?.decayRateWeek2 ?? 0,
        settings?.decayRateWeek3 ?? 5,
        settings?.decayRateWeek4 ?? 15,
        settings?.decayRateWeek5Plus ?? 25,
      ],
      rivalCooldownDays: RIVAL_COOLDOWN_DAYS,
      maxMatchesPerPair: settings?.pairLimitOverride ?? 0,
    };
  }

  /** Validated competitive matches of a player BEFORE the given match. */
  private async loadHistory(
    seasonId: string,
    playerId: string,
    excludeMatchId: string,
    upTo: Date,
  ): Promise<HistoricalMatch[]> {
    const matches = await this.prisma.match.findMany({
      where: {
        seasonId,
        id: { not: excludeMatchId },
        status: MatchStatus.VALIDATED,
        completedAt: { lte: upTo },
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
      include: { result: true },
      orderBy: { completedAt: 'desc' },
    });

    return matches
      .filter((m) => m.result && m.completedAt)
      .map((m) => ({
        id: m.id,
        completedAt: m.completedAt as Date,
        playerId,
        opponentId: m.player1Id === playerId ? m.player2Id : m.player1Id,
        won: m.result?.winnerId === playerId,
      }));
  }

  private buildContext(
    playerId: string,
    level: PlayerSeasonContext['level'],
    rating: number,
    history: HistoricalMatch[],
    currentOpponentId: string,
    matchDate: Date,
    activitySince: Date,
  ): PlayerSeasonContext {
    // counters INCLUDE the match being scored (engine contract)
    const last4WeeksCutoff = matchDate.getTime() - MS_PER_4_WEEKS;
    const matchesLast4Weeks =
      history.filter((m) => m.completedAt.getTime() >= last4WeeksCutoff).length + 1;

    const uniqueOpponents = new Set(history.map((m) => m.opponentId));
    uniqueOpponents.add(currentOpponentId);

    // streak BEFORE this match: consecutive wins vs distinct opponents
    let currentWinStreak = 0;
    const winStreakOpponentIds: string[] = [];
    for (const m of history) {
      if (!m.won) break;
      if (winStreakOpponentIds.includes(m.opponentId)) break;
      currentWinStreak += 1;
      winStreakOpponentIds.push(m.opponentId);
    }

    const previous = history[0];
    const inactiveReference = previous?.completedAt ?? activitySince;
    const weeksInactiveConsecutive = Math.max(
      0,
      Math.floor((matchDate.getTime() - inactiveReference.getTime()) / MS_PER_WEEK),
    );

    return {
      seasonPlayerId: playerId,
      level,
      rating,
      matchesLast4Weeks,
      uniqueOpponentsThisSeason: [...uniqueOpponents],
      totalMatchesThisSeason: history.length + 1,
      currentWinStreak,
      winStreakOpponentIds,
      weeksInactiveConsecutive,
      pausesUsed: 0, // declared pauses not modelled yet (see FAQ)
    };
  }

  private async buildH2hContext(
    winnerHistory: HistoricalMatch[],
    loserId: string,
    upTo: Date,
  ): Promise<HeadToHeadContext> {
    const pairMatches = winnerHistory.filter((m) => m.opponentId === loserId);
    const lastPairMatch = pairMatches[0];

    let lastRivalBonusAt: Date | null = null;
    if (pairMatches.length > 0) {
      const deltas = await this.prisma.scoreDelta.findMany({
        where: { matchId: { in: pairMatches.map((m) => m.id) } },
        orderBy: { computedAt: 'desc' },
      });
      for (const delta of deltas) {
        const breakdown = delta.breakdown as { h2h?: number } | null;
        if (breakdown?.h2h && breakdown.h2h > 0 && delta.computedAt <= upTo) {
          lastRivalBonusAt = delta.computedAt;
          break;
        }
      }
    }

    return {
      matchesBetweenPairThisSeason: pairMatches.length,
      lastWinnerId: lastPairMatch
        ? lastPairMatch.won
          ? lastPairMatch.playerId
          : lastPairMatch.opponentId
        : null,
      lastRivalBonusAt,
    };
  }

  private toWinnerSets(
    sets: Prisma.JsonValue,
    winnerIsP1: boolean,
    format: MatchFormat,
  ): SetFromWinner[] {
    const raw = (Array.isArray(sets) ? sets : []) as { p1: number; p2: number }[];
    return raw.map((s, i) => ({
      winnerGames: winnerIsP1 ? s.p1 : s.p2,
      loserGames: winnerIsP1 ? s.p2 : s.p1,
      ...(format === MatchFormat.SUPER_TIEBREAK && i === 2 ? { superTiebreak: true } : {}),
    }));
  }

  private async recomputeRanking(tx: Prisma.TransactionClient, seasonId: string): Promise<void> {
    const players = await tx.seasonPlayer.findMany({
      where: { seasonId },
      orderBy: [{ currentPoints: 'desc' }, { wins: 'desc' }, { joinedAt: 'asc' }],
    });

    const computedAt = new Date();
    for (const [index, player] of players.entries()) {
      const rank = index + 1;
      await tx.seasonPlayer.update({
        where: { id: player.id },
        data: { currentRank: rank },
      });
      // one snapshot row per player per season, refreshed in place
      const snapshot = await tx.seasonRanking.findFirst({
        where: { seasonId, playerId: player.id },
      });
      if (snapshot) {
        await tx.seasonRanking.update({
          where: { id: snapshot.id },
          data: { points: player.currentPoints, rank, computedAt },
        });
      } else {
        await tx.seasonRanking.create({
          data: { seasonId, playerId: player.id, points: player.currentPoints, rank, computedAt },
        });
      }
    }
  }
}
