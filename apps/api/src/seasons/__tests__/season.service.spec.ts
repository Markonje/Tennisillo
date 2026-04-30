import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { SeasonService } from '../season.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { SeasonStatus, MemberRole } from '@tennisillo/db';

const mockPrisma = {
  league: { findUnique: jest.fn() },
  season: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
  seasonPlayer: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
  },
  seasonRanking: {
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
  leagueMember: { findUnique: jest.fn() },
  auditLog: { create: jest.fn() },
  $transaction: jest.fn(),
};

const mockAudit = { record: jest.fn() };

const makeLeague = (overrides = {}) => ({
  id: 'league1',
  isActive: true,
  settings: {
    defaultPointsWin: 100,
    defaultPointsLoss: 30,
    defaultLevelMultiplier: 'NORMAL',
    defaultBonusConsistency: true,
    defaultBonusDiversity: true,
    defaultHeadToHead: true,
    defaultDecayEnabled: true,
    resultWindowHours: 12,
    autoConfirmHours: 24,
  },
  ...overrides,
});

const makeSeason = (overrides: Record<string, unknown> = {}) => ({
  id: 'season1',
  leagueId: 'league1',
  name: 'Test Season',
  status: SeasonStatus.DRAFT,
  maxPlayers: null,
  _count: { players: 0 },
  ...overrides,
});

describe('SeasonService', () => {
  let service: SeasonService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<SeasonService>(SeasonService);
  });

  // ── createSeason ──────────────────────────────────────────────────────────

  describe('createSeason', () => {
    it('rejects when league already has a non-terminal season', async () => {
      mockPrisma.league.findUnique.mockResolvedValue(makeLeague());
      mockPrisma.season.findFirst.mockResolvedValue(makeSeason({ status: SeasonStatus.ACTIVE }));

      await expect(
        service.createSeason('league1', 'user1', { name: 'New Season' }),
      ).rejects.toThrow(ConflictException);
    });

    it('inherits SeasonSettings from LeagueSettings', async () => {
      mockPrisma.league.findUnique.mockResolvedValue(makeLeague());
      mockPrisma.season.findFirst.mockResolvedValue(null);
      mockPrisma.season.create.mockResolvedValue({ id: 'season1', name: 'S1', _count: { players: 0 } });

      await service.createSeason('league1', 'user1', { name: 'S1' });

      const createCall = mockPrisma.season.create.mock.calls[0][0];
      expect(createCall.data.settings.create.pointsWin).toBe(100);
      expect(createCall.data.settings.create.pointsLoss).toBe(30);
      expect(createCall.data.settings.create.decayEnabled).toBe(true);
    });
  });

  // ── transitionSeason ─────────────────────────────────────────────────────

  describe('transitionSeason', () => {
    it('rejects DRAFT → ACTIVE (must pass through REGISTRATION)', async () => {
      mockPrisma.season.findUnique.mockResolvedValue(makeSeason({ status: SeasonStatus.DRAFT, _count: { players: 2 } }));

      await expect(
        service.transitionSeason('season1', 'user1', { to: 'ACTIVE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects REGISTRATION → ACTIVE with 0 players', async () => {
      mockPrisma.season.findUnique.mockResolvedValue(makeSeason({ status: SeasonStatus.REGISTRATION, _count: { players: 0 } }));

      await expect(
        service.transitionSeason('season1', 'user1', { to: 'ACTIVE' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('REGISTRATION → ACTIVE with 2 players creates SeasonRanking at 0', async () => {
      mockPrisma.season.findUnique.mockResolvedValue(makeSeason({ status: SeasonStatus.REGISTRATION, _count: { players: 2 } }));

      const txFn = jest.fn().mockImplementation(async (callback: (tx: typeof mockPrisma) => Promise<unknown>) => {
        const txMock = {
          season: { update: jest.fn().mockResolvedValue({ id: 'season1', status: SeasonStatus.ACTIVE }) },
          seasonPlayer: { findMany: jest.fn().mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]) },
          seasonRanking: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
        };
        return callback(txMock as unknown as typeof mockPrisma);
      });
      mockPrisma.$transaction.mockImplementation(txFn);

      await service.transitionSeason('season1', 'user1', { to: 'ACTIVE' });

      const txCallback = txFn.mock.calls[0][0] as (tx: unknown) => Promise<unknown>;
      const txMock = {
        season: { update: jest.fn().mockResolvedValue({ id: 'season1', status: SeasonStatus.ACTIVE }) },
        seasonPlayer: { findMany: jest.fn().mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]) },
        seasonRanking: { createMany: jest.fn().mockResolvedValue({ count: 2 }) },
      };
      await txCallback(txMock);
      expect(txMock.seasonRanking.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({ points: 0, rank: null }),
          ]),
        }),
      );
    });
  });

  // ── registerSelf ─────────────────────────────────────────────────────────

  describe('registerSelf', () => {
    it('rejects when season is in DRAFT status', async () => {
      mockPrisma.season.findUnique.mockResolvedValue(makeSeason({ status: SeasonStatus.DRAFT, _count: { players: 0 } }));

      await expect(service.registerSelf('season1', 'user1')).rejects.toThrow(ConflictException);
    });

    it('rejects duplicate registration with ConflictException', async () => {
      mockPrisma.season.findUnique.mockResolvedValue(
        makeSeason({ status: SeasonStatus.REGISTRATION, _count: { players: 1 } }),
      );
      mockPrisma.leagueMember.findUnique.mockResolvedValue({ id: 'member1', isActive: true, role: MemberRole.PLAYER, masterMode: null });
      mockPrisma.seasonPlayer.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(service.registerSelf('season1', 'user1')).rejects.toThrow(ConflictException);
    });
  });

  // ── unregisterSelf ───────────────────────────────────────────────────────

  describe('unregisterSelf', () => {
    it('rejects unregistration when season is ACTIVE', async () => {
      mockPrisma.season.findUnique.mockResolvedValue(makeSeason({ status: SeasonStatus.ACTIVE }));

      await expect(service.unregisterSelf('season1', 'user1')).rejects.toThrow(ConflictException);
    });
  });

  // ── Extra edge cases ──────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('registerSelf rejects GUEST member', async () => {
      mockPrisma.season.findUnique.mockResolvedValue(
        makeSeason({ status: SeasonStatus.REGISTRATION, _count: { players: 0 } }),
      );
      mockPrisma.leagueMember.findUnique.mockResolvedValue({
        id: 'member1',
        isActive: true,
        role: MemberRole.GUEST,
        masterMode: null,
      });
      mockPrisma.seasonPlayer.findUnique.mockResolvedValue(null);

      await expect(service.registerSelf('season1', 'user1')).rejects.toThrow(ForbiddenException);
    });

    it('deleteSeason rejects when status is not DRAFT', async () => {
      mockPrisma.season.findUnique.mockResolvedValue(makeSeason({ status: SeasonStatus.ACTIVE }));

      await expect(service.deleteSeason('season1', 'user1')).rejects.toThrow(BadRequestException);
    });
  });
});
