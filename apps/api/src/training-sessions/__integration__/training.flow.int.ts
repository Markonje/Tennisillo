// Integration test for the Sprint 6 training flow against the real database.
// Verifies the CRITICAL invariant: sparring and master lessons never touch
// ScoreDelta, HeadToHead, or the competitive SeasonPlayer counters.
//
// NOT part of the default jest run. Run explicitly with:
//   pnpm --filter api exec jest --testMatch "**/*.int.ts"
import {
  LeagueSport,
  LeagueType,
  MasterMode,
  MemberRole,
  SeasonStatus,
  TrainingSessionStatus,
} from '@tennisillo/db';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { ScoringService } from '../../scoring/scoring.service';
import { TrainingSessionsService } from '../training-sessions.service';
import { MastersService } from '../../masters/masters.service';

jest.setTimeout(180_000);

const RUN_ID = `e2e6${Date.now().toString(36)}`;

describe('Sprint 6 training flow (integration)', () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const scoring = new ScoringService(prisma, audit);
  const training = new TrainingSessionsService(prisma, audit, scoring);
  const masters = new MastersService(prisma, audit);

  let adminUserId: string;
  let playerAUserId: string;
  let playerBUserId: string;
  let leagueId: string;
  let seasonId: string;
  let memberAId: string;
  let memberBId: string;
  let playerASeasonId: string; // SeasonPlayer ids
  let playerBSeasonId: string;

  beforeAll(async () => {
    const [admin, playerA, playerB] = await Promise.all(
      ['admin', 'pa', 'pb'].map((tag) =>
        prisma.user.create({
          data: {
            supabaseId: `${RUN_ID}-${tag}`,
            email: `${RUN_ID}-${tag}@test.local`,
            username: `${RUN_ID}-${tag}`,
            displayName: `E2E6 ${tag}`,
          },
        }),
      ),
    );
    adminUserId = (admin as { id: string }).id;
    playerAUserId = (playerA as { id: string }).id;
    playerBUserId = (playerB as { id: string }).id;

    const league = await prisma.league.create({
      data: {
        name: `E2E6 League ${RUN_ID}`,
        slug: `e2e6-league-${RUN_ID}`,
        sport: LeagueSport.TENNIS_SINGLES,
        type: LeagueType.PRIVATE,
        ownerId: adminUserId,
        settings: {
          create: { sparringEnabled: true, masterLessonsEnabled: true },
        },
        members: {
          create: [
            { userId: adminUserId, role: MemberRole.ADMIN },
            { userId: playerAUserId, role: MemberRole.PLAYER },
            { userId: playerBUserId, role: MemberRole.PLAYER },
          ],
        },
      },
      include: { members: true },
    });
    leagueId = league.id;
    memberAId = league.members.find((m) => m.userId === playerAUserId)?.id as string;
    memberBId = league.members.find((m) => m.userId === playerBUserId)?.id as string;

    const season = await prisma.season.create({
      data: {
        leagueId,
        name: `E2E6 Season ${RUN_ID}`,
        status: SeasonStatus.ACTIVE,
        startsAt: new Date(),
        players: { create: [{ memberId: memberAId }, { memberId: memberBId }] },
      },
      include: { players: true },
    });
    seasonId = season.id;
    playerASeasonId = season.players.find((p) => p.memberId === memberAId)?.id as string;
    playerBSeasonId = season.players.find((p) => p.memberId === memberBId)?.id as string;
  });

  afterAll(async () => {
    const userIds = [adminUserId, playerAUserId, playerBUserId];
    await prisma.userAchievement.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.trainingSession.deleteMany({ where: { leagueId } });
    await prisma.masterProfile.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.seasonRanking.deleteMany({ where: { seasonId } });
    await prisma.seasonPlayer.deleteMany({ where: { seasonId } });
    await prisma.season.deleteMany({ where: { id: seasonId } });
    await prisma.leagueSettings.deleteMany({ where: { leagueId } });
    await prisma.leagueMember.deleteMany({ where: { leagueId } });
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.auditLog.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.$disconnect();
  });

  it('sparring: declare → confirm → +12 each, WITHOUT touching competitive data', async () => {
    const before = {
      scoreDeltas: await prisma.scoreDelta.count(),
      headToHeads: await prisma.headToHead.count({ where: { seasonId } }),
    };

    const session = await training.declareSparring(leagueId, playerAUserId, {
      player2MemberId: memberBId,
      focusNote: 'backhand drills',
    });
    expect(session.status).toBe(TrainingSessionStatus.PENDING_VALIDATION);

    // only the partner can confirm
    await expect(training.confirmSparring(session.id, playerAUserId)).rejects.toThrow();

    const confirmed = await training.confirmSparring(session.id, playerBUserId);
    expect(confirmed.status).toBe(TrainingSessionStatus.VALIDATED);
    expect(confirmed.pointsAwarded).toBe(12);

    const playerA = await prisma.seasonPlayer.findUnique({ where: { id: playerASeasonId } });
    const playerB = await prisma.seasonPlayer.findUnique({ where: { id: playerBSeasonId } });
    expect(playerA?.currentPoints).toBe(12);
    expect(playerB?.currentPoints).toBe(12);

    // [CRITICAL] competitive counters untouched
    expect(playerA?.matchesPlayed).toBe(0);
    expect(playerA?.wins).toBe(0);
    expect(playerA?.losses).toBe(0);
    expect(await prisma.scoreDelta.count()).toBe(before.scoreDeltas);
    expect(await prisma.headToHead.count({ where: { seasonId } })).toBe(before.headToHeads);
  });

  it('sparring cap: the 3rd weekly declaration is rejected', async () => {
    // 2nd sparring of the week (cap = 2): declare + confirm
    const second = await training.declareSparring(leagueId, playerAUserId, {
      player2MemberId: memberBId,
    });
    await training.confirmSparring(second.id, playerBUserId);

    await expect(
      training.declareSparring(leagueId, playerAUserId, { player2MemberId: memberBId }),
    ).rejects.toThrow('cap');
  });

  it('master lesson: promote master → declare → validate → XP on global profile only', async () => {
    await masters.promote(leagueId, adminUserId, {
      userId: playerBUserId,
      masterMode: MasterMode.HYBRID,
    });

    const before = await prisma.user.findUnique({ where: { id: playerAUserId } });
    const lesson = await training.declareLesson(leagueId, playerAUserId, {
      masterId: playerBUserId,
      durationMinutes: 60,
      focusNote: 'serve technique',
    });

    // only the designated master can validate
    await expect(training.validateLesson(lesson.id, playerAUserId)).rejects.toThrow();

    const validated = await training.validateLesson(lesson.id, playerBUserId);
    expect(validated.status).toBe(TrainingSessionStatus.VALIDATED);
    expect(validated.xpAwarded).toBe(20);

    const after = await prisma.user.findUnique({ where: { id: playerAUserId } });
    expect(after?.globalExperiencePoints).toBe((before?.globalExperiencePoints ?? 0) + 20);
    // 0 XP before → factor 0.5 → +10 rating
    expect(after?.globalRating).toBeCloseTo((before?.globalRating ?? 1500) + 10);

    // [CRITICAL] season points NOT affected by the lesson
    const playerA = await prisma.seasonPlayer.findUnique({ where: { id: playerASeasonId } });
    expect(playerA?.currentPoints).toBe(24); // still only the two sparring rewards

    const profile = await prisma.masterProfile.findUnique({ where: { userId: playerBUserId } });
    expect(profile?.totalLessonsValidated).toBe(1);

    const xpSummary = await training.globalXp(playerAUserId);
    expect(xpSummary.totalXp).toBe(20);
    expect(xpSummary.validatedLessons).toBe(1);
    expect(xpSummary.mastersWorkedWith).toHaveLength(1);
  });

  it('admin revoke reverses sparring points and lesson XP', async () => {
    // revoke the first validated sparring
    const sparring = await prisma.trainingSession.findFirst({
      where: { leagueId, type: 'SPARRING', status: TrainingSessionStatus.VALIDATED },
      orderBy: { createdAt: 'asc' },
    });
    await training.revoke(sparring?.id as string, adminUserId, {
      reason: 'Session was never played, reported by both users',
    });
    const playerA = await prisma.seasonPlayer.findUnique({ where: { id: playerASeasonId } });
    expect(playerA?.currentPoints).toBe(12); // 24 - 12

    // revoke the lesson
    const lesson = await prisma.trainingSession.findFirst({
      where: { leagueId, type: 'MASTER_LESSON', status: TrainingSessionStatus.VALIDATED },
    });
    await training.revoke(lesson?.id as string, adminUserId, {
      reason: 'Wrong declaration, master asked for the reversal',
    });
    const after = await prisma.user.findUnique({ where: { id: playerAUserId } });
    expect(after?.globalExperiencePoints).toBe(0);
    expect(after?.globalRating).toBeCloseTo(1500);
  });
});
