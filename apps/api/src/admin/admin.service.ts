import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DisputeStatus,
  MatchStatus,
  MemberRole,
  SeasonStatus,
  TrainingSessionStatus,
  TrainingSessionType,
} from '@tennisillo/db';
import { pairMatchLimit } from '@tennisillo/scoring-engine';
import { getIsoWeekBounds } from '@tennisillo/training-engine';
import { PrismaService } from '../prisma/prisma.service';

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;
const INACTIVITY_ALERT_DAYS = 21;
const LOW_REPUTATION_THRESHOLD = 70;
const SPARRING_PAIR_ALERT = 3;

export interface PairAlert {
  players: string[]; // display names
  count: number;
  limit?: number;
}

/**
 * League admin dashboard data (spec 01 §14.5) + on-demand anti-fraud
 * pattern detection (spec 01 §7.2.4). Detection runs at request time —
 * league sizes at MVP scale make background jobs unnecessary (see ADR 0008).
 */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(leagueId: string) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: { _count: { select: { members: true } } },
    });
    if (!league) throw new NotFoundException('League not found');

    const season = await this.prisma.season.findFirst({
      where: { leagueId, status: { notIn: [SeasonStatus.COMPLETED, SeasonStatus.ARCHIVED] } },
      include: { _count: { select: { players: true } } },
    });

    const [matchStats, disputes, pendingProposals, mastersCount, alerts, recentAudit] =
      await Promise.all([
        season ? this.matchStats(season.id, season.startsAt) : Promise.resolve(null),
        this.openDisputes(leagueId),
        this.prisma.venueProposal.count({
          where: { leagueId, status: 'PENDING_VALIDATION' },
        }),
        this.prisma.leagueMember.count({
          where: { leagueId, role: MemberRole.MASTER, isActive: true },
        }),
        season ? this.buildAlerts(leagueId, season.id) : Promise.resolve(null),
        this.recentAudit(leagueId),
      ]);

    return {
      league: { id: league.id, name: league.name, memberCount: league._count.members },
      season: season
        ? {
            id: season.id,
            name: season.name,
            status: season.status,
            playerCount: season._count.players,
          }
        : null,
      matchStats,
      disputes,
      pendingProposals,
      mastersCount,
      alerts,
      recentAudit,
    };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async matchStats(seasonId: string, startsAt: Date | null) {
    const grouped = await this.prisma.match.groupBy({
      by: ['status'],
      where: { seasonId },
      _count: { _all: true },
    });
    const byStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));

    const validated = byStatus[MatchStatus.VALIDATED] ?? 0;
    const weeksElapsed = startsAt
      ? Math.max(1, Math.floor((Date.now() - startsAt.getTime()) / MS_PER_WEEK))
      : 1;

    return {
      byStatus,
      validated,
      open:
        (byStatus[MatchStatus.PENDING_ACCEPTANCE] ?? 0) +
        (byStatus[MatchStatus.SCHEDULED] ?? 0) +
        (byStatus[MatchStatus.PENDING_RESULT] ?? 0),
      awaitingValidation:
        (byStatus[MatchStatus.PENDING_VALIDATION] ?? 0) + (byStatus[MatchStatus.DISPUTED] ?? 0),
      matchesPerWeek: Math.round((validated / weeksElapsed) * 10) / 10,
    };
  }

  private async openDisputes(leagueId: string) {
    const disputes = await this.prisma.dispute.findMany({
      where: {
        status: { in: [DisputeStatus.OPEN, DisputeStatus.UNDER_REVIEW] },
        match: { season: { leagueId } },
      },
      include: {
        match: {
          include: {
            season: { select: { id: true } },
            player1: { include: { member: { include: { user: { select: { displayName: true } } } } } },
            player2: { include: { member: { include: { user: { select: { displayName: true } } } } } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return disputes.map((d) => ({
      matchId: d.matchId,
      seasonId: d.match.season.id,
      players: [
        d.match.player1.member.user.displayName,
        d.match.player2.member.user.displayName,
      ],
      openedAt: d.createdAt,
    }));
  }

  private async buildAlerts(leagueId: string, seasonId: string) {
    const players = await this.prisma.seasonPlayer.findMany({
      where: { seasonId, isEligible: true },
      include: {
        member: {
          include: { user: { select: { id: true, displayName: true, reputationScore: true } } },
        },
      },
    });
    const nameByPlayerId = new Map(players.map((p) => [p.id, p.member.user.displayName]));
    const activeCount = players.length;
    const limit = pairMatchLimit(activeCount);

    const matches = await this.prisma.match.findMany({
      where: { seasonId, status: MatchStatus.VALIDATED },
      orderBy: { completedAt: 'asc' },
      include: { result: { select: { winnerId: true } } },
    });

    // group matches per pair (canonical key)
    const pairMatches = new Map<string, { winnerIds: string[]; players: [string, string] }>();
    for (const m of matches) {
      const [a, b] = [m.player1Id, m.player2Id].sort();
      const key = `${a}|${b}`;
      const entry = pairMatches.get(key) ?? { winnerIds: [], players: [a, b] as [string, string] };
      if (m.result) entry.winnerIds.push(m.result.winnerId);
      pairMatches.set(key, entry);
    }

    const pairsAtLimit: PairAlert[] = [];
    const alternatingPairs: PairAlert[] = [];
    for (const entry of pairMatches.values()) {
      const names = entry.players.map((id) => nameByPlayerId.get(id) ?? '?');
      if (entry.winnerIds.length >= limit) {
        pairsAtLimit.push({ players: names, count: entry.winnerIds.length, limit });
      }
      // strictly alternating winners over the last 4+ pair matches (spec §7.2.4)
      if (entry.winnerIds.length >= 4) {
        const last = entry.winnerIds.slice(-4);
        const alternating = last.every((w, i) => i === 0 || w !== last[i - 1]);
        if (alternating) {
          alternatingPairs.push({ players: names, count: entry.winnerIds.length });
        }
      }
    }

    // inactivity: no validated match in 21+ days
    const now = Date.now();
    const lastMatchByPlayer = new Map<string, number>();
    for (const m of matches) {
      const at = m.completedAt?.getTime() ?? 0;
      for (const pid of [m.player1Id, m.player2Id]) {
        lastMatchByPlayer.set(pid, Math.max(lastMatchByPlayer.get(pid) ?? 0, at));
      }
    }
    const inactivePlayers = players
      .filter((p) => {
        const last = lastMatchByPlayer.get(p.id) ?? p.joinedAt.getTime();
        return now - last > INACTIVITY_ALERT_DAYS * 24 * 60 * 60 * 1000;
      })
      .map((p) => p.member.user.displayName);

    const lowReputation = players
      .filter((p) => p.member.user.reputationScore < LOW_REPUTATION_THRESHOLD)
      .map((p) => ({
        displayName: p.member.user.displayName,
        reputationScore: p.member.user.reputationScore,
      }));

    // sparring monitoring (spec §9.1.3): farming pairs and cap-only players
    const sparring = await this.prisma.trainingSession.findMany({
      where: {
        leagueId,
        type: TrainingSessionType.SPARRING,
        status: TrainingSessionStatus.VALIDATED,
      },
      select: { player1Id: true, player2Id: true, createdAt: true },
    });
    const sparringPairs = new Map<string, number>();
    for (const s of sparring) {
      const key = [s.player1Id, s.player2Id ?? ''].sort().join('|');
      sparringPairs.set(key, (sparringPairs.get(key) ?? 0) + 1);
    }
    const userNames = new Map(players.map((p) => [p.member.user.id, p.member.user.displayName]));
    const sparringFarmingPairs: PairAlert[] = [...sparringPairs.entries()]
      .filter(([, count]) => count >= SPARRING_PAIR_ALERT)
      .map(([key, count]) => ({
        players: key.split('|').map((id) => userNames.get(id) ?? '?'),
        count,
      }));

    // players at the weekly sparring cap with zero competitive matches in 4 weeks
    const { start } = getIsoWeekBounds(new Date());
    const fourWeeksAgo = now - 4 * MS_PER_WEEK;
    const sparringOnlyPlayers: string[] = [];
    for (const p of players) {
      const weekSparring = sparring.filter(
        (s) =>
          s.createdAt.getTime() >= start.getTime() &&
          (s.player1Id === p.member.user.id || s.player2Id === p.member.user.id),
      ).length;
      const recentCompetitive = matches.some(
        (m) =>
          (m.player1Id === p.id || m.player2Id === p.id) &&
          (m.completedAt?.getTime() ?? 0) >= fourWeeksAgo,
      );
      if (weekSparring >= 2 && !recentCompetitive) {
        sparringOnlyPlayers.push(p.member.user.displayName);
      }
    }

    return {
      pairsAtLimit,
      alternatingPairs,
      sparringFarmingPairs,
      sparringOnlyPlayers,
      inactivePlayers,
      lowReputation,
    };
  }

  private async recentAudit(leagueId: string) {
    const rows = await this.prisma.auditLog.findMany({
      where: { payload: { path: ['leagueId'], equals: leagueId } },
      orderBy: { createdAt: 'desc' },
      take: 15,
      include: { user: { select: { displayName: true } } },
    });
    return rows.map((r) => ({
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      actor: r.user.displayName,
      at: r.createdAt,
    }));
  }
}
