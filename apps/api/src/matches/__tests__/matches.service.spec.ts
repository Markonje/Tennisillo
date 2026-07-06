import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MatchesService } from '../matches.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { MatchQueueService } from '../match-queue.service';
import { DisputeStatus, MatchFormat, MatchStatus, SeasonStatus } from '@tennisillo/db';

const mockPrisma = {
  season: { findUnique: jest.fn() },
  seasonSettings: { findUnique: jest.fn() },
  seasonPlayer: { findUnique: jest.fn(), update: jest.fn() },
  leagueMember: { findUnique: jest.fn() },
  match: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  matchResult: { create: jest.fn(), delete: jest.fn() },
  matchValidation: { create: jest.fn() },
  dispute: { create: jest.fn(), update: jest.fn() },
  headToHead: { upsert: jest.fn() },
  notification: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockAudit = { record: jest.fn() };
const mockQueue = {
  scheduleAutoConfirm: jest.fn().mockResolvedValue(true),
  cancelAutoConfirm: jest.fn().mockResolvedValue(undefined),
};

const user = (id: string) => ({
  id,
  displayName: `User ${id}`,
  username: id,
  avatarUrl: null,
});

const makePlayer = (id: string, userId: string, overrides = {}) => ({
  id,
  seasonId: 'season1',
  memberId: `member-${userId}`,
  isEligible: true,
  member: { id: `member-${userId}`, userId, user: user(userId) },
  ...overrides,
});

const makeMatch = (overrides: Record<string, unknown> = {}) => ({
  id: 'match1',
  seasonId: 'season1',
  player1Id: 'sp1',
  player2Id: 'sp2',
  player1: makePlayer('sp1', 'userA'),
  player2: makePlayer('sp2', 'userB'),
  challengerId: 'userA',
  status: MatchStatus.PENDING_ACCEPTANCE,
  format: MatchFormat.BEST_OF_3,
  scheduledAt: null,
  venueTextFallback: null,
  completedAt: null,
  resultWindowExpiresAt: null,
  createdAt: new Date('2026-01-01T10:00:00Z'),
  updatedAt: new Date('2026-01-01T10:00:00Z'),
  result: null,
  validation: null,
  dispute: null,
  season: { id: 'season1', leagueId: 'league1', status: SeasonStatus.ACTIVE, name: 'S1' },
  ...overrides,
});

const futureDate = () => new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

// typed wrappers around jest asymmetric matchers (they return `any`)
const oc = (obj: Record<string, unknown>): Record<string, unknown> =>
  expect.objectContaining(obj) as Record<string, unknown>;
const sc = (text: string): string => expect.stringContaining(text) as string;

describe('MatchesService', () => {
  let service: MatchesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    // default: run the transaction callback against the mock prisma itself
    mockPrisma.$transaction.mockImplementation(async (fn: unknown) => {
      if (typeof fn === 'function') {
        return (fn as (tx: typeof mockPrisma) => Promise<unknown>)(mockPrisma);
      }
      return Promise.all(fn as Promise<unknown>[]);
    });
    mockPrisma.seasonSettings.findUnique.mockResolvedValue({
      resultWindowHours: 12,
      autoConfirmHours: 24,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MatchesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: MatchQueueService, useValue: mockQueue },
      ],
    }).compile();

    service = module.get<MatchesService>(MatchesService);
  });

  describe('createChallenge', () => {
    const setupHappyPath = () => {
      mockPrisma.season.findUnique.mockResolvedValue({
        id: 'season1',
        leagueId: 'league1',
        status: SeasonStatus.ACTIVE,
        settings: null,
      });
      mockPrisma.leagueMember.findUnique.mockResolvedValue({
        id: 'member-userA',
        isActive: true,
      });
      mockPrisma.seasonPlayer.findUnique
        .mockResolvedValueOnce(makePlayer('sp1', 'userA')) // challenger
        .mockResolvedValueOnce(makePlayer('sp2', 'userB')); // opponent
      mockPrisma.match.count.mockResolvedValue(0);
      mockPrisma.match.create.mockResolvedValue(makeMatch());
    };

    it('creates a PENDING_ACCEPTANCE match and notifies the opponent', async () => {
      setupHappyPath();

      const result = await service.createChallenge('season1', 'userA', {
        opponentPlayerId: 'sp2',
      });

      expect(result.status).toBe(MatchStatus.PENDING_ACCEPTANCE);
      expect(mockPrisma.match.create).toHaveBeenCalledWith(
        oc({
          data: oc({
            player1Id: 'sp1',
            player2Id: 'sp2',
            challengerId: 'userA',
          }),
        }),
      );
      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockAudit.record).toHaveBeenCalledWith(
        'CHALLENGE_CREATED',
        'userA',
        'Match',
        'match1',
        expect.any(Object),
      );
    });

    it('rejects when the season is not ACTIVE', async () => {
      mockPrisma.season.findUnique.mockResolvedValue({
        id: 'season1',
        leagueId: 'league1',
        status: SeasonStatus.REGISTRATION,
        settings: null,
      });

      await expect(
        service.createChallenge('season1', 'userA', { opponentPlayerId: 'sp2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects self-challenge', async () => {
      mockPrisma.season.findUnique.mockResolvedValue({
        id: 'season1',
        leagueId: 'league1',
        status: SeasonStatus.ACTIVE,
        settings: null,
      });
      mockPrisma.leagueMember.findUnique.mockResolvedValue({
        id: 'member-userA',
        isActive: true,
      });
      mockPrisma.seasonPlayer.findUnique
        .mockResolvedValueOnce(makePlayer('sp1', 'userA'))
        .mockResolvedValueOnce(makePlayer('sp1', 'userA'));

      await expect(
        service.createChallenge('season1', 'userA', { opponentPlayerId: 'sp1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('enforces the max 3 open challenges limit', async () => {
      mockPrisma.season.findUnique.mockResolvedValue({
        id: 'season1',
        leagueId: 'league1',
        status: SeasonStatus.ACTIVE,
        settings: null,
      });
      mockPrisma.leagueMember.findUnique.mockResolvedValue({
        id: 'member-userA',
        isActive: true,
      });
      mockPrisma.seasonPlayer.findUnique
        .mockResolvedValueOnce(makePlayer('sp1', 'userA'))
        .mockResolvedValueOnce(makePlayer('sp2', 'userB'));
      mockPrisma.match.count.mockResolvedValue(3);

      await expect(
        service.createChallenge('season1', 'userA', { opponentPlayerId: 'sp2' }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects a scheduledAt in the past', async () => {
      setupHappyPath();

      await expect(
        service.createChallenge('season1', 'userA', {
          opponentPlayerId: 'sp2',
          scheduledAt: '2020-01-01T10:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptChallenge', () => {
    it('moves the match to SCHEDULED when the challenged player accepts', async () => {
      const match = makeMatch();
      mockPrisma.match.findUnique.mockResolvedValue(match);
      const scheduledAt = futureDate();
      mockPrisma.match.update.mockResolvedValue(
        makeMatch({ status: MatchStatus.SCHEDULED, scheduledAt: new Date(scheduledAt) }),
      );

      const result = await service.acceptChallenge('match1', 'userB', { scheduledAt });

      expect(result.status).toBe(MatchStatus.SCHEDULED);
      expect(mockAudit.record).toHaveBeenCalledWith(
        'CHALLENGE_ACCEPTED',
        'userB',
        'Match',
        'match1',
        expect.any(Object),
      );
    });

    it('rejects acceptance by the challenger', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(makeMatch());

      await expect(
        service.acceptChallenge('match1', 'userA', { scheduledAt: futureDate() }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects acceptance without a scheduled date', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(makeMatch());

      await expect(service.acceptChallenge('match1', 'userB', {})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects acceptance by a non-participant', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(makeMatch());

      await expect(
        service.acceptChallenge('match1', 'userC', { scheduledAt: futureDate() }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when the match is not PENDING_ACCEPTANCE', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(
        makeMatch({ status: MatchStatus.SCHEDULED }),
      );

      await expect(
        service.acceptChallenge('match1', 'userB', { scheduledAt: futureDate() }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('submitResult', () => {
    const scheduledMatch = () =>
      makeMatch({
        status: MatchStatus.SCHEDULED,
        scheduledAt: new Date(Date.now() - 60 * 60 * 1000),
      });

    it('stores the result and moves to PENDING_VALIDATION', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(scheduledMatch());
      mockPrisma.match.update.mockResolvedValue(
        makeMatch({ status: MatchStatus.PENDING_VALIDATION }),
      );

      const result = await service.submitResult('match1', 'userA', {
        sets: [
          { p1: 6, p2: 4 },
          { p1: 6, p2: 3 },
        ],
      });

      expect(result.status).toBe(MatchStatus.PENDING_VALIDATION);
      expect(mockPrisma.matchResult.create).toHaveBeenCalledWith(
        oc({
          data: oc({ winnerId: 'sp1', submittedById: 'userA' }),
        }),
      );
      expect(mockQueue.scheduleAutoConfirm).toHaveBeenCalled();
    });

    it('rejects an implausible score with 400', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(scheduledMatch());

      await expect(
        service.submitResult('match1', 'userA', {
          sets: [{ p1: 7, p2: 2 }],
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrisma.matchResult.create).not.toHaveBeenCalled();
    });

    it('flags a result submitted outside the time window without rejecting it', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(
        makeMatch({
          status: MatchStatus.PENDING_RESULT,
          scheduledAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        }),
      );
      mockPrisma.match.update.mockResolvedValue(
        makeMatch({ status: MatchStatus.PENDING_VALIDATION }),
      );

      await service.submitResult('match1', 'userB', {
        sets: [
          { p1: 4, p2: 6 },
          { p1: 3, p2: 6 },
        ],
      });

      expect(mockPrisma.matchResult.create).toHaveBeenCalledWith(
        oc({
          data: oc({
            plausibilityPassed: false,
            plausibilityNotes: sc('12h'),
            winnerId: 'sp2',
          }),
        }),
      );
    });

    it('rejects submission by a non-participant', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(scheduledMatch());

      await expect(
        service.submitResult('match1', 'userC', {
          sets: [
            { p1: 6, p2: 4 },
            { p1: 6, p2: 3 },
          ],
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('confirmResult', () => {
    const pendingValidationMatch = () =>
      makeMatch({
        status: MatchStatus.PENDING_VALIDATION,
        resultWindowExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        result: {
          id: 'res1',
          matchId: 'match1',
          sets: [
            { p1: 6, p2: 4 },
            { p1: 6, p2: 3 },
          ],
          winnerId: 'sp1',
          submittedById: 'userA',
          submittedAt: new Date(),
          plausibilityPassed: true,
          plausibilityNotes: null,
        },
      });

    it('finalizes the match, updates stats and head-to-head', async () => {
      const match = pendingValidationMatch();
      mockPrisma.match.findUnique.mockResolvedValue(match);
      mockPrisma.match.update.mockResolvedValue(
        makeMatch({ status: MatchStatus.VALIDATED, completedAt: new Date() }),
      );

      const result = await service.confirmResult('match1', 'userB');

      expect(result.status).toBe(MatchStatus.VALIDATED);
      expect(mockPrisma.matchValidation.create).toHaveBeenCalledWith(
        oc({
          data: oc({ validatedById: 'userB', autoValidated: false }),
        }),
      );
      // winner sp1 gains a win, loser sp2 gains a loss
      expect(mockPrisma.seasonPlayer.update).toHaveBeenCalledWith(
        oc({
          where: { id: 'sp1' },
          data: { matchesPlayed: { increment: 1 }, wins: { increment: 1 } },
        }),
      );
      expect(mockPrisma.seasonPlayer.update).toHaveBeenCalledWith(
        oc({
          where: { id: 'sp2' },
          data: { matchesPlayed: { increment: 1 }, losses: { increment: 1 } },
        }),
      );
      expect(mockPrisma.headToHead.upsert).toHaveBeenCalledTimes(1);
      expect(mockQueue.cancelAutoConfirm).toHaveBeenCalledWith('match1');
    });

    it('rejects confirmation by the submitter', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(pendingValidationMatch());

      await expect(service.confirmResult('match1', 'userA')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('auto-confirms instead when the window has already expired', async () => {
      const expired = makeMatch({
        status: MatchStatus.PENDING_VALIDATION,
        resultWindowExpiresAt: new Date(Date.now() - 60 * 1000),
        result: {
          id: 'res1',
          matchId: 'match1',
          sets: [
            { p1: 6, p2: 4 },
            { p1: 6, p2: 3 },
          ],
          winnerId: 'sp1',
          submittedById: 'userA',
          submittedAt: new Date(),
          plausibilityPassed: true,
          plausibilityNotes: null,
        },
      });
      const validated = makeMatch({ status: MatchStatus.VALIDATED });
      mockPrisma.match.findUnique
        .mockResolvedValueOnce(expired) // getMatchOrThrow
        .mockResolvedValueOnce(expired) // autoConfirmIfDue reload
        .mockResolvedValue(validated); // post-finalize reload
      mockPrisma.match.update.mockResolvedValue(validated);

      const result = await service.confirmResult('match1', 'userB');

      expect(result.status).toBe(MatchStatus.VALIDATED);
      expect(mockPrisma.matchValidation.create).toHaveBeenCalledWith(
        oc({
          data: oc({ autoValidated: true }),
        }),
      );
    });
  });

  describe('openDispute', () => {
    const pendingValidationMatch = () =>
      makeMatch({
        status: MatchStatus.PENDING_VALIDATION,
        resultWindowExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        result: {
          id: 'res1',
          matchId: 'match1',
          sets: [{ p1: 6, p2: 4 }],
          winnerId: 'sp1',
          submittedById: 'userA',
          submittedAt: new Date(),
          plausibilityPassed: true,
          plausibilityNotes: null,
        },
      });

    it('opens a dispute and moves the match to DISPUTED', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(pendingValidationMatch());
      mockPrisma.match.update.mockResolvedValue(makeMatch({ status: MatchStatus.DISPUTED }));

      const result = await service.openDispute('match1', 'userB', {
        reason: 'The score is wrong, I won the second set',
      });

      expect(result.status).toBe(MatchStatus.DISPUTED);
      expect(mockPrisma.dispute.create).toHaveBeenCalled();
      expect(mockQueue.cancelAutoConfirm).toHaveBeenCalledWith('match1');
    });

    it('rejects a dispute by the submitter', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(pendingValidationMatch());

      await expect(
        service.openDispute('match1', 'userA', { reason: 'Changing my mind about it' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('resolveDispute', () => {
    const disputedMatch = () =>
      makeMatch({
        status: MatchStatus.DISPUTED,
        result: {
          id: 'res1',
          matchId: 'match1',
          sets: [{ p1: 6, p2: 4 }],
          winnerId: 'sp1',
          submittedById: 'userA',
          submittedAt: new Date(),
          plausibilityPassed: true,
          plausibilityNotes: null,
        },
        dispute: {
          id: 'disp1',
          matchId: 'match1',
          status: DisputeStatus.OPEN,
          openedById: 'userB',
          resolvedById: null,
          resolution: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

    it('REJECTED: the result stands and the match is finalized', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(disputedMatch());
      mockPrisma.match.update.mockResolvedValue(makeMatch({ status: MatchStatus.VALIDATED }));

      const result = await service.resolveDispute('match1', 'admin1', {
        decision: 'REJECTED',
        resolution: 'Both players confirmed the score by chat screenshots',
      });

      expect(result.status).toBe(MatchStatus.VALIDATED);
      expect(mockPrisma.dispute.update).toHaveBeenCalledWith(
        oc({
          data: oc({ status: DisputeStatus.DISMISSED }),
        }),
      );
      expect(mockPrisma.matchValidation.create).toHaveBeenCalled();
    });

    it('UPHELD: the result is discarded and the match returns to PENDING_RESULT', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(disputedMatch());
      mockPrisma.match.update.mockResolvedValue(
        makeMatch({ status: MatchStatus.PENDING_RESULT }),
      );

      const result = await service.resolveDispute('match1', 'admin1', {
        decision: 'UPHELD',
        resolution: 'Photo evidence contradicts the submitted score',
      });

      expect(result.status).toBe(MatchStatus.PENDING_RESULT);
      expect(mockPrisma.matchResult.delete).toHaveBeenCalledWith({ where: { matchId: 'match1' } });
      expect(mockPrisma.dispute.update).toHaveBeenCalledWith(
        oc({
          data: oc({ status: DisputeStatus.RESOLVED }),
        }),
      );
      expect(mockPrisma.matchValidation.create).not.toHaveBeenCalled();
    });

    it('rejects resolution when no open dispute exists', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(
        makeMatch({ status: MatchStatus.DISPUTED, dispute: null }),
      );

      await expect(
        service.resolveDispute('match1', 'admin1', {
          decision: 'REJECTED',
          resolution: 'No dispute found on this match',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('autoConfirmIfDue', () => {
    it('returns false when the window has not expired', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(
        makeMatch({
          status: MatchStatus.PENDING_VALIDATION,
          resultWindowExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          result: {
            id: 'res1',
            matchId: 'match1',
            sets: [{ p1: 6, p2: 4 }],
            winnerId: 'sp1',
            submittedById: 'userA',
            submittedAt: new Date(),
            plausibilityPassed: true,
            plausibilityNotes: null,
          },
        }),
      );

      await expect(service.autoConfirmIfDue('match1')).resolves.toBe(false);
    });

    it('returns false when the match is not PENDING_VALIDATION', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(makeMatch({ status: MatchStatus.VALIDATED }));
      await expect(service.autoConfirmIfDue('match1')).resolves.toBe(false);
    });

    it('finalizes an expired PENDING_VALIDATION match with autoValidated=true', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(
        makeMatch({
          status: MatchStatus.PENDING_VALIDATION,
          resultWindowExpiresAt: new Date(Date.now() - 60 * 1000),
          result: {
            id: 'res1',
            matchId: 'match1',
            sets: [{ p1: 6, p2: 4 }],
            winnerId: 'sp1',
            submittedById: 'userA',
            submittedAt: new Date(),
            plausibilityPassed: true,
            plausibilityNotes: null,
          },
        }),
      );
      mockPrisma.match.update.mockResolvedValue(makeMatch({ status: MatchStatus.VALIDATED }));

      await expect(service.autoConfirmIfDue('match1')).resolves.toBe(true);
      expect(mockPrisma.matchValidation.create).toHaveBeenCalledWith(
        oc({
          data: oc({ validatedById: 'userB', autoValidated: true }),
        }),
      );
      expect(mockAudit.record).toHaveBeenCalledWith(
        'MATCH_AUTO_VALIDATED',
        'userB',
        'Match',
        'match1',
        expect.any(Object),
      );
    });
  });

  describe('getMatch', () => {
    it('throws NotFound for a missing match', async () => {
      mockPrisma.match.findUnique.mockResolvedValue(null);
      await expect(service.getMatch('nope')).rejects.toThrow(NotFoundException);
    });
  });
});
