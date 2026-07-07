import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MemberRole,
  NotificationType,
  PlayerLevel,
  SeasonStatus,
  TrainingSessionStatus,
  TrainingSessionType,
  VenueStatus,
} from '@tennisillo/db';
import {
  calculateMasterLesson,
  calculateSparring,
  getIsoWeekBounds,
  xpToGlobalRatingDelta,
} from '@tennisillo/training-engine';
import { Prisma } from '@tennisillo/db';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { ScoringService } from '../scoring/scoring.service';
import type {
  DeclareLessonDto,
  DeclareSparringDto,
  RejectSessionDto,
  RevokeSessionDto,
} from './dto/training.dto';

// Badge codes awarded by the training flow (spec 01 §9.2.5 + §9.1)
const BADGES = {
  SPARRING_PARTNER: {
    code: 'SPARRING_PARTNER',
    name: 'Compagno di Banco',
    description: '10 validated sparring sessions',
    threshold: 10,
  },
  SCHOLAR: {
    code: 'SCHOLAR',
    name: 'Studioso',
    description: '10 validated master lessons',
    threshold: 10,
  },
  DEDICATED: {
    code: 'DEDICATED',
    name: 'Dedicato',
    description: '25 validated master lessons (career)',
    threshold: 25,
  },
  MENTOR: {
    code: 'MENTOR',
    name: 'Mentor',
    description: '50 lessons validated as master',
    threshold: 50,
  },
} as const;

/** Global level thresholds from spec 01 §8.2 (rating ranges). */
function levelForRating(rating: number): PlayerLevel {
  if (rating >= 3500) return PlayerLevel.ELITE;
  if (rating >= 3000) return PlayerLevel.DIAMOND;
  if (rating >= 2500) return PlayerLevel.PLATINUM;
  if (rating >= 2000) return PlayerLevel.GOLD;
  if (rating >= 1500) return PlayerLevel.SILVER;
  if (rating >= 1000) return PlayerLevel.BRONZE;
  return PlayerLevel.ROOKIE;
}

/**
 * Sparring + Master Lesson flows (spec 01 §9).
 *
 * [CRITICAL INVARIANT] This service must NEVER write to ScoreDelta or
 * HeadToHead, and must never touch SeasonPlayer.matchesPlayed / wins /
 * losses. Sparring only increments SeasonPlayer.currentPoints (fixed
 * reward); master lessons only touch the User global profile. Verified by
 * the integration test in __integration__/training.flow.int.ts.
 */
@Injectable()
export class TrainingSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly scoring: ScoringService,
  ) {}

  // ─── Sparring ─────────────────────────────────────────────────────────────

  async declareSparring(leagueId: string, userId: string, dto: DeclareSparringDto) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: { settings: true },
    });
    if (!league || !league.isActive) throw new NotFoundException('League not found');
    if (league.settings && !league.settings.sparringEnabled) {
      throw new ConflictException('Sparring is disabled in this league');
    }

    const declarer = await this.resolveMember(leagueId, userId);
    const partner = await this.prisma.leagueMember.findUnique({
      where: { id: dto.player2MemberId },
      include: { user: { select: { id: true, displayName: true } } },
    });
    if (!partner || partner.leagueId !== leagueId || !partner.isActive) {
      throw new NotFoundException('Partner is not an active member of this league');
    }
    if (partner.userId === userId) {
      throw new BadRequestException('You cannot declare sparring with yourself');
    }

    // sparring points land on the active season ranking → both must be registered
    const season = await this.prisma.season.findFirst({
      where: { leagueId, status: SeasonStatus.ACTIVE },
    });
    if (!season) throw new ConflictException('No active season in this league');
    await this.assertRegistered(season.id, declarer.id);
    await this.assertRegistered(season.id, partner.id);

    if (dto.venueId) {
      const venue = await this.prisma.venue.findUnique({ where: { id: dto.venueId } });
      if (!venue || venue.leagueId !== leagueId || venue.status !== VenueStatus.ACTIVE) {
        throw new BadRequestException('venueId must reference an active venue of this league');
      }
    }

    // anti-spam at declaration: pending + validated both count against the cap
    const cap = league.settings?.sparringWeeklyCapPerPlayer ?? 2;
    const declarerCount = await this.countSparringThisWeek(userId, leagueId, true);
    const partnerCount = await this.countSparringThisWeek(partner.userId, leagueId, true);
    if (declarerCount >= cap || partnerCount >= cap) {
      await this.notify(userId, NotificationType.SPARRING_CAP_REACHED, { leagueId, cap });
      throw new ConflictException(`Weekly sparring cap reached (${cap})`);
    }

    const session = await this.prisma.trainingSession.create({
      data: {
        leagueId,
        seasonId: season.id,
        type: TrainingSessionType.SPARRING,
        player1Id: userId,
        player2Id: partner.userId,
        ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.venueId !== undefined && { venueId: dto.venueId }),
        ...(dto.focusNote !== undefined && { focusNote: dto.focusNote }),
      },
    });

    await this.notify(partner.userId, NotificationType.SPARRING_PENDING_CONFIRM, {
      leagueId,
      sessionId: session.id,
    });
    await this.audit.record('SPARRING_DECLARED', userId, 'TrainingSession', session.id, {
      leagueId,
      partnerId: partner.userId,
    });
    return session;
  }

  async confirmSparring(sessionId: string, userId: string) {
    const session = await this.getSessionOrThrow(sessionId);
    this.assertType(session, TrainingSessionType.SPARRING);
    this.assertStatus(session, TrainingSessionStatus.PENDING_VALIDATION);
    if (session.player2Id !== userId) {
      throw new ForbiddenException('Only the sparring partner can confirm the session');
    }

    const settings = await this.prisma.leagueSettings.findUnique({
      where: { leagueId: session.leagueId },
    });
    const output = calculateSparring({
      config: {
        pointsPerPlayer: settings?.sparringPointsPerPlayer ?? 12,
        weeklyCapPerPlayer: settings?.sparringWeeklyCapPerPlayer ?? 2,
      },
      player1Id: session.player1Id,
      player2Id: session.player2Id ?? '',
      player1SparringThisWeek: await this.countSparringThisWeek(
        session.player1Id,
        session.leagueId,
        false,
        session.id,
      ),
      player2SparringThisWeek: await this.countSparringThisWeek(
        session.player2Id ?? '',
        session.leagueId,
        false,
        session.id,
      ),
    });

    if (!output.accepted) {
      throw new ConflictException(`Sparring cannot be validated: ${output.rejectionReason}`);
    }
    if (!session.seasonId) throw new ConflictException('Sparring session has no season');
    const seasonId = session.seasonId;

    // [CRITICAL] fixed points on currentPoints ONLY — no ScoreDelta, no
    // HeadToHead, no matchesPlayed/wins/losses, no streak effects
    const updated = await this.prisma.$transaction(async (tx) => {
      for (const [memberUserId, points] of [
        [session.player1Id, output.pointsP1],
        [session.player2Id as string, output.pointsP2],
      ] as const) {
        const member = await tx.leagueMember.findUnique({
          where: { leagueId_userId: { leagueId: session.leagueId, userId: memberUserId } },
          select: { id: true },
        });
        if (!member) throw new NotFoundException('League membership not found');
        await tx.seasonPlayer.update({
          where: { seasonId_memberId: { seasonId, memberId: member.id } },
          data: { currentPoints: { increment: points } },
        });
      }
      return tx.trainingSession.update({
        where: { id: sessionId },
        data: {
          status: TrainingSessionStatus.VALIDATED,
          pointsAwarded: output.pointsP1,
          validatedById: userId,
          validatedAt: new Date(),
        },
      });
    });
    await this.scoring.refreshRanking(seasonId);

    await this.notify(session.player1Id, NotificationType.SPARRING_CONFIRMED, {
      leagueId: session.leagueId,
      sessionId,
      points: output.pointsP1,
    });
    await this.audit.record('SPARRING_VALIDATED', userId, 'TrainingSession', sessionId, {
      leagueId: session.leagueId,
      pointsPerPlayer: output.pointsP1,
    });

    await this.maybeAwardSparringBadge(session.player1Id);
    await this.maybeAwardSparringBadge(session.player2Id);

    return updated;
  }

  async rejectSparring(sessionId: string, userId: string, dto: RejectSessionDto) {
    const session = await this.getSessionOrThrow(sessionId);
    this.assertType(session, TrainingSessionType.SPARRING);
    this.assertStatus(session, TrainingSessionStatus.PENDING_VALIDATION);
    if (session.player2Id !== userId) {
      throw new ForbiddenException('Only the sparring partner can reject the session');
    }

    const updated = await this.prisma.trainingSession.update({
      where: { id: sessionId },
      data: { status: TrainingSessionStatus.REJECTED, rejectedReason: dto.reason },
    });
    await this.audit.record('SPARRING_REJECTED', userId, 'TrainingSession', sessionId, {
      reason: dto.reason,
    });
    return updated;
  }

  // ─── Master lesson ────────────────────────────────────────────────────────

  async declareLesson(leagueId: string, userId: string, dto: DeclareLessonDto) {
    const league = await this.prisma.league.findUnique({
      where: { id: leagueId },
      include: { settings: true },
    });
    if (!league || !league.isActive) throw new NotFoundException('League not found');
    if (league.settings && !league.settings.masterLessonsEnabled) {
      throw new ConflictException('Master lessons are disabled in this league');
    }

    await this.resolveMember(leagueId, userId);
    if (dto.masterId === userId) {
      throw new BadRequestException('You cannot declare a lesson with yourself');
    }
    const masterMember = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: dto.masterId } },
    });
    if (!masterMember || !masterMember.isActive || masterMember.role !== MemberRole.MASTER) {
      throw new BadRequestException('masterId must be an active MASTER of this league');
    }

    const session = await this.prisma.trainingSession.create({
      data: {
        leagueId,
        type: TrainingSessionType.MASTER_LESSON,
        player1Id: userId,
        masterId: dto.masterId,
        ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
        ...(dto.focusNote !== undefined && { focusNote: dto.focusNote }),
        ...(dto.venueId !== undefined && { venueId: dto.venueId }),
      },
    });

    await this.notify(dto.masterId, NotificationType.MASTER_LESSON_PENDING_VALIDATION, {
      leagueId,
      sessionId: session.id,
    });
    await this.audit.record('MASTER_LESSON_DECLARED', userId, 'TrainingSession', session.id, {
      leagueId,
      masterId: dto.masterId,
    });
    return session;
  }

  async validateLesson(sessionId: string, masterUserId: string) {
    const session = await this.getSessionOrThrow(sessionId);
    this.assertType(session, TrainingSessionType.MASTER_LESSON);
    this.assertStatus(session, TrainingSessionStatus.PENDING_VALIDATION);
    if (session.masterId !== masterUserId) {
      throw new ForbiddenException('Only the designated master can validate this lesson');
    }

    const settings = await this.prisma.leagueSettings.findUnique({
      where: { leagueId: session.leagueId },
    });
    const player = await this.prisma.user.findUnique({ where: { id: session.player1Id } });
    if (!player) throw new NotFoundException('Player not found');

    const output = calculateMasterLesson({
      config: { xpPerSession: settings?.masterXpPerSession ?? 20 },
      playerId: session.player1Id,
      masterId: masterUserId,
      playerCurrentXp: player.globalExperiencePoints,
    });

    // [CRITICAL] XP/rating land on the GLOBAL profile only — never on
    // SeasonRanking, SeasonPlayer or league rating
    const newRating = player.globalRating + output.globalRatingDelta;
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: session.player1Id },
        data: {
          globalExperiencePoints: { increment: output.xpAwarded },
          globalRating: newRating,
          globalLevel: levelForRating(newRating),
        },
      });
      await tx.masterProfile.upsert({
        where: { userId: masterUserId },
        create: { userId: masterUserId, totalLessonsValidated: 1 },
        update: { totalLessonsValidated: { increment: 1 } },
      });
      return tx.trainingSession.update({
        where: { id: sessionId },
        data: {
          status: TrainingSessionStatus.VALIDATED,
          xpAwarded: output.xpAwarded,
          validatedById: masterUserId,
          validatedAt: new Date(),
        },
      });
    });

    await this.notify(session.player1Id, NotificationType.MASTER_LESSON_VALIDATED, {
      leagueId: session.leagueId,
      sessionId,
      xp: output.xpAwarded,
    });
    await this.audit.record('MASTER_LESSON_VALIDATED', masterUserId, 'TrainingSession', sessionId, {
      xpAwarded: output.xpAwarded,
      globalRatingDelta: output.globalRatingDelta,
    });

    await this.maybeAwardLessonBadges(session.player1Id);
    await this.maybeAwardMentorBadge(masterUserId);

    return updated;
  }

  async rejectLesson(sessionId: string, masterUserId: string, dto: RejectSessionDto) {
    const session = await this.getSessionOrThrow(sessionId);
    this.assertType(session, TrainingSessionType.MASTER_LESSON);
    this.assertStatus(session, TrainingSessionStatus.PENDING_VALIDATION);
    if (session.masterId !== masterUserId) {
      throw new ForbiddenException('Only the designated master can reject this lesson');
    }

    const updated = await this.prisma.trainingSession.update({
      where: { id: sessionId },
      data: { status: TrainingSessionStatus.REJECTED, rejectedReason: dto.reason },
    });
    await this.notify(session.player1Id, NotificationType.MASTER_LESSON_REJECTED, {
      leagueId: session.leagueId,
      sessionId,
      reason: dto.reason,
    });
    await this.audit.record('MASTER_LESSON_REJECTED', masterUserId, 'TrainingSession', sessionId, {
      reason: dto.reason,
    });
    return updated;
  }

  // ─── Admin revoke (spec 01 §9.2.4) ────────────────────────────────────────

  async revoke(sessionId: string, adminUserId: string, dto: RevokeSessionDto) {
    const session = await this.getSessionOrThrow(sessionId);
    this.assertStatus(session, TrainingSessionStatus.VALIDATED);

    await this.prisma.$transaction(async (tx) => {
      if (session.type === TrainingSessionType.SPARRING && session.seasonId) {
        // reverse the fixed points (floor at 0)
        for (const memberUserId of [session.player1Id, session.player2Id ?? '']) {
          const member = await tx.leagueMember.findUnique({
            where: { leagueId_userId: { leagueId: session.leagueId, userId: memberUserId } },
            select: { id: true },
          });
          if (!member) continue;
          const sp = await tx.seasonPlayer.findUnique({
            where: { seasonId_memberId: { seasonId: session.seasonId, memberId: member.id } },
          });
          if (!sp) continue;
          await tx.seasonPlayer.update({
            where: { id: sp.id },
            data: { currentPoints: Math.max(0, sp.currentPoints - session.pointsAwarded) },
          });
        }
      } else if (session.type === TrainingSessionType.MASTER_LESSON) {
        const player = await tx.user.findUnique({ where: { id: session.player1Id } });
        if (player) {
          // approximate reversal of the curve delta using the XP level before the award
          const xpBefore = Math.max(0, player.globalExperiencePoints - session.xpAwarded);
          const delta = xpToGlobalRatingDelta(session.xpAwarded, xpBefore);
          const newRating = Math.max(0, player.globalRating - delta);
          await tx.user.update({
            where: { id: session.player1Id },
            data: {
              globalExperiencePoints: Math.max(0, player.globalExperiencePoints - session.xpAwarded),
              globalRating: newRating,
              globalLevel: levelForRating(newRating),
            },
          });
        }
        if (session.masterId) {
          await tx.masterProfile.updateMany({
            where: { userId: session.masterId, totalLessonsValidated: { gt: 0 } },
            data: { totalLessonsValidated: { decrement: 1 } },
          });
        }
      }

      await tx.trainingSession.update({
        where: { id: sessionId },
        data: {
          status: TrainingSessionStatus.REVOKED,
          revokedById: adminUserId,
          revokedAt: new Date(),
          revokedReason: dto.reason,
        },
      });
    });

    if (session.type === TrainingSessionType.SPARRING && session.seasonId) {
      await this.scoring.refreshRanking(session.seasonId);
    }

    for (const target of [session.player1Id, session.player2Id, session.masterId]) {
      if (target && target !== adminUserId) {
        await this.notify(target, NotificationType.MASTER_LESSON_REJECTED, {
          leagueId: session.leagueId,
          sessionId,
          event: 'TRAINING_SESSION_REVOKED',
          reason: dto.reason,
        });
      }
    }
    await this.audit.record('TRAINING_SESSION_REVOKED', adminUserId, 'TrainingSession', sessionId, {
      type: session.type,
      reason: dto.reason,
    });

    return this.getSessionOrThrow(sessionId);
  }

  // ─── Reads ────────────────────────────────────────────────────────────────

  async getSession(sessionId: string) {
    return this.getSessionOrThrow(sessionId);
  }

  async listByLeague(leagueId: string, userId: string, filterUserId?: string) {
    await this.resolveMember(leagueId, userId);
    return this.prisma.trainingSession.findMany({
      where: {
        leagueId,
        ...(filterUserId && {
          OR: [
            { player1Id: filterUserId },
            { player2Id: filterUserId },
            { masterId: filterUserId },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        player1: { select: { id: true, displayName: true, username: true } },
        player2: { select: { id: true, displayName: true, username: true } },
        master: { select: { id: true, displayName: true, username: true } },
        venue: { select: { id: true, name: true } },
      },
    });
  }

  async listMyLessons(userId: string) {
    return this.prisma.trainingSession.findMany({
      where: { type: TrainingSessionType.MASTER_LESSON, player1Id: userId },
      orderBy: { createdAt: 'desc' },
      include: { master: { select: { id: true, displayName: true, username: true } } },
    });
  }

  async globalXp(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        globalExperiencePoints: true,
        globalRating: true,
        globalLevel: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');

    const lessons = await this.prisma.trainingSession.findMany({
      where: {
        type: TrainingSessionType.MASTER_LESSON,
        player1Id: userId,
        status: TrainingSessionStatus.VALIDATED,
      },
      include: { master: { select: { id: true, displayName: true } } },
    });

    const mastersWorkedWith = [
      ...new Map(
        lessons
          .filter((l) => l.master)
          .map((l) => [l.master?.id as string, l.master?.displayName as string]),
      ).entries(),
    ].map(([id, displayName]) => ({ id, displayName }));

    return {
      totalXp: user.globalExperiencePoints,
      globalRating: user.globalRating,
      globalLevel: user.globalLevel,
      validatedLessons: lessons.length,
      mastersWorkedWith,
    };
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  /** Validated (and optionally pending) sparring for a user in the current ISO week. */
  private async countSparringThisWeek(
    userId: string,
    leagueId: string,
    includePending: boolean,
    excludeSessionId?: string,
  ): Promise<number> {
    const { start, end } = getIsoWeekBounds(new Date());
    return this.prisma.trainingSession.count({
      where: {
        leagueId,
        type: TrainingSessionType.SPARRING,
        status: includePending
          ? { in: [TrainingSessionStatus.VALIDATED, TrainingSessionStatus.PENDING_VALIDATION] }
          : TrainingSessionStatus.VALIDATED,
        createdAt: { gte: start, lte: end },
        OR: [{ player1Id: userId }, { player2Id: userId }],
        ...(excludeSessionId && { id: { not: excludeSessionId } }),
      },
    });
  }

  private async maybeAwardSparringBadge(userId: string) {
    const count = await this.prisma.trainingSession.count({
      where: {
        type: TrainingSessionType.SPARRING,
        status: TrainingSessionStatus.VALIDATED,
        OR: [{ player1Id: userId }, { player2Id: userId }],
      },
    });
    if (count >= BADGES.SPARRING_PARTNER.threshold) {
      await this.award(userId, BADGES.SPARRING_PARTNER);
    }
  }

  private async maybeAwardLessonBadges(userId: string) {
    const count = await this.prisma.trainingSession.count({
      where: {
        type: TrainingSessionType.MASTER_LESSON,
        status: TrainingSessionStatus.VALIDATED,
        player1Id: userId,
      },
    });
    if (count >= BADGES.SCHOLAR.threshold) await this.award(userId, BADGES.SCHOLAR);
    if (count >= BADGES.DEDICATED.threshold) await this.award(userId, BADGES.DEDICATED);
  }

  private async maybeAwardMentorBadge(masterUserId: string) {
    const profile = await this.prisma.masterProfile.findUnique({
      where: { userId: masterUserId },
    });
    if ((profile?.totalLessonsValidated ?? 0) >= BADGES.MENTOR.threshold) {
      await this.award(masterUserId, BADGES.MENTOR);
    }
  }

  private async award(
    userId: string,
    badge: { code: string; name: string; description: string },
  ) {
    const achievement = await this.prisma.achievement.upsert({
      where: { code: badge.code },
      create: {
        code: badge.code,
        name: badge.name,
        description: badge.description,
        category: 'TRAINING',
      },
      update: {},
    });
    const existing = await this.prisma.userAchievement.findFirst({
      where: { userId, achievementId: achievement.id, leagueId: null },
    });
    if (existing) return;
    await this.prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    });
    await this.notify(userId, NotificationType.BADGE_EARNED, {
      code: badge.code,
      name: badge.name,
    });
  }

  private async getSessionOrThrow(sessionId: string) {
    const session = await this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
      include: {
        player1: { select: { id: true, displayName: true, username: true } },
        player2: { select: { id: true, displayName: true, username: true } },
        master: { select: { id: true, displayName: true, username: true } },
        venue: { select: { id: true, name: true } },
      },
    });
    if (!session) throw new NotFoundException('Training session not found');
    return session;
  }

  private assertType(session: { type: TrainingSessionType }, type: TrainingSessionType) {
    if (session.type !== type) {
      throw new BadRequestException(`Session is not of type ${type}`);
    }
  }

  private assertStatus(
    session: { status: TrainingSessionStatus },
    status: TrainingSessionStatus,
  ) {
    if (session.status !== status) {
      throw new ConflictException(`Action requires status ${status} (session is ${session.status})`);
    }
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

  private async assertRegistered(seasonId: string, memberId: string) {
    const player = await this.prisma.seasonPlayer.findUnique({
      where: { seasonId_memberId: { seasonId, memberId } },
    });
    if (!player) {
      throw new ConflictException('Both players must be registered in the active season');
    }
  }

  private async notify(userId: string, type: NotificationType, payload: Record<string, unknown>) {
    await this.prisma.notification.create({
      data: { userId, type, payload: payload as Prisma.InputJsonValue },
    });
  }
}
