import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeagueType, MemberRole } from '@tennisillo/db';
import type { CreateLeagueDto } from './dto/create-league.dto';
import type { UpdateLeagueSettingsDto } from './dto/update-settings.dto';
import { randomBytes } from 'node:crypto';

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${randomBytes(3).toString('hex')}`;
}

@Injectable()
export class LeagueService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLeagueDto, creatorId: string) {
    const slug = generateSlug(dto.name);

    return this.prisma.league.create({
      data: {
        name: dto.name,
        slug,
        sport: dto.sport,
        type: dto.type,
        description: dto.description ?? null,
        ownerId: creatorId,
        members: {
          create: { userId: creatorId, role: MemberRole.ADMIN },
        },
        settings: {
          create: {},
        },
      },
      include: { members: true, settings: true },
    });
  }

  async findById(id: string) {
    const league = await this.prisma.league.findUnique({
      where: { id },
      include: { members: { include: { user: true } }, settings: true },
    });
    if (!league) throw new NotFoundException('League not found');
    return league;
  }

  async findByUser(userId: string) {
    return this.prisma.league.findMany({
      where: {
        members: { some: { userId, isActive: true } },
        deletedAt: null,
      },
      include: { settings: true, _count: { select: { members: true } } },
    });
  }

  async join(leagueId: string, userId: string) {
    const league = await this.prisma.league.findUnique({ where: { id: leagueId } });
    if (!league) throw new NotFoundException('League not found');

    if (league.type === LeagueType.PRIVATE) {
      throw new ForbiddenException('This league is private — use an invite code to join');
    }

    const existing = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (existing) throw new BadRequestException('Already a member of this league');

    return this.prisma.leagueMember.create({
      data: { leagueId, userId, role: MemberRole.PLAYER, isActive: true },
    });
  }

  async approve(leagueId: string, memberId: string, adminId: string) {
    await this.assertAdmin(leagueId, adminId);

    return this.prisma.leagueMember.update({
      where: { id: memberId },
      data: { isActive: true },
    });
  }

  async generateInviteCode(leagueId: string, adminId: string) {
    await this.assertAdmin(leagueId, adminId);

    const code = randomBytes(6).toString('hex').toUpperCase();

    return this.prisma.league.update({
      where: { id: leagueId },
      data: { inviteCode: code },
      select: { inviteCode: true },
    });
  }

  async joinByCode(code: string, userId: string) {
    const league = await this.prisma.league.findUnique({ where: { inviteCode: code } });
    if (!league) throw new NotFoundException('Invalid invite code');

    const existing = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: league.id, userId } },
    });
    if (existing) throw new BadRequestException('Already a member of this league');

    return this.prisma.leagueMember.create({
      data: { leagueId: league.id, userId, role: MemberRole.PLAYER, isActive: true },
    });
  }

  async updateSettings(leagueId: string, dto: UpdateLeagueSettingsDto, adminId: string) {
    await this.assertAdmin(leagueId, adminId);

    const settings = await this.prisma.leagueSettings.findUnique({ where: { leagueId } });
    if (!settings) throw new NotFoundException('League settings not found');

    return this.prisma.leagueSettings.update({
      where: { leagueId },
      data: {
        ...(dto.sparringEnabled !== undefined && { sparringEnabled: dto.sparringEnabled }),
        ...(dto.masterLessonsEnabled !== undefined && { masterLessonsEnabled: dto.masterLessonsEnabled }),
        ...(dto.availabilityEnabled !== undefined && { availabilityEnabled: dto.availabilityEnabled }),
        ...(dto.venuesEnabled !== undefined && { venuesEnabled: dto.venuesEnabled }),
        ...(dto.sparringWeeklyCapPerPlayer !== undefined && { sparringWeeklyCapPerPlayer: dto.sparringWeeklyCapPerPlayer }),
        ...(dto.sparringPointsPerPlayer !== undefined && { sparringPointsPerPlayer: dto.sparringPointsPerPlayer }),
        ...(dto.masterXpPerSession !== undefined && { masterXpPerSession: dto.masterXpPerSession }),
      },
    });
  }

  private async assertAdmin(leagueId: string, userId: string): Promise<void> {
    const membership = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!membership || membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }
  }
}
