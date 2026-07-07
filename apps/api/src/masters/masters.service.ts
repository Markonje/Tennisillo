import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole, TrainingSessionStatus, TrainingSessionType } from '@tennisillo/db';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import type { PromoteMasterDto, UpdateMasterDto, UpdateMasterProfileDto } from './dto/master.dto';

@Injectable()
export class MastersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Admin: promote a member to MASTER with the chosen mode (spec 01 §9.2.1). */
  async promote(leagueId: string, adminId: string, dto: PromoteMasterDto) {
    const member = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: dto.userId } },
    });
    if (!member || !member.isActive) {
      throw new NotFoundException('User is not an active member of this league');
    }
    if (member.role === MemberRole.ADMIN) {
      throw new ConflictException('Admins cannot be promoted to MASTER');
    }
    if (member.role === MemberRole.MASTER) {
      throw new ConflictException('Member is already a MASTER');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const m = await tx.leagueMember.update({
        where: { id: member.id },
        data: {
          role: MemberRole.MASTER,
          masterMode: dto.masterMode,
          isAlsoPlayer: dto.masterMode === 'HYBRID',
        },
      });
      await tx.masterProfile.upsert({
        where: { userId: dto.userId },
        create: { userId: dto.userId },
        update: {},
      });
      return m;
    });

    await this.audit.record('MASTER_PROMOTED', adminId, 'LeagueMember', member.id, {
      leagueId,
      userId: dto.userId,
      masterMode: dto.masterMode,
    });
    return updated;
  }

  /** Admin: update masterMode or revoke the role. */
  async update(leagueId: string, memberId: string, adminId: string, dto: UpdateMasterDto) {
    const member = await this.prisma.leagueMember.findUnique({ where: { id: memberId } });
    if (!member || member.leagueId !== leagueId) {
      throw new NotFoundException('Member not found in this league');
    }
    if (member.role !== MemberRole.MASTER) {
      throw new BadRequestException('Member is not a MASTER');
    }

    if (dto.revoke) {
      const updated = await this.prisma.leagueMember.update({
        where: { id: memberId },
        data: { role: MemberRole.PLAYER, masterMode: null, isAlsoPlayer: false },
      });
      await this.audit.record('MASTER_REVOKED', adminId, 'LeagueMember', memberId, { leagueId });
      return updated;
    }

    if (!dto.masterMode) {
      throw new BadRequestException('masterMode or revoke required');
    }
    const updated = await this.prisma.leagueMember.update({
      where: { id: memberId },
      data: { masterMode: dto.masterMode, isAlsoPlayer: dto.masterMode === 'HYBRID' },
    });
    await this.audit.record('MASTER_MODE_UPDATED', adminId, 'LeagueMember', memberId, {
      leagueId,
      masterMode: dto.masterMode,
    });
    return updated;
  }

  /** Member: list active masters of the league. */
  async list(leagueId: string) {
    return this.prisma.leagueMember.findMany({
      where: { leagueId, role: MemberRole.MASTER, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            avatarUrl: true,
            masterProfile: true,
          },
        },
      },
    });
  }

  /** Anyone: master public profile + stats. */
  async profile(userId: string) {
    const profile = await this.prisma.masterProfile.findUnique({
      where: { userId },
      include: {
        user: { select: { displayName: true, username: true, avatarUrl: true } },
      },
    });
    if (!profile) throw new NotFoundException('Master profile not found');

    const validatedLessons = await this.prisma.trainingSession.count({
      where: {
        type: TrainingSessionType.MASTER_LESSON,
        masterId: userId,
        status: TrainingSessionStatus.VALIDATED,
      },
    });

    return { ...profile, validatedLessons };
  }

  /** Master: edit own certifications/specializations. */
  async updateOwnProfile(userId: string, dto: UpdateMasterProfileDto) {
    const profile = await this.prisma.masterProfile.upsert({
      where: { userId },
      create: {
        userId,
        certifications: dto.certifications ?? [],
        specializations: dto.specializations ?? [],
        ...(dto.yearsOfExperience !== undefined && {
          yearsOfExperience: dto.yearsOfExperience,
        }),
      },
      update: {
        ...(dto.certifications !== undefined && { certifications: dto.certifications }),
        ...(dto.specializations !== undefined && { specializations: dto.specializations }),
        ...(dto.yearsOfExperience !== undefined && {
          yearsOfExperience: dto.yearsOfExperience,
        }),
      },
    });
    await this.audit.record('MASTER_PROFILE_UPDATED', userId, 'MasterProfile', profile.id, {});
    return profile;
  }
}
