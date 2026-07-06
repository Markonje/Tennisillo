import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DisputeStatus,
  MatchStatus,
  NotificationType,
  Prisma,
  SeasonStatus,
} from '@tennisillo/db';
import { pairMatchLimit } from '@tennisillo/scoring-engine';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { ScoringQueueService } from '../scoring/scoring-queue.service';
import { MatchQueueService } from './match-queue.service';
import { validateScore, type SetScore } from './utils/score-validation';
import type { CreateChallengeDto } from './dto/create-challenge.dto';
import type { AcceptChallengeDto } from './dto/accept-challenge.dto';
import type { RescheduleMatchDto } from './dto/reschedule-match.dto';
import type { SubmitResultDto } from './dto/submit-result.dto';
import type { OpenDisputeDto } from './dto/open-dispute.dto';
import type { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import type { ListMatchesQuery } from './dto/list-matches.query';

const MAX_OPEN_CHALLENGES = 3;

const playerInclude = {
  member: {
    include: {
      user: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
    },
  },
} satisfies Prisma.SeasonPlayerInclude;

const matchInclude = {
  player1: { include: playerInclude },
  player2: { include: playerInclude },
  result: true,
  validation: true,
  dispute: true,
  scoreDeltas: true,
  season: { select: { id: true, leagueId: true, status: true, name: true } },
} satisfies Prisma.MatchInclude;

type MatchWithRelations = Prisma.MatchGetPayload<{ include: typeof matchInclude }>;

export interface SerializedMatchPlayer {
  id: string;
  memberId: string;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

export interface SerializedMatch {
  id: string;
  seasonId: string;
  leagueId: string;
  status: MatchStatus;
  format: MatchWithRelations['format'];
  challengerId: string;
  player1: SerializedMatchPlayer;
  player2: SerializedMatchPlayer;
  scheduledAt: Date | null;
  venueTextFallback: string | null;
  completedAt: Date | null;
  resultWindowExpiresAt: Date | null;
  createdAt: Date;
  result: {
    sets: unknown;
    winnerId: string;
    submittedById: string;
    submittedAt: Date;
    plausibilityPassed: boolean;
    plausibilityNotes: string | null;
  } | null;
  validation: {
    validatedById: string;
    validatedAt: Date;
    autoValidated: boolean;
  } | null;
  dispute: {
    status: DisputeStatus;
    openedById: string;
    resolvedById: string | null;
    resolution: string | null;
    createdAt: Date;
  } | null;
  scoreDeltas: {
    playerId: string;
    deltaPoints: number;
    breakdown: unknown;
    computedAt: Date;
  }[];
}

@Injectable()
export class MatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly queue: MatchQueueService,
    private readonly scoringQueue: ScoringQueueService,
  ) {}

  // ─── Challenge creation ────────────────────────────────────────────────────

  async createChallenge(seasonId: string, userId: string, dto: CreateChallengeDto) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { settings: true },
    });
    if (!season) throw new NotFoundException('Season not found');
    if (season.status !== SeasonStatus.ACTIVE) {
      throw new ConflictException('Challenges can only be created in an ACTIVE season');
    }

    const challenger = await this.resolvePlayer(seasonId, season.leagueId, userId);
    if (!challenger.isEligible) {
      throw new ForbiddenException('You are not eligible to play in this season');
    }

    const opponent = await this.prisma.seasonPlayer.findUnique({
      where: { id: dto.opponentPlayerId },
      include: playerInclude,
    });
    if (!opponent || opponent.seasonId !== seasonId) {
      throw new NotFoundException('Opponent is not registered in this season');
    }
    if (opponent.id === challenger.id) {
      throw new BadRequestException('You cannot challenge yourself');
    }
    if (!opponent.isEligible) {
      throw new ConflictException('Opponent is not eligible to play in this season');
    }

    const openChallenges = await this.prisma.match.count({
      where: {
        seasonId,
        challengerId: userId,
        status: MatchStatus.PENDING_ACCEPTANCE,
      },
    });
    if (openChallenges >= MAX_OPEN_CHALLENGES) {
      throw new ConflictException(
        `You already have ${MAX_OPEN_CHALLENGES} open challenges in this season`,
      );
    }

    // per-pair season limit (spec §6.4/§8.9): dynamic on league size, admin ±1
    const pairWhere = {
      seasonId,
      OR: [
        { player1Id: challenger.id, player2Id: opponent.id },
        { player1Id: opponent.id, player2Id: challenger.id },
      ],
    };
    const [pairMatches, activePlayers] = await Promise.all([
      this.prisma.match.count({
        where: { ...pairWhere, status: { notIn: [MatchStatus.CANCELLED] } },
      }),
      this.prisma.seasonPlayer.count({ where: { seasonId, isEligible: true } }),
    ]);
    const pairLimit =
      season.settings?.pairLimitOverride && season.settings.pairLimitOverride > 0
        ? season.settings.pairLimitOverride
        : pairMatchLimit(activePlayers);
    if (pairMatches >= pairLimit) {
      throw new ConflictException(
        `Pair match limit reached for this season (${pairLimit})`,
      );
    }

    // rematch cooldown (spec §6.4): configurable days since the last
    // validated match between the same pair
    const cooldownDays = season.settings?.h2hCooldownDays ?? 7;
    if (cooldownDays > 0) {
      const lastPairMatch = await this.prisma.match.findFirst({
        where: { ...pairWhere, status: MatchStatus.VALIDATED },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      });
      if (lastPairMatch?.completedAt) {
        const elapsedMs = Date.now() - lastPairMatch.completedAt.getTime();
        if (elapsedMs < cooldownDays * 24 * 60 * 60 * 1000) {
          throw new ConflictException(
            `Rematch cooldown active: wait ${cooldownDays} days between matches against the same opponent`,
          );
        }
      }
    }

    if (dto.scheduledAt && new Date(dto.scheduledAt) <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const match = await this.prisma.match.create({
      data: {
        seasonId,
        player1Id: challenger.id,
        player2Id: opponent.id,
        challengerId: userId,
        status: MatchStatus.PENDING_ACCEPTANCE,
        ...(dto.format !== undefined && { format: dto.format }),
        ...(dto.scheduledAt !== undefined && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.venueTextFallback !== undefined && { venueTextFallback: dto.venueTextFallback }),
      },
      include: matchInclude,
    });

    await this.notify(opponent.member.user.id, NotificationType.CHALLENGE_RECEIVED, {
      matchId: match.id,
      seasonId,
      leagueId: season.leagueId,
      challengerName: challenger.member.user.displayName,
      message: dto.message ?? null,
    });
    await this.audit.record('CHALLENGE_CREATED', userId, 'Match', match.id, {
      seasonId,
      opponentPlayerId: opponent.id,
    });

    return this.serialize(match);
  }

  // ─── Reads ─────────────────────────────────────────────────────────────────

  async listBySeason(seasonId: string, query: ListMatchesQuery) {
    const season = await this.prisma.season.findUnique({ where: { id: seasonId } });
    if (!season) throw new NotFoundException('Season not found');

    await this.rollDueStatuses(seasonId);

    const matches = await this.prisma.match.findMany({
      where: {
        seasonId,
        ...(query.status !== undefined && { status: query.status }),
        ...(query.playerId !== undefined && {
          OR: [{ player1Id: query.playerId }, { player2Id: query.playerId }],
        }),
        ...((query.from !== undefined || query.to !== undefined) && {
          scheduledAt: {
            ...(query.from !== undefined && { gte: new Date(query.from) }),
            ...(query.to !== undefined && { lte: new Date(query.to) }),
          },
        }),
      },
      orderBy: [{ scheduledAt: { sort: 'desc', nulls: 'first' } }, { createdAt: 'desc' }],
      include: matchInclude,
    });

    return matches.map((m) => this.serialize(m));
  }

  async getMatch(matchId: string) {
    let match = await this.getMatchOrThrow(matchId);
    match = (await this.applyLazyTransitions(match)) ?? match;
    return this.serialize(match);
  }

  // ─── Challenge lifecycle ───────────────────────────────────────────────────

  async acceptChallenge(matchId: string, userId: string, dto: AcceptChallengeDto) {
    const match = await this.getMatchOrThrow(matchId);
    this.assertStatus(match, [MatchStatus.PENDING_ACCEPTANCE]);
    this.assertIsChallenged(match, userId);

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : match.scheduledAt;
    if (!scheduledAt) {
      throw new BadRequestException('A scheduled date is required to accept the challenge');
    }
    if (dto.scheduledAt && scheduledAt <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.SCHEDULED,
        scheduledAt,
        ...(dto.venueTextFallback !== undefined && { venueTextFallback: dto.venueTextFallback }),
      },
      include: matchInclude,
    });

    await this.notify(match.challengerId, NotificationType.CHALLENGE_ACCEPTED, {
      matchId,
      seasonId: match.seasonId,
      leagueId: match.season.leagueId,
      scheduledAt: scheduledAt.toISOString(),
    });
    await this.audit.record('CHALLENGE_ACCEPTED', userId, 'Match', matchId, {
      scheduledAt: scheduledAt.toISOString(),
    });

    return this.serialize(updated);
  }

  async declineChallenge(matchId: string, userId: string) {
    const match = await this.getMatchOrThrow(matchId);
    this.assertStatus(match, [MatchStatus.PENDING_ACCEPTANCE]);
    this.assertIsChallenged(match, userId);

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.CANCELLED },
      include: matchInclude,
    });

    await this.notify(match.challengerId, NotificationType.CHALLENGE_DECLINED, {
      matchId,
      seasonId: match.seasonId,
      leagueId: match.season.leagueId,
    });
    await this.audit.record('CHALLENGE_DECLINED', userId, 'Match', matchId, {});

    return this.serialize(updated);
  }

  async cancelMatch(matchId: string, userId: string) {
    const match = await this.getMatchOrThrow(matchId);
    this.assertStatus(match, [MatchStatus.PENDING_ACCEPTANCE, MatchStatus.SCHEDULED]);
    this.assertIsParticipant(match, userId);

    // withdrawing an unanswered challenge is only for the challenger
    if (match.status === MatchStatus.PENDING_ACCEPTANCE && match.challengerId !== userId) {
      throw new ForbiddenException('Only the challenger can withdraw a pending challenge');
    }

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: { status: MatchStatus.CANCELLED },
      include: matchInclude,
    });

    const other = this.otherParticipantUserId(match, userId);
    if (match.status === MatchStatus.SCHEDULED) {
      await this.notify(other, NotificationType.MATCH_REMINDER, {
        matchId,
        seasonId: match.seasonId,
        leagueId: match.season.leagueId,
        event: 'MATCH_CANCELLED',
      });
    }
    await this.audit.record('MATCH_CANCELLED', userId, 'Match', matchId, {
      previousStatus: match.status,
    });

    return this.serialize(updated);
  }

  async rescheduleMatch(matchId: string, userId: string, dto: RescheduleMatchDto) {
    const match = await this.getMatchOrThrow(matchId);
    this.assertStatus(match, [MatchStatus.SCHEDULED]);
    this.assertIsParticipant(match, userId);

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('scheduledAt must be in the future');
    }

    const updated = await this.prisma.match.update({
      where: { id: matchId },
      data: {
        scheduledAt,
        ...(dto.venueTextFallback !== undefined && { venueTextFallback: dto.venueTextFallback }),
      },
      include: matchInclude,
    });

    await this.notify(this.otherParticipantUserId(match, userId), NotificationType.MATCH_REMINDER, {
      matchId,
      seasonId: match.seasonId,
      leagueId: match.season.leagueId,
      event: 'MATCH_RESCHEDULED',
      scheduledAt: scheduledAt.toISOString(),
    });
    await this.audit.record('MATCH_RESCHEDULED', userId, 'Match', matchId, {
      scheduledAt: scheduledAt.toISOString(),
    });

    return this.serialize(updated);
  }

  // ─── Result & validation ───────────────────────────────────────────────────

  async submitResult(matchId: string, userId: string, dto: SubmitResultDto) {
    const match = await this.getMatchOrThrow(matchId);
    this.assertStatus(match, [MatchStatus.SCHEDULED, MatchStatus.PENDING_RESULT]);
    this.assertIsParticipant(match, userId);

    const sets: SetScore[] = dto.sets.map((s) => ({ p1: s.p1, p2: s.p2 }));
    const check = validateScore(sets, match.format);
    if (!check.valid || check.winner === null) {
      throw new BadRequestException({
        message: 'Implausible score',
        errors: check.errors,
      });
    }
    const winnerId = check.winner === 1 ? match.player1Id : match.player2Id;

    // time-window flags (specs/01 §7.2.2): out-of-window results are flagged
    // for review, never rejected
    const settings = await this.getSeasonSettings(match.seasonId);
    const now = new Date();
    const flags: string[] = [];
    if (match.scheduledAt) {
      if (now < match.scheduledAt) {
        flags.push('Result submitted before the scheduled match time');
      } else {
        const windowMs = settings.resultWindowHours * 60 * 60 * 1000;
        if (now.getTime() - match.scheduledAt.getTime() > windowMs) {
          flags.push(`Result submitted more than ${settings.resultWindowHours}h after the scheduled time`);
        }
      }
    }

    const autoConfirmEnabled = settings.autoConfirmHours > 0;
    const expiresAt = autoConfirmEnabled
      ? new Date(now.getTime() + settings.autoConfirmHours * 60 * 60 * 1000)
      : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.matchResult.create({
        data: {
          matchId,
          sets: sets as unknown as Prisma.InputJsonValue,
          winnerId,
          submittedById: userId,
          plausibilityPassed: flags.length === 0,
          plausibilityNotes: flags.length > 0 ? flags.join('; ') : null,
        },
      });
      return tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.PENDING_VALIDATION,
          resultWindowExpiresAt: expiresAt,
        },
        include: matchInclude,
      });
    });

    if (expiresAt) {
      await this.queue.scheduleAutoConfirm(matchId, expiresAt);
    }

    await this.notify(
      this.otherParticipantUserId(match, userId),
      NotificationType.RESULT_PENDING_VALIDATION,
      {
        matchId,
        seasonId: match.seasonId,
        leagueId: match.season.leagueId,
        expiresAt: expiresAt?.toISOString() ?? null,
      },
    );
    await this.audit.record('MATCH_RESULT_SUBMITTED', userId, 'Match', matchId, {
      sets: sets as unknown as Prisma.InputJsonValue,
      winnerId,
      flags,
    });

    return this.serialize(updated);
  }

  async confirmResult(matchId: string, userId: string) {
    const match = await this.getMatchOrThrow(matchId);

    // if the window already expired, lazy auto-confirm wins over manual confirm
    const rolled = await this.applyLazyTransitions(match);
    if (rolled && rolled.status === MatchStatus.VALIDATED) return this.serialize(rolled);

    this.assertStatus(match, [MatchStatus.PENDING_VALIDATION]);
    this.assertIsParticipant(match, userId);
    if (!match.result) throw new ConflictException('No result to confirm');
    if (match.result.submittedById === userId) {
      throw new ForbiddenException('The result submitter cannot confirm their own result');
    }

    const updated = await this.finalizeValidation(match, userId, false);

    await this.audit.record('MATCH_VALIDATED', userId, 'Match', matchId, {
      winnerId: match.result.winnerId,
    });

    return this.serialize(updated);
  }

  async openDispute(matchId: string, userId: string, dto: OpenDisputeDto) {
    const match = await this.getMatchOrThrow(matchId);

    const rolled = await this.applyLazyTransitions(match);
    if (rolled && rolled.status === MatchStatus.VALIDATED) {
      throw new ConflictException('Result was already auto-confirmed');
    }

    this.assertStatus(match, [MatchStatus.PENDING_VALIDATION]);
    this.assertIsParticipant(match, userId);
    if (!match.result) throw new ConflictException('No result to dispute');
    if (match.result.submittedById === userId) {
      throw new ForbiddenException('The result submitter cannot dispute their own result');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.dispute.create({
        data: { matchId, openedById: userId, status: DisputeStatus.OPEN },
      });
      return tx.match.update({
        where: { id: matchId },
        data: { status: MatchStatus.DISPUTED, resultWindowExpiresAt: null },
        include: matchInclude,
      });
    });

    await this.queue.cancelAutoConfirm(matchId);

    await this.notify(match.result.submittedById, NotificationType.DISPUTE_OPENED, {
      matchId,
      seasonId: match.seasonId,
      leagueId: match.season.leagueId,
      reason: dto.reason,
    });
    await this.audit.record('DISPUTE_OPENED', userId, 'Match', matchId, {
      reason: dto.reason,
    });

    return this.serialize(updated);
  }

  async resolveDispute(matchId: string, adminUserId: string, dto: ResolveDisputeDto) {
    const match = await this.getMatchOrThrow(matchId);
    this.assertStatus(match, [MatchStatus.DISPUTED]);
    if (!match.dispute || match.dispute.status !== DisputeStatus.OPEN) {
      throw new ConflictException('No open dispute on this match');
    }

    let updated: MatchWithRelations;
    if (dto.decision === 'REJECTED') {
      // dispute unfounded: the submitted result stands
      if (!match.result) throw new ConflictException('No result on this match');
      updated = await this.prisma.$transaction(async (tx) => {
        await tx.dispute.update({
          where: { matchId },
          data: {
            status: DisputeStatus.DISMISSED,
            resolvedById: adminUserId,
            resolution: dto.resolution,
          },
        });
        return this.finalizeValidationTx(tx, match, adminUserId, false);
      });
      await this.scoringQueue.scheduleScoring(matchId);
    } else {
      // dispute upheld: discard the result, back to PENDING_RESULT
      updated = await this.prisma.$transaction(async (tx) => {
        await tx.dispute.update({
          where: { matchId },
          data: {
            status: DisputeStatus.RESOLVED,
            resolvedById: adminUserId,
            resolution: dto.resolution,
          },
        });
        await tx.matchResult.delete({ where: { matchId } });
        return tx.match.update({
          where: { id: matchId },
          data: { status: MatchStatus.PENDING_RESULT, resultWindowExpiresAt: null },
          include: matchInclude,
        });
      });
    }

    for (const target of this.participantUserIds(match)) {
      await this.notify(target, NotificationType.DISPUTE_RESOLVED, {
        matchId,
        seasonId: match.seasonId,
        leagueId: match.season.leagueId,
        decision: dto.decision,
      });
    }
    await this.audit.record('DISPUTE_RESOLVED', adminUserId, 'Match', matchId, {
      decision: dto.decision,
      resolution: dto.resolution,
    });

    return this.serialize(updated);
  }

  /**
   * Finalizes a PENDING_VALIDATION match whose confirmation window expired.
   * Invoked by the BullMQ processor and by the lazy check on reads.
   */
  async autoConfirmIfDue(matchId: string): Promise<boolean> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: matchInclude,
    });
    if (!match) return false;
    if (match.status !== MatchStatus.PENDING_VALIDATION) return false;
    if (!match.resultWindowExpiresAt || match.resultWindowExpiresAt > new Date()) return false;
    if (!match.result) return false;

    const validatorId = this.otherParticipantUserId(match, match.result.submittedById);
    await this.finalizeValidation(match, validatorId, true);

    await this.audit.record('MATCH_AUTO_VALIDATED', validatorId, 'Match', matchId, {
      winnerId: match.result.winnerId,
      autoValidated: true,
    });
    return true;
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async finalizeValidation(
    match: MatchWithRelations,
    validatorUserId: string,
    autoValidated: boolean,
  ): Promise<MatchWithRelations> {
    const updated = await this.prisma.$transaction((tx) =>
      this.finalizeValidationTx(tx, match, validatorUserId, autoValidated),
    );

    for (const target of this.participantUserIds(match)) {
      await this.notify(target, NotificationType.RESULT_VALIDATED, {
        matchId: match.id,
        seasonId: match.seasonId,
        leagueId: match.season.leagueId,
        autoValidated,
      });
    }
    if (!autoValidated) {
      await this.queue.cancelAutoConfirm(match.id);
    }

    // async scoring flow (specs/02 §7.4); inline fallback without Redis
    await this.scoringQueue.scheduleScoring(match.id);

    return updated;
  }

  private async finalizeValidationTx(
    tx: Prisma.TransactionClient,
    match: MatchWithRelations,
    validatorUserId: string,
    autoValidated: boolean,
  ): Promise<MatchWithRelations> {
    if (!match.result) throw new ConflictException('No result on this match');
    const winnerId = match.result.winnerId;
    const loserId = winnerId === match.player1Id ? match.player2Id : match.player1Id;

    await tx.matchValidation.create({
      data: { matchId: match.id, validatedById: validatorUserId, autoValidated },
    });

    await tx.seasonPlayer.update({
      where: { id: winnerId },
      data: { matchesPlayed: { increment: 1 }, wins: { increment: 1 } },
    });
    await tx.seasonPlayer.update({
      where: { id: loserId },
      data: { matchesPlayed: { increment: 1 }, losses: { increment: 1 } },
    });

    // per-season head-to-head between LeagueMembers, canonical pair ordering.
    // Competitive matches only — TrainingSession must never touch this record.
    const winnerMemberId =
      winnerId === match.player1Id ? match.player1.memberId : match.player2.memberId;
    const loserMemberId =
      winnerId === match.player1Id ? match.player2.memberId : match.player1.memberId;
    const [first, second] =
      winnerMemberId < loserMemberId
        ? [winnerMemberId, loserMemberId]
        : [loserMemberId, winnerMemberId];
    const firstWon = first === winnerMemberId;
    const completedAt = new Date();

    await tx.headToHead.upsert({
      where: {
        player1Id_player2Id_seasonId: {
          player1Id: first,
          player2Id: second,
          seasonId: match.seasonId,
        },
      },
      create: {
        player1Id: first,
        player2Id: second,
        seasonId: match.seasonId,
        wins: firstWon ? 1 : 0,
        losses: firstWon ? 0 : 1,
        lastMatchAt: completedAt,
      },
      update: {
        ...(firstWon ? { wins: { increment: 1 } } : { losses: { increment: 1 } }),
        lastMatchAt: completedAt,
      },
    });

    return tx.match.update({
      where: { id: match.id },
      data: {
        status: MatchStatus.VALIDATED,
        completedAt,
        resultWindowExpiresAt: null,
      },
      include: matchInclude,
    });
  }

  /** Rolls SCHEDULED → PENDING_RESULT and expired PENDING_VALIDATION → VALIDATED. */
  private async applyLazyTransitions(
    match: MatchWithRelations,
  ): Promise<MatchWithRelations | null> {
    const now = new Date();

    if (
      match.status === MatchStatus.SCHEDULED &&
      match.scheduledAt &&
      match.scheduledAt <= now
    ) {
      return this.prisma.match.update({
        where: { id: match.id },
        data: { status: MatchStatus.PENDING_RESULT },
        include: matchInclude,
      });
    }

    if (
      match.status === MatchStatus.PENDING_VALIDATION &&
      match.resultWindowExpiresAt &&
      match.resultWindowExpiresAt <= now
    ) {
      await this.autoConfirmIfDue(match.id);
      return this.prisma.match.findUnique({ where: { id: match.id }, include: matchInclude });
    }

    return null;
  }

  /** Bulk lazy roll for list views (single UPDATE, no N+1). */
  private async rollDueStatuses(seasonId: string): Promise<void> {
    const now = new Date();
    await this.prisma.match.updateMany({
      where: { seasonId, status: MatchStatus.SCHEDULED, scheduledAt: { lte: now } },
      data: { status: MatchStatus.PENDING_RESULT },
    });

    const due = await this.prisma.match.findMany({
      where: {
        seasonId,
        status: MatchStatus.PENDING_VALIDATION,
        resultWindowExpiresAt: { lte: now },
      },
      select: { id: true },
    });
    for (const m of due) {
      await this.autoConfirmIfDue(m.id);
    }
  }

  private async getSeasonSettings(seasonId: string) {
    const settings = await this.prisma.seasonSettings.findUnique({ where: { seasonId } });
    return {
      resultWindowHours: settings?.resultWindowHours ?? 12,
      autoConfirmHours: settings?.autoConfirmHours ?? 24,
    };
  }

  private async resolvePlayer(seasonId: string, leagueId: string, userId: string) {
    const member = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!member || !member.isActive) {
      throw new ForbiddenException('You are not a member of this league');
    }
    const player = await this.prisma.seasonPlayer.findUnique({
      where: { seasonId_memberId: { seasonId, memberId: member.id } },
      include: playerInclude,
    });
    if (!player) {
      throw new ForbiddenException('You are not registered in this season');
    }
    return player;
  }

  private async getMatchOrThrow(matchId: string): Promise<MatchWithRelations> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: matchInclude,
    });
    if (!match) throw new NotFoundException('Match not found');
    return match;
  }

  private assertStatus(match: MatchWithRelations, allowed: MatchStatus[]): void {
    if (!allowed.includes(match.status)) {
      throw new ConflictException(
        `Action not allowed in status ${match.status} (requires ${allowed.join(' or ')})`,
      );
    }
  }

  private participantUserIds(match: MatchWithRelations): [string, string] {
    return [match.player1.member.user.id, match.player2.member.user.id];
  }

  private assertIsParticipant(match: MatchWithRelations, userId: string): void {
    if (!this.participantUserIds(match).includes(userId)) {
      throw new ForbiddenException('You are not a participant of this match');
    }
  }

  private assertIsChallenged(match: MatchWithRelations, userId: string): void {
    this.assertIsParticipant(match, userId);
    if (match.challengerId === userId) {
      throw new ForbiddenException('Only the challenged player can respond to the challenge');
    }
  }

  private otherParticipantUserId(match: MatchWithRelations, userId: string): string {
    const [p1, p2] = this.participantUserIds(match);
    return p1 === userId ? p2 : p1;
  }

  private async notify(
    userId: string,
    type: NotificationType,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.notification.create({
      data: { userId, type, payload: payload as Prisma.InputJsonValue },
    });
  }

  private serialize(match: MatchWithRelations): SerializedMatch {
    const toPlayer = (p: MatchWithRelations['player1']) => ({
      id: p.id,
      memberId: p.memberId,
      userId: p.member.user.id,
      displayName: p.member.user.displayName,
      username: p.member.user.username,
      avatarUrl: p.member.user.avatarUrl,
    });

    return {
      id: match.id,
      seasonId: match.seasonId,
      leagueId: match.season.leagueId,
      status: match.status,
      format: match.format,
      challengerId: match.challengerId,
      player1: toPlayer(match.player1),
      player2: toPlayer(match.player2),
      scheduledAt: match.scheduledAt,
      venueTextFallback: match.venueTextFallback,
      completedAt: match.completedAt,
      resultWindowExpiresAt: match.resultWindowExpiresAt,
      createdAt: match.createdAt,
      result: match.result
        ? {
            sets: match.result.sets,
            winnerId: match.result.winnerId,
            submittedById: match.result.submittedById,
            submittedAt: match.result.submittedAt,
            plausibilityPassed: match.result.plausibilityPassed,
            plausibilityNotes: match.result.plausibilityNotes,
          }
        : null,
      validation: match.validation
        ? {
            validatedById: match.validation.validatedById,
            validatedAt: match.validation.validatedAt,
            autoValidated: match.validation.autoValidated,
          }
        : null,
      dispute: match.dispute
        ? {
            status: match.dispute.status,
            openedById: match.dispute.openedById,
            resolvedById: match.dispute.resolvedById,
            resolution: match.dispute.resolution,
            createdAt: match.dispute.createdAt,
          }
        : null,
      scoreDeltas: match.scoreDeltas.map((d) => ({
        playerId: d.playerId,
        deltaPoints: d.deltaPoints,
        breakdown: d.breakdown,
        computedAt: d.computedAt,
      })),
    };
  }
}
