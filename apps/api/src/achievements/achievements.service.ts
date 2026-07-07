import { Injectable, Logger } from '@nestjs/common';
import { MatchStatus, NotificationType, Prisma } from '@tennisillo/db';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Badge catalog (spec 01 §14.1). Training badges (SCHOLAR, DEDICATED,
 * MENTOR, SPARRING_PARTNER) are awarded by TrainingSessionsService; this
 * service covers the competitive ones. Badges requiring full-season data
 * evaluated at close (CHAMPION) hook into the season transition. The
 * remaining season-long badges (Equilibrista, Iron Man, Sportivo, Muro)
 * need per-season stats snapshots and are deferred (see FAQ).
 */
const CATALOG = {
  FIRST_WIN: {
    code: 'FIRST_WIN',
    name: 'Prima Vittoria',
    description: 'First match won in the league',
  },
  ON_FIRE: {
    code: 'ON_FIRE',
    name: 'In Fiamme',
    description: '5 consecutive wins against distinct opponents',
  },
  GIANT_SLAYER: {
    code: 'GIANT_SLAYER',
    name: 'Ammazzagiganti',
    description: 'Won against a player 2+ levels above',
  },
  EXPLORER: {
    code: 'EXPLORER',
    name: 'Esploratore',
    description: 'Played against every league member at least once',
  },
  AVENGER: {
    code: 'AVENGER',
    name: 'Vendicatore',
    description: '3 revenge bonuses in the same season',
  },
  CHAMPION: {
    code: 'CHAMPION',
    name: 'Campione',
    description: 'Won the season ranking',
  },
} as const;

type BadgeCode = keyof typeof CATALOG;

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async catalog() {
    return this.prisma.achievement.findMany({ orderBy: { code: 'asc' } });
  }

  async forUser(userId: string) {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { earnedAt: 'desc' },
    });
  }

  /**
   * Competitive badge checks after a match has been scored. Failures are
   * swallowed: badges must never break the scoring flow.
   */
  async onMatchScored(matchId: string): Promise<void> {
    try {
      await this.checkMatchBadges(matchId);
    } catch (err) {
      this.logger.warn(`Badge evaluation failed for match ${matchId}: ${(err as Error).message}`);
    }
  }

  /** CHAMPION badge for the rank-1 player when a season completes. */
  async onSeasonCompleted(seasonId: string): Promise<void> {
    try {
      const winner = await this.prisma.seasonPlayer.findFirst({
        where: { seasonId, currentRank: 1 },
        include: { member: true },
      });
      if (!winner) return;
      await this.award(winner.member.userId, 'CHAMPION', winner.member.leagueId);
    } catch (err) {
      this.logger.warn(`CHAMPION evaluation failed for season ${seasonId}: ${(err as Error).message}`);
    }
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async checkMatchBadges(matchId: string): Promise<void> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        result: true,
        season: { select: { id: true, leagueId: true } },
        player1: { include: { member: true } },
        player2: { include: { member: true } },
      },
    });
    if (!match?.result || match.status !== MatchStatus.VALIDATED) return;

    const winnerSp = match.result.winnerId === match.player1Id ? match.player1 : match.player2;
    const loserSp = match.result.winnerId === match.player1Id ? match.player2 : match.player1;
    const winnerUserId = winnerSp.member.userId;
    const leagueId = match.season.leagueId;

    // FIRST_WIN
    if (winnerSp.wins >= 1) {
      const wins = await this.countWins(match.season.id, winnerSp.id);
      if (wins === 1) await this.award(winnerUserId, 'FIRST_WIN', leagueId);
    }

    // GIANT_SLAYER: loser 2+ levels above the winner
    const levelOrder = ['ROOKIE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ELITE'];
    const diff =
      levelOrder.indexOf(loserSp.member.leagueLevel) -
      levelOrder.indexOf(winnerSp.member.leagueLevel);
    if (diff >= 2) await this.award(winnerUserId, 'GIANT_SLAYER', leagueId);

    // ON_FIRE: 5 consecutive wins vs distinct opponents
    const streak = await this.currentDistinctWinStreak(match.season.id, winnerSp.id);
    if (streak >= 5) await this.award(winnerUserId, 'ON_FIRE', leagueId);

    // EXPLORER: played every other eligible player at least once
    for (const sp of [match.player1, match.player2]) {
      const [uniqueOpponents, activePlayers] = await Promise.all([
        this.uniqueOpponents(match.season.id, sp.id),
        this.prisma.seasonPlayer.count({ where: { seasonId: match.season.id, isEligible: true } }),
      ]);
      if (activePlayers > 2 && uniqueOpponents >= activePlayers - 1) {
        await this.award(sp.member.userId, 'EXPLORER', leagueId);
      }
    }

    // AVENGER: 3 revenge bonuses (+25 h2h) in the season
    const deltas = await this.prisma.scoreDelta.findMany({
      where: { playerId: winnerSp.id },
      select: { breakdown: true },
    });
    const revenges = deltas.filter((d) => {
      const b = d.breakdown as { h2h?: number } | null;
      return b?.h2h === 25;
    }).length;
    if (revenges >= 3) await this.award(winnerUserId, 'AVENGER', leagueId);
  }

  private async countWins(seasonId: string, playerId: string): Promise<number> {
    const matches = await this.prisma.match.findMany({
      where: {
        seasonId,
        status: MatchStatus.VALIDATED,
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
      include: { result: { select: { winnerId: true } } },
    });
    return matches.filter((m) => m.result?.winnerId === playerId).length;
  }

  private async currentDistinctWinStreak(seasonId: string, playerId: string): Promise<number> {
    const matches = await this.prisma.match.findMany({
      where: {
        seasonId,
        status: MatchStatus.VALIDATED,
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
      orderBy: { completedAt: 'desc' },
      include: { result: { select: { winnerId: true } } },
    });
    let streak = 0;
    const seen = new Set<string>();
    for (const m of matches) {
      if (m.result?.winnerId !== playerId) break;
      const opponent = m.player1Id === playerId ? m.player2Id : m.player1Id;
      if (seen.has(opponent)) break;
      seen.add(opponent);
      streak += 1;
    }
    return streak;
  }

  private async uniqueOpponents(seasonId: string, playerId: string): Promise<number> {
    const matches = await this.prisma.match.findMany({
      where: {
        seasonId,
        status: MatchStatus.VALIDATED,
        OR: [{ player1Id: playerId }, { player2Id: playerId }],
      },
      select: { player1Id: true, player2Id: true },
    });
    return new Set(matches.map((m) => (m.player1Id === playerId ? m.player2Id : m.player1Id)))
      .size;
  }

  private async award(userId: string, code: BadgeCode, leagueId: string | null): Promise<void> {
    const badge = CATALOG[code];
    const achievement = await this.prisma.achievement.upsert({
      where: { code: badge.code },
      create: {
        code: badge.code,
        name: badge.name,
        description: badge.description,
        category: 'COMPETITIVE',
      },
      update: {},
    });

    const existing = await this.prisma.userAchievement.findFirst({
      where: { userId, achievementId: achievement.id, leagueId },
    });
    if (existing) return;

    await this.prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id, leagueId },
    });
    await this.prisma.notification.create({
      data: {
        userId,
        type: NotificationType.BADGE_EARNED,
        payload: { code: badge.code, name: badge.name, leagueId } as Prisma.InputJsonValue,
      },
    });
  }
}
