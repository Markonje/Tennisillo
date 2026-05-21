import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SeasonStatus, MemberRole, MasterMode } from '@tennisillo/db';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import type { CreateSeasonDto } from './dto/create-season.dto';
import type { UpdateSeasonDto } from './dto/update-season.dto';
import type { TransitionSeasonDto } from './dto/transition-season.dto';

const TERMINAL_STATUSES: SeasonStatus[] = [SeasonStatus.COMPLETED, SeasonStatus.ARCHIVED];
const ALLOWED_TRANSITIONS: Record<string, SeasonStatus> = {
  [`${SeasonStatus.DRAFT}->${SeasonStatus.REGISTRATION}`]: SeasonStatus.REGISTRATION,
  [`${SeasonStatus.REGISTRATION}->${SeasonStatus.ACTIVE}`]: SeasonStatus.ACTIVE,
  [`${SeasonStatus.ACTIVE}->${SeasonStatus.COMPLETED}`]: SeasonStatus.COMPLETED,
};

@Injectable()
export class SeasonService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Create ───────────────────────────────────────────────────────────────

  async createSeason(leagueId: string, actorId: string, dto: CreateSeasonDto) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: { settings: true },
    });
    if (!league || !league.isActive) throw new NotFoundException('League not found');

    if (dto.startsAt && dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    const activeOrUpcoming = await this.prisma.season.findFirst({
      where: {
        leagueId,
        status: { notIn: TERMINAL_STATUSES },
      },
    });
    if (activeOrUpcoming) {
      throw new ConflictException(
        'League already has an active or upcoming season',
      );
    }

    const s = league.settings;
    const season = await this.prisma.season.create({
      data: {
        leagueId,
        name: dto.name,
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt !== undefined && { endsAt: new Date(dto.endsAt) }),
        ...(dto.maxPlayers !== undefined && { maxPlayers: dto.maxPlayers }),
        ...(dto.plannedDurationWeeks !== undefined && {
          plannedDurationWeeks: dto.plannedDurationWeeks,
        }),
        settings: {
          create: {
            pointsWin: s?.defaultPointsWin ?? 100,
            pointsLoss: s?.defaultPointsLoss ?? 30,
            levelMultiplierMode: s?.defaultLevelMultiplier ?? 'NORMAL',
            bonusConsistencyEnabled: s?.defaultBonusConsistency ?? true,
            bonusDiversityEnabled: s?.defaultBonusDiversity ?? true,
            headToHeadEnabled: s?.defaultHeadToHead ?? true,
            decayEnabled: s?.defaultDecayEnabled ?? true,
            resultWindowHours: s?.resultWindowHours ?? 12,
            autoConfirmHours: s?.autoConfirmHours ?? 24,
          },
        },
      },
      include: { settings: true, _count: { select: { players: true } } },
    });

    await this.audit.record('SEASON_CREATED', actorId, 'Season', season.id, {
      leagueId,
      seasonName: season.name,
    });

    return season;
  }

  // ─── List ─────────────────────────────────────────────────────────────────

  async listByLeague(leagueId: string) {
    const seasons = await this.prisma.season.findMany({
      where: { leagueId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { players: true } } },
    });
    return seasons.map((s) => ({
      ...s,
      playerCount: s._count.players,
    }));
  }

  // ─── Detail ───────────────────────────────────────────────────────────────

  async findById(seasonId: string) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: {
        settings: true,
        _count: { select: { players: true } },
      },
    });
    if (!season) throw new NotFoundException('Season not found');
    return { ...season, playerCount: season._count.players };
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  async updateSeason(seasonId: string, actorId: string, dto: UpdateSeasonDto) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');

    if (
      season.status !== SeasonStatus.DRAFT &&
      season.status !== SeasonStatus.REGISTRATION
    ) {
      throw new BadRequestException(
        'Season can only be updated in DRAFT or REGISTRATION status',
      );
    }

    if (dto.startsAt && dto.endsAt && new Date(dto.endsAt) <= new Date(dto.startsAt)) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    return this.prisma.season.update({
      where: { id: seasonId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.startsAt !== undefined && { startsAt: new Date(dto.startsAt) }),
        ...(dto.endsAt !== undefined && { endsAt: new Date(dto.endsAt) }),
        ...(dto.maxPlayers !== undefined && { maxPlayers: dto.maxPlayers }),
        ...(dto.plannedDurationWeeks !== undefined && {
          plannedDurationWeeks: dto.plannedDurationWeeks,
        }),
      },
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async deleteSeason(seasonId: string, actorId: string) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');

    if (season.status !== SeasonStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT seasons can be deleted');
    }

    await this.prisma.season.delete({ where: { id: seasonId } });
    await this.audit.record('SEASON_DELETED', actorId, 'Season', seasonId, {
      leagueId: season.leagueId,
    });
  }

  // ─── Transition ───────────────────────────────────────────────────────────

  async transitionSeason(seasonId: string, actorId: string, dto: TransitionSeasonDto) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { _count: { select: { players: true } } },
    });
    if (!season) throw new NotFoundException('Season not found');

    const transitionKey = `${season.status}->${dto.to}`;
    const targetStatus = ALLOWED_TRANSITIONS[transitionKey];

    if (!targetStatus) {
      throw new BadRequestException(
        `Cannot transition from ${season.status} to ${dto.to}`,
      );
    }

    if (targetStatus === SeasonStatus.ACTIVE) {
      if (season._count.players < 2) {
        throw new BadRequestException(
          'At least 2 registered players are required to start the season',
        );
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.season.update({
        where: { id: seasonId },
        data: { status: targetStatus },
      });

      if (targetStatus === SeasonStatus.ACTIVE) {
        const players = await tx.seasonPlayer.findMany({
          where: { seasonId },
          select: { id: true },
        });
        await tx.seasonRanking.createMany({
          data: players.map((p) => ({
            seasonId,
            playerId: p.id,
            points: 0,
            rank: null,
          })),
        });
      }

      return result;
    });

    await this.audit.record('SEASON_TRANSITION', actorId, 'Season', seasonId, {
      from: season.status,
      to: targetStatus,
    });

    return updated;
  }

  // ─── Registration ─────────────────────────────────────────────────────────

  async registerSelf(seasonId: string, userId: string) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { _count: { select: { players: true } } },
    });
    if (!season) throw new NotFoundException('Season not found');

    if (season.status !== SeasonStatus.REGISTRATION) {
      throw new ConflictException('Season is not open for registration');
    }

    const member = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: season.leagueId, userId } },
    });
    if (!member || !member.isActive) {
      throw new ForbiddenException('You are not a member of this league');
    }

    if (member.role === MemberRole.GUEST) {
      throw new ForbiddenException('Guests cannot register to a season');
    }

    if (
      member.role === MemberRole.MASTER &&
      member.masterMode === MasterMode.PURE
    ) {
      throw new ForbiddenException('Pure masters cannot register as competitive players');
    }

    const existing = await this.prisma.seasonPlayer.findUnique({
      where: { seasonId_memberId: { seasonId, memberId: member.id } },
    });
    if (existing) {
      throw new ConflictException('Already registered for this season');
    }

    if (season.maxPlayers && season._count.players >= season.maxPlayers) {
      throw new ConflictException('Season is full');
    }

    const player = await this.prisma.seasonPlayer.create({
      data: { seasonId, memberId: member.id },
    });

    await this.audit.record('SEASON_REGISTRATION', userId, 'SeasonPlayer', player.id, {
      seasonId,
      leagueId: season.leagueId,
    });

    return player;
  }

  async unregisterSelf(seasonId: string, userId: string) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');

    if (season.status !== SeasonStatus.REGISTRATION) {
      throw new ConflictException('Unregistration is only allowed during REGISTRATION');
    }

    const member = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: season.leagueId, userId } },
    });
    if (!member) throw new NotFoundException('League membership not found');

    const player = await this.prisma.seasonPlayer.findUnique({
      where: { seasonId_memberId: { seasonId, memberId: member.id } },
    });
    if (!player) throw new NotFoundException('Not registered for this season');

    await this.prisma.seasonPlayer.delete({ where: { id: player.id } });

    await this.audit.record('SEASON_UNREGISTRATION', userId, 'SeasonPlayer', player.id, {
      seasonId,
      leagueId: season.leagueId,
    });
  }

  // ─── Players / Ranking ────────────────────────────────────────────────────

  async getPlayers(seasonId: string) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');

    const players = await this.prisma.seasonPlayer.findMany({
      where: { seasonId },
      orderBy: { joinedAt: 'asc' },
      include: {
        member: {
          include: {
            user: { select: { displayName: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    return players.map((p) => ({
      id: p.id,
      memberId: p.memberId,
      displayName: p.member.user.displayName,
      username: p.member.user.username,
      avatarUrl: p.member.user.avatarUrl,
      currentPoints: p.currentPoints,
      currentRank: p.currentRank,
      matchesPlayed: p.matchesPlayed,
      wins: p.wins,
      losses: p.losses,
      isEligible: p.isEligible,
      joinedAt: p.joinedAt,
    }));
  }

  async getRanking(seasonId: string) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');

    const rankings = await this.prisma.seasonRanking.findMany({
      where: { seasonId },
      orderBy: [{ rank: 'asc' }, { points: 'desc' }],
      include: {
        player: {
          include: {
            member: {
              include: {
                user: { select: { displayName: true, username: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });

    return rankings.map((r) => ({
      id: r.id,
      playerId: r.playerId,
      displayName: r.player.member.user.displayName,
      username: r.player.member.user.username,
      avatarUrl: r.player.member.user.avatarUrl,
      points: r.points,
      rank: r.rank,
      computedAt: r.computedAt,
    }));
  }
}
