import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FrequencyUnit, MatchStatus } from '@tennisillo/db';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import type { UpsertFrequencyDto } from './dto/upsert-frequency.dto';

export type TrafficLight = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';

@Injectable()
export class FrequencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Public view: traffic light only (spec 01 §10.3.3). */
  async getPublicStatus(memberId: string, requesterUserId: string) {
    const member = await this.prisma.leagueMember.findUnique({
      where: { id: memberId },
      include: { frequencyPreference: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    await this.assertSameLeague(member.leagueId, requesterUserId);

    const status = await this.computeStatus(member.id, member.frequencyPreference);
    return { memberId, status };
  }

  /** Owner view: full detail with current-period counter. */
  async getOwnDetail(leagueId: string, userId: string) {
    const member = await this.resolveMember(leagueId, userId);
    const pref = await this.prisma.playerFrequencyPreference.findUnique({
      where: { memberId: member.id },
    });

    const currentPeriodMatches = await this.countPeriodMatches(
      member.id,
      pref?.unit ?? FrequencyUnit.WEEKLY,
    );
    const status = await this.computeStatus(member.id, pref);

    return {
      memberId: member.id,
      declared: pref !== null,
      idealFrequency: pref?.idealFrequency ?? null,
      maxFrequency: pref?.maxFrequency ?? null,
      unit: pref?.unit ?? FrequencyUnit.WEEKLY,
      currentPeriodMatches,
      status,
    };
  }

  async upsert(leagueId: string, userId: string, dto: UpsertFrequencyDto) {
    if (dto.maxFrequency < dto.idealFrequency) {
      throw new BadRequestException('maxFrequency cannot be lower than idealFrequency');
    }
    const member = await this.resolveMember(leagueId, userId);

    const pref = await this.prisma.playerFrequencyPreference.upsert({
      where: { memberId: member.id },
      create: {
        memberId: member.id,
        idealFrequency: dto.idealFrequency,
        maxFrequency: dto.maxFrequency,
        unit: dto.unit ?? FrequencyUnit.WEEKLY,
      },
      update: {
        idealFrequency: dto.idealFrequency,
        maxFrequency: dto.maxFrequency,
        ...(dto.unit !== undefined && { unit: dto.unit }),
      },
    });

    await this.audit.record('FREQUENCY_UPDATED', userId, 'PlayerFrequencyPreference', pref.id, {
      leagueId,
      idealFrequency: dto.idealFrequency,
      maxFrequency: dto.maxFrequency,
    });

    return this.getOwnDetail(leagueId, userId);
  }

  /**
   * Competitive matches in the current period. Counts SCHEDULED and later
   * non-cancelled matches: a scheduled match already "occupies" frequency.
   */
  async countPeriodMatches(memberId: string, unit: FrequencyUnit): Promise<number> {
    const now = new Date();
    const periodStart = new Date(now);
    if (unit === FrequencyUnit.WEEKLY) {
      // ISO week: Monday 00:00
      const day = (now.getDay() + 6) % 7;
      periodStart.setDate(now.getDate() - day);
      periodStart.setHours(0, 0, 0, 0);
    } else {
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
    }

    const players = await this.prisma.seasonPlayer.findMany({
      where: { memberId },
      select: { id: true },
    });
    const playerIds = players.map((p) => p.id);
    if (playerIds.length === 0) return 0;

    return this.prisma.match.count({
      where: {
        OR: [{ player1Id: { in: playerIds } }, { player2Id: { in: playerIds } }],
        status: {
          in: [
            MatchStatus.SCHEDULED,
            MatchStatus.PENDING_RESULT,
            MatchStatus.PENDING_VALIDATION,
            MatchStatus.DISPUTED,
            MatchStatus.VALIDATED,
          ],
        },
        AND: [
          {
            OR: [
              { scheduledAt: { gte: periodStart } },
              { scheduledAt: null, completedAt: { gte: periodStart } },
            ],
          },
        ],
      },
    });
  }

  private async computeStatus(
    memberId: string,
    pref: { idealFrequency: number; maxFrequency: number; unit: FrequencyUnit } | null,
  ): Promise<TrafficLight> {
    if (!pref) return 'UNKNOWN';
    const current = await this.countPeriodMatches(memberId, pref.unit);
    if (current >= pref.maxFrequency) return 'RED';
    if (current >= pref.idealFrequency) return 'YELLOW';
    return 'GREEN';
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
      throw new ForbiddenException('Frequency status is visible to league members only');
    }
  }
}
