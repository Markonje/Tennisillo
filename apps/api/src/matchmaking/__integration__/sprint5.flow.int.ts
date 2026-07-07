// Integration test for the Sprint 5 flow against the real database:
// availability pattern → frequency preference → venue registry → Smart Match.
//
// NOT part of the default jest run. Run explicitly with:
//   pnpm --filter api exec jest --testMatch "**/*.int.ts"
import { AvailabilityOverrideType, LeagueSport, LeagueType, MemberRole, SeasonStatus } from '@tennisillo/db';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { AvailabilityService } from '../../availability/availability.service';
import { FrequencyService } from '../../frequency/frequency.service';
import { VenuesService } from '../../venues/venues.service';
import { MatchmakingService } from '../matchmaking.service';

jest.setTimeout(180_000);

const RUN_ID = `e2e5${Date.now().toString(36)}`;

describe('Sprint 5 flow (integration)', () => {
  const prisma = new PrismaService();
  const audit = new AuditService(prisma);
  const availability = new AvailabilityService(prisma, audit);
  const frequency = new FrequencyService(prisma, audit);
  const venues = new VenuesService(prisma, audit);
  const matchmaking = new MatchmakingService(prisma, frequency);

  let adminUserId: string;
  let playerUserId: string;
  let leagueId: string;
  let seasonId: string;
  let adminMemberId: string;
  let playerMemberId: string;

  beforeAll(async () => {
    const admin = await prisma.user.create({
      data: {
        supabaseId: `${RUN_ID}-admin`,
        email: `${RUN_ID}-admin@test.local`,
        username: `${RUN_ID}-admin`,
        displayName: 'E2E5 Admin',
      },
    });
    const player = await prisma.user.create({
      data: {
        supabaseId: `${RUN_ID}-player`,
        email: `${RUN_ID}-player@test.local`,
        username: `${RUN_ID}-player`,
        displayName: 'E2E5 Player',
      },
    });
    adminUserId = admin.id;
    playerUserId = player.id;

    const league = await prisma.league.create({
      data: {
        name: `E2E5 League ${RUN_ID}`,
        slug: `e2e5-league-${RUN_ID}`,
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
    adminMemberId = league.members.find((m) => m.userId === adminUserId)?.id as string;
    playerMemberId = league.members.find((m) => m.userId === playerUserId)?.id as string;

    const season = await prisma.season.create({
      data: {
        leagueId,
        name: `E2E5 Season ${RUN_ID}`,
        status: SeasonStatus.ACTIVE,
        startsAt: new Date(),
        players: {
          create: [{ memberId: adminMemberId }, { memberId: playerMemberId }],
        },
      },
    });
    seasonId = season.id;
  });

  afterAll(async () => {
    await prisma.playerFavoriteVenue.deleteMany({
      where: { memberId: { in: [adminMemberId, playerMemberId] } },
    });
    await prisma.venueProposal.deleteMany({ where: { leagueId } });
    await prisma.venue.deleteMany({ where: { leagueId } });
    await prisma.availabilityOverride.deleteMany({
      where: { memberId: { in: [adminMemberId, playerMemberId] } },
    });
    await prisma.availabilityPattern.deleteMany({
      where: { memberId: { in: [adminMemberId, playerMemberId] } },
    });
    await prisma.playerFrequencyPreference.deleteMany({
      where: { memberId: { in: [adminMemberId, playerMemberId] } },
    });
    await prisma.seasonPlayer.deleteMany({ where: { seasonId } });
    await prisma.season.deleteMany({ where: { id: seasonId } });
    await prisma.leagueMember.deleteMany({ where: { leagueId } });
    await prisma.league.deleteMany({ where: { id: leagueId } });
    await prisma.notification.deleteMany({
      where: { userId: { in: [adminUserId, playerUserId] } },
    });
    await prisma.auditLog.deleteMany({
      where: { userId: { in: [adminUserId, playerUserId] } },
    });
    await prisma.user.deleteMany({ where: { id: { in: [adminUserId, playerUserId] } } });
    await prisma.$disconnect();
  });

  it('stores availability patterns and overrides', async () => {
    // both available on Wednesdays 18-21
    await availability.upsertPattern(leagueId, adminUserId, {
      slots: [{ dayOfWeek: 3, startMinute: 18 * 60, endMinute: 21 * 60 }],
    });
    await availability.upsertPattern(leagueId, playerUserId, {
      slots: [{ dayOfWeek: 3, startMinute: 19 * 60, endMinute: 22 * 60 }],
    });

    const view = await availability.getForMember(playerMemberId, adminUserId);
    expect(view.slots).toHaveLength(1);

    const override = await availability.createOverride(leagueId, playerUserId, {
      type: AvailabilityOverrideType.UNAVAILABLE,
      startsAt: new Date(Date.now() + 30 * 24 * 3600_000).toISOString(),
      endsAt: new Date(Date.now() + 31 * 24 * 3600_000).toISOString(),
      note: 'holidays',
    });
    expect(override.id).toBeDefined();

    const overview = await availability.leagueOverview(leagueId, adminUserId);
    expect(overview).toHaveLength(2);
  });

  it('stores frequency preferences and exposes the traffic light', async () => {
    const detail = await frequency.upsert(leagueId, playerUserId, {
      idealFrequency: 2,
      maxFrequency: 3,
    });
    expect(detail.status).toBe('GREEN');

    const publicView = await frequency.getPublicStatus(playerMemberId, adminUserId);
    expect(publicView).toEqual({ memberId: playerMemberId, status: 'GREEN' });
  });

  it('manages the venue registry: admin create, player proposal, approval, favorites', async () => {
    const venue = await venues.create(leagueId, adminUserId, {
      name: 'TC E2E5 — Centrale',
      address: 'Via dei Test 1, Bologna',
      latitude: 44.49,
      longitude: 11.34,
    });
    expect(venue.status).toBe('ACTIVE');

    const proposal = await venues.propose(leagueId, playerUserId, {
      name: 'Circolo Proposto',
      address: 'Via delle Proposte 2, Bologna',
    });
    const pending = await venues.listProposals(leagueId);
    expect(pending.map((p) => p.id)).toContain(proposal.id);

    const approved = await venues.approveProposal(proposal.id, adminUserId);
    expect(approved.status).toBe('ACTIVE');
    expect(approved.createdById).toBe(playerUserId);

    const favorites = await venues.upsertFavorites(leagueId, playerUserId, {
      venues: [{ venueId: venue.id, priority: 1 }],
    });
    expect(favorites).toHaveLength(1);

    // player proposal notification reached the admin
    const notif = await prisma.notification.findFirst({
      where: { userId: adminUserId, type: 'VENUE_PROPOSAL_RECEIVED' },
    });
    expect(notif).not.toBeNull();
  });

  it('Smart Match returns the opponent with intersected slots', async () => {
    const candidates = await matchmaking.getCandidates(seasonId, adminUserId, {});
    expect(candidates).toHaveLength(1);

    const cand = candidates[0];
    expect(cand?.memberId).toBe(playerMemberId);
    expect(cand?.frequencyStatus).toBe('GREEN');
    expect(cand?.finalScore).toBeGreaterThan(50);
    // Wednesday 19-21 is the common window
    expect(cand?.suggestedSlots.length).toBeGreaterThan(0);
    const slot = cand?.suggestedSlots[0];
    expect(slot?.startsAt.getHours()).toBe(19);
    expect(slot?.endsAt.getHours()).toBe(21);

    const slots = await matchmaking.getSlots(seasonId, adminUserId, playerMemberId, 14);
    expect(slots.length).toBeGreaterThan(0);
  });
});
