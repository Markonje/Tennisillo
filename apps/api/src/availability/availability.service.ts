import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@tennisillo/db';
import type { TimeSlot } from '@tennisillo/matchmaking-engine';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import type { UpsertPatternDto } from './dto/upsert-pattern.dto';
import type { CreateOverrideDto } from './dto/create-override.dto';

const OVERVIEW_HORIZON_DAYS = 60;

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Pattern + overrides (next 60 days) for a member; league members only. */
  async getForMember(memberId: string, requesterUserId: string) {
    const member = await this.prisma.leagueMember.findUnique({
      where: { id: memberId },
      include: { availabilityPattern: true },
    });
    if (!member) throw new NotFoundException('Member not found');

    // availability is visible to league members only (spec 01 §10.1.4)
    await this.assertSameLeague(member.leagueId, requesterUserId);

    const horizon = new Date(Date.now() + OVERVIEW_HORIZON_DAYS * 24 * 60 * 60 * 1000);
    const overrides = await this.prisma.availabilityOverride.findMany({
      where: { memberId, endsAt: { gte: new Date() }, startsAt: { lte: horizon } },
      orderBy: { startsAt: 'asc' },
    });

    return {
      memberId,
      slots: (member.availabilityPattern?.slots ?? []) as unknown as TimeSlot[],
      overrides: overrides.map((o) => ({
        id: o.id,
        type: o.type,
        startsAt: o.startsAt,
        endsAt: o.endsAt,
        note: o.note,
      })),
    };
  }

  async upsertPattern(leagueId: string, userId: string, dto: UpsertPatternDto) {
    const member = await this.resolveMember(leagueId, userId);

    for (const slot of dto.slots) {
      if (slot.endMinute <= slot.startMinute) {
        throw new BadRequestException('endMinute must be greater than startMinute');
      }
    }

    const pattern = await this.prisma.availabilityPattern.upsert({
      where: { memberId: member.id },
      create: {
        memberId: member.id,
        slots: dto.slots as unknown as Prisma.InputJsonValue,
      },
      update: { slots: dto.slots as unknown as Prisma.InputJsonValue },
    });

    await this.audit.record('AVAILABILITY_PATTERN_UPDATED', userId, 'AvailabilityPattern', pattern.id, {
      leagueId,
      slotCount: dto.slots.length,
    });

    return { memberId: member.id, slots: pattern.slots as unknown as TimeSlot[] };
  }

  async createOverride(leagueId: string, userId: string, dto: CreateOverrideDto) {
    const member = await this.resolveMember(leagueId, userId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }

    const override = await this.prisma.availabilityOverride.create({
      data: {
        memberId: member.id,
        type: dto.type,
        startsAt,
        endsAt,
        note: dto.note ?? null,
      },
    });

    await this.audit.record('AVAILABILITY_OVERRIDE_CREATED', userId, 'AvailabilityOverride', override.id, {
      leagueId,
      type: dto.type,
    });

    return override;
  }

  async deleteOverride(overrideId: string, userId: string) {
    const override = await this.prisma.availabilityOverride.findUnique({
      where: { id: overrideId },
      include: { member: true },
    });
    if (!override) throw new NotFoundException('Override not found');
    if (override.member.userId !== userId) {
      throw new ForbiddenException('You can only delete your own overrides');
    }

    await this.prisma.availabilityOverride.delete({ where: { id: overrideId } });
    await this.audit.record('AVAILABILITY_OVERRIDE_DELETED', userId, 'AvailabilityOverride', overrideId, {});
  }

  /** Collective availability map of a league (patterns of all active members). */
  async leagueOverview(leagueId: string, requesterUserId: string) {
    await this.assertSameLeague(leagueId, requesterUserId);

    const members = await this.prisma.leagueMember.findMany({
      where: { leagueId, isActive: true },
      include: {
        availabilityPattern: true,
        user: { select: { displayName: true, username: true } },
      },
    });

    return members.map((m) => ({
      memberId: m.id,
      displayName: m.user.displayName,
      username: m.user.username,
      slots: (m.availabilityPattern?.slots ?? []) as unknown as TimeSlot[],
    }));
  }

  private async resolveMember(leagueId: string, userId: string) {
    const member = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!member || !member.isActive) {
      throw new ForbiddenException('You are not a member of this league');
    }
    return member;
  }

  private async assertSameLeague(leagueId: string, userId: string) {
    const membership = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!membership || !membership.isActive) {
      throw new ForbiddenException('Availability is visible to league members only');
    }
  }
}
