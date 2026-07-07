/**
 * Integration test for the full Sprint 3b match flow, running against the
 * real database (DATABASE_URL from apps/api/.env).
 *
 * NOT part of the default jest run (testMatch excludes *.int.ts — CI has no
 * DATABASE_URL). Run explicitly with:
 *
 *   pnpm --filter api exec jest --runTestsByPath src/matches/__integration__/matches.flow.int.ts
 *
 * Creates its own throwaway users/league/season (prefixed "e2e-3b") and
 * deletes everything it created in afterAll.
 */
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { LeagueSport, LeagueType, MatchStatus, MemberRole, SeasonStatus } from '@tennisillo/db';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { AchievementsService } from '../../achievements/achievements.service';
import { ScoringService } from '../../scoring/scoring.service';
import { ScoringQueueService } from '../../scoring/scoring-queue.service';
import { MailService } from '../../notifications/mail.service';
import { MatchQueueService } from '../match-queue.service';
import { MatchesService } from '../matches.service';

jest.setTimeout(180_000);

const RUN_ID = `e2e3b${Date.now().toString(36)}`;

describe('Sprint 3b match flow (integration)', () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const service = new MatchesService(
    prisma,
    audit,
    new MatchQueueService(),
    new ScoringQueueService(
      new ScoringService(prisma, audit, new AchievementsService(prisma)),
    ),
    new MailService(),
  );

  let adminUserId: string;
  let playerUserId: string;
  let leagueId: string;
  let seasonId: string;
  let adminPlayerId: string; // SeasonPlayer of admin
  let playerPlayerId: string; // SeasonPlayer of second user

  const futureIso = (hours: number) => new Date(Date.now() + hours * 3600_000).toISOString();

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        supabaseId: `${RUN_ID}-admin`,
        email: `${RUN_ID}-admin@test.local`,
        username: `${RUN_ID}-admin`,
        displayName: 'E2E Admin',
      },
    });
    const player = await prisma.user.create({
      data: {
        supabaseId: `${RUN_ID}-player`,
        email: `${RUN_ID}-player@test.local`,
        username: `${RUN_ID}-player`,
        displayName: 'E2E Player',
      },
    });
    adminUserId = admin.id;
    playerUserId = player.id;

    const league = await prisma.league.create({
      data: {
        name: `E2E League ${RUN_ID}`,
        slug: `e2e-league-${RUN_ID}`,
        sport: LeagueSport.TENNIS_SINGLES,
        type: LeagueType.PRIVATE,
        ownerId: adminUserId,
        members: {
          create: [
            { userId: adminUserId, role: MemberRole.ADMIN },
            { userId: playerUserId, role: MemberRole.PLAYER },
          ],
        },
      },
      include: { members: true },
    });
    leagueId = league.id;

    const adminMember = league.members.find((m) => m.userId === adminUserId);
    const playerMember = league.members.find((m) => m.userId === playerUserId);
    if (!adminMember || !playerMember) throw new Error('setup failed: members missing');

    const season = await prisma.season.create({
      data: {
        leagueId,
        name: `E2E Season ${RUN_ID}`,
        status: SeasonStatus.ACTIVE,
        startsAt: new Date(),
        settings: {
          // cooldown/pair-limit disabled: this test plays many matches
          // between the same pair on the same day
          create: {
            autoConfirmHours: 24,
            resultWindowHours: 12,
            h2hCooldownDays: 0,
            pairLimitOverride: 99,
          },
        },
        players: {
          create: [{ memberId: adminMember.id }, { memberId: playerMember.id }],
        },
      },
      include: { players: true },
    });
    seasonId = season.id;

    const adminPlayer = season.players.find((p) => p.memberId === adminMember.id);
    const playerPlayer = season.players.find((p) => p.memberId === playerMember.id);
    if (!adminPlayer || !playerPlayer) throw new Error('setup failed: players missing');
    adminPlayerId = adminPlayer.id;
    playerPlayerId = playerPlayer.id;
  });

  afterAll(async () => {
    // teardown in FK dependency order; every entity is scoped to this run
    const matchIds = (
      await prisma.match.findMany({ where: { seasonId }, select: { id: true } })
    ).map((m) => m.id);
    await prisma.matchValidation.deleteMany({ where: { matchId: { in: matchIds } } });
    await prisma.dispute.deleteMany({ where: { matchId: { in: matchIds } } });
    await prisma.matchResult.deleteMany({ where: { matchId: { in: matchIds } } });
    await prisma.scoreDelta.deleteMany({ where: { matchId: { in: matchIds } } });
    await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
    await prisma.headToHead.deleteMany({ where: { seasonId } });
    await prisma.seasonRanking.deleteMany({ where: { seasonId } });
    await prisma.seasonPlayer.deleteMany({ where: { seasonId } });
    await prisma.seasonSettings.deleteMany({ where: { seasonId } });
    await prisma.season.deleteMany({ where: { id: seasonId } });
    await prisma.leagueMember.deleteMany({ where: { leagueId } });
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.userAchievement.deleteMany({
      where: { userId: { in: [adminUserId, playerUserId] } },
    });
    await prisma.notification.deleteMany({
      where: { userId: { in: [adminUserId, playerUserId] } },
    });
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [adminUserId, playerUserId] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [adminUserId, playerUserId] } } });
    await prisma.$disconnect();
  });

  it('runs the happy path: challenge → accept → result → confirm → VALIDATED', async () => {
    const challenge = await service.createChallenge(seasonId, adminUserId, {
      opponentPlayerId: playerPlayerId,
      scheduledAt: futureIso(2),
      venueTextFallback: 'Circolo E2E',
    });
    expect(challenge.status).toBe(MatchStatus.PENDING_ACCEPTANCE);

    // opponent got an in-app notification
    const notif = await prisma.notification.findFirst({
      where: { userId: playerUserId, type: 'CHALLENGE_RECEIVED' },
    });
    expect(notif).not.toBeNull();

    // challenger cannot accept their own challenge
    await expect(service.acceptChallenge(challenge.id, adminUserId, {})).rejects.toThrow(
      ForbiddenException,
    );

    const accepted = await service.acceptChallenge(challenge.id, playerUserId, {});
    expect(accepted.status).toBe(MatchStatus.SCHEDULED);

    // implausible score is rejected with 400
    await expect(
      service.submitResult(challenge.id, adminUserId, { sets: [{ p1: 9, p2: 1 }] }),
    ).rejects.toThrow(BadRequestException);

    const submitted = await service.submitResult(challenge.id, adminUserId, {
      sets: [
        { p1: 6, p2: 4 },
        { p1: 7, p2: 6 },
      ],
    });
    expect(submitted.status).toBe(MatchStatus.PENDING_VALIDATION);
    expect(submitted.result?.winnerId).toBe(adminPlayerId);
    expect(submitted.resultWindowExpiresAt).not.toBeNull();

    // submitter cannot confirm their own result
    await expect(service.confirmResult(challenge.id, adminUserId)).rejects.toThrow(
      ForbiddenException,
    );

    const validated = await service.confirmResult(challenge.id, playerUserId);
    expect(validated.status).toBe(MatchStatus.VALIDATED);
    expect(validated.validation?.autoValidated).toBe(false);

    // player stats updated
    const winner = await prisma.seasonPlayer.findUnique({ where: { id: adminPlayerId } });
    const loser = await prisma.seasonPlayer.findUnique({ where: { id: playerPlayerId } });
    expect(winner?.wins).toBe(1);
    expect(winner?.matchesPlayed).toBe(1);
    expect(loser?.losses).toBe(1);

    // Sprint 4: scoring ran inline on validation — deltas persisted,
    // points assigned, ranking recomputed
    const deltas = await prisma.scoreDelta.findMany({ where: { matchId: challenge.id } });
    expect(deltas).toHaveLength(2);
    const winnerDelta = deltas.find((d) => d.playerId === adminPlayerId);
    const loserDelta = deltas.find((d) => d.playerId === playerPlayerId);
    expect(winnerDelta?.deltaPoints).toBeGreaterThan(0);
    expect(winnerDelta?.breakdown).toMatchObject({ base: 100 });
    expect(winner?.currentPoints).toBe(winnerDelta?.deltaPoints);
    expect(loser?.currentPoints).toBe(loserDelta?.deltaPoints);
    expect(winner?.currentRank).toBe(1);
    const ranking = await prisma.seasonRanking.findMany({ where: { seasonId } });
    expect(ranking).toHaveLength(2);
    expect(ranking.find((r) => r.playerId === adminPlayerId)?.points).toBe(
      winnerDelta?.deltaPoints,
    );

    // head-to-head written once
    const h2h = await prisma.headToHead.findMany({ where: { seasonId } });
    expect(h2h).toHaveLength(1);
    expect((h2h[0]?.wins ?? 0) + (h2h[0]?.losses ?? 0)).toBe(1);

    // audit trail exists for the whole chain
    const auditActions = (
      await prisma.auditLog.findMany({
        where: { entityId: challenge.id },
        select: { action: true },
      })
    ).map((a) => a.action);
    expect(auditActions).toEqual(
      expect.arrayContaining(['CHALLENGE_CREATED', 'CHALLENGE_ACCEPTED', 'MATCH_VALIDATED']),
    );
  });

  it('handles dispute: contest → admin resolves REJECTED → result stands', async () => {
    const challenge = await service.createChallenge(seasonId, adminUserId, {
      opponentPlayerId: playerPlayerId,
      scheduledAt: futureIso(2),
    });
    await service.acceptChallenge(challenge.id, playerUserId, {});
    await service.submitResult(challenge.id, adminUserId, {
      sets: [
        { p1: 6, p2: 0 },
        { p1: 6, p2: 0 },
      ],
    });

    const disputed = await service.openDispute(challenge.id, playerUserId, {
      reason: 'Score is completely wrong, second set was 6-4 for me',
    });
    expect(disputed.status).toBe(MatchStatus.DISPUTED);

    const resolved = await service.resolveDispute(challenge.id, adminUserId, {
      decision: 'REJECTED',
      resolution: 'Checked with both players offline: submitted score is correct',
    });
    expect(resolved.status).toBe(MatchStatus.VALIDATED);
    expect(resolved.dispute?.status).toBe('DISMISSED');
  });

  it('handles dispute UPHELD: result discarded, match back to PENDING_RESULT', async () => {
    const challenge = await service.createChallenge(seasonId, playerUserId, {
      opponentPlayerId: adminPlayerId,
      scheduledAt: futureIso(2),
    });
    await service.acceptChallenge(challenge.id, adminUserId, {});
    await service.submitResult(challenge.id, playerUserId, {
      sets: [
        { p1: 6, p2: 3 },
        { p1: 6, p2: 3 },
      ],
    });
    await service.openDispute(challenge.id, adminUserId, {
      reason: 'That match was never played on that date',
    });

    const resolved = await service.resolveDispute(challenge.id, adminUserId, {
      decision: 'UPHELD',
      resolution: 'No evidence the match took place; please resubmit the real score',
    });
    expect(resolved.status).toBe(MatchStatus.PENDING_RESULT);
    expect(resolved.result).toBeNull();

    // resubmission after upheld dispute works
    const resubmitted = await service.submitResult(challenge.id, adminUserId, {
      sets: [
        { p1: 4, p2: 6 },
        { p1: 6, p2: 4 },
        { p1: 7, p2: 6 },
      ],
    });
    expect(resubmitted.status).toBe(MatchStatus.PENDING_VALIDATION);
    const confirmed = await service.confirmResult(challenge.id, playerUserId);
    expect(confirmed.status).toBe(MatchStatus.VALIDATED);
  });

  it('auto-confirms an expired validation window (lazy path)', async () => {
    const challenge = await service.createChallenge(seasonId, adminUserId, {
      opponentPlayerId: playerPlayerId,
      scheduledAt: futureIso(2),
    });
    await service.acceptChallenge(challenge.id, playerUserId, {});
    await service.submitResult(challenge.id, adminUserId, {
      sets: [
        { p1: 6, p2: 2 },
        { p1: 6, p2: 2 },
      ],
    });

    // simulate the 24h window having expired
    await prisma.match.update({
      where: { id: challenge.id },
      data: { resultWindowExpiresAt: new Date(Date.now() - 60_000) },
    });

    await expect(service.autoConfirmIfDue(challenge.id)).resolves.toBe(true);

    const match = await service.getMatch(challenge.id);
    expect(match.status).toBe(MatchStatus.VALIDATED);
    expect(match.validation?.autoValidated).toBe(true);
  });

  it('enforces the max 3 open challenges anti-abuse rule', async () => {
    const created: string[] = [];
    for (let i = 0; i < 3; i++) {
      const c = await service.createChallenge(seasonId, adminUserId, {
        opponentPlayerId: playerPlayerId,
        scheduledAt: futureIso(3 + i),
      });
      created.push(c.id);
    }

    await expect(
      service.createChallenge(seasonId, adminUserId, {
        opponentPlayerId: playerPlayerId,
        scheduledAt: futureIso(10),
      }),
    ).rejects.toThrow('open challenges');

    // withdrawing one frees a slot
    await service.cancelMatch(created[0] as string, adminUserId);
    const again = await service.createChallenge(seasonId, adminUserId, {
      opponentPlayerId: playerPlayerId,
      scheduledAt: futureIso(10),
    });
    expect(again.status).toBe(MatchStatus.PENDING_ACCEPTANCE);
  });
});
