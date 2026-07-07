import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FrequencyUnit, MatchStatus, SeasonStatus } from '@tennisillo/db';
import {
  DEFAULT_WEIGHTS,
  findCandidates,
  intersectSlots,
  materializeSlots,
  type CandidateContext,
  type RequesterContext,
  type SpecificOverride,
  type TimeSlot,
} from '@tennisillo/matchmaking-engine';
import { pairMatchLimit } from '@tennisillo/scoring-engine';
import { PrismaService } from '../prisma/prisma.service';
import { FrequencyService } from '../frequency/frequency.service';
import { toEngineLevel } from '../scoring/utils/level-map';

const DEFAULT_HORIZON_DAYS = 14;
const DEFAULT_LIMIT = 10;
/** Assumed duration of a scheduled match when blocking calendar slots (spec 01 §10.1.3). */
const MATCH_BLOCK_HOURS = 2;

export interface CandidateOptions {
  limit?: number;
  requireAvailability?: boolean;
  enableGeo?: boolean;
}

@Injectable()
export class MatchmakingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly frequency: FrequencyService,
  ) {}

  async getCandidates(seasonId: string, userId: string, opts: CandidateOptions) {
    const { season, requesterMember, requesterPlayer } = await this.resolveSeasonContext(
      seasonId,
      userId,
    );

    const players = await this.prisma.seasonPlayer.findMany({
      where: { seasonId, isEligible: true, id: { not: requesterPlayer.id } },
      include: {
        member: {
          include: {
            availabilityPattern: true,
            frequencyPreference: true,
            favoriteVenues: {
              orderBy: { priority: 'asc' },
              take: 1,
              include: { venue: { select: { latitude: true, longitude: true } } },
            },
            user: { select: { displayName: true, username: true, avatarUrl: true } },
          },
        },
      },
    });

    const activePlayers = players.length + 1;
    const pairLimit =
      season.settings?.pairLimitOverride && season.settings.pairLimitOverride > 0
        ? season.settings.pairLimitOverride
        : pairMatchLimit(activePlayers);

    const now = new Date();
    const requesterCtx = await this.buildRequesterContext(requesterMember.id, requesterPlayer.leagueLevelSource, now);

    const candidates: CandidateContext[] = [];
    const infoByMember = new Map<
      string,
      { displayName: string; username: string; avatarUrl: string | null; playerId: string }
    >();

    for (const player of players) {
      const member = player.member;
      infoByMember.set(member.id, {
        displayName: member.user.displayName,
        username: member.user.username,
        avatarUrl: member.user.avatarUrl,
        playerId: player.id,
      });

      const pairMatches = await this.prisma.match.findMany({
        where: {
          seasonId,
          status: { notIn: [MatchStatus.CANCELLED] },
          OR: [
            { player1Id: requesterPlayer.id, player2Id: player.id },
            { player1Id: player.id, player2Id: requesterPlayer.id },
          ],
        },
        orderBy: { createdAt: 'desc' },
        select: { completedAt: true, createdAt: true },
      });

      const pref = member.frequencyPreference;
      const currentPeriodMatches = await this.frequency.countPeriodMatches(
        member.id,
        pref?.unit ?? FrequencyUnit.WEEKLY,
      );

      const overrides = await this.loadOverridesWithBusySlots(member.id, player.id, now);
      const favoriteVenue = member.favoriteVenues[0]?.venue;

      candidates.push({
        memberId: member.id,
        level: toEngineLevel(member.leagueLevel),
        rating: member.leagueRating,
        availabilityPattern: (member.availabilityPattern?.slots ?? []) as unknown as TimeSlot[],
        availabilityOverrides: overrides,
        hasFrequencyDeclared: pref !== null,
        currentPeriodMatches,
        idealFrequency: pref?.idealFrequency ?? 0,
        maxFrequency: pref?.maxFrequency ?? 0,
        matchesWithRequesterThisSeason: pairMatches.length,
        lastMatchWithRequesterAt: pairMatches[0]?.completedAt ?? pairMatches[0]?.createdAt ?? null,
        maxMatchesPerPair: pairLimit,
        ...(favoriteVenue?.latitude != null && favoriteVenue?.longitude != null
          ? { favoriteVenueLat: favoriteVenue.latitude, favoriteVenueLng: favoriteVenue.longitude }
          : {}),
      });
    }

    const results = findCandidates(requesterCtx, candidates, {
      horizonDays: DEFAULT_HORIZON_DAYS,
      maxCandidates: opts.limit ?? DEFAULT_LIMIT,
      requireAvailabilityIntersection: opts.requireAvailability ?? false,
      enableGeoScoring: opts.enableGeo ?? false,
      referenceDate: now,
      weights: DEFAULT_WEIGHTS,
    });

    return results.map((r) => {
      const info = infoByMember.get(r.memberId);
      return {
        ...r,
        playerId: info?.playerId ?? null,
        displayName: info?.displayName ?? '',
        username: info?.username ?? '',
        avatarUrl: info?.avatarUrl ?? null,
      };
    });
  }

  /** Common availability windows between requester and a candidate member. */
  async getSlots(seasonId: string, userId: string, candidateMemberId: string, horizonDays: number) {
    const { requesterMember } = await this.resolveSeasonContext(seasonId, userId);

    const candidate = await this.prisma.leagueMember.findUnique({
      where: { id: candidateMemberId },
      include: { availabilityPattern: true },
    });
    if (!candidate || candidate.leagueId !== requesterMember.leagueId) {
      throw new NotFoundException('Candidate is not a member of this league');
    }

    const now = new Date();
    const horizon = Math.min(Math.max(horizonDays, 1), 60);

    const requesterPattern = await this.prisma.availabilityPattern.findUnique({
      where: { memberId: requesterMember.id },
    });
    const requesterSlots = materializeSlots(
      {
        availabilityPattern: (requesterPattern?.slots ?? []) as unknown as TimeSlot[],
        availabilityOverrides: await this.loadOverrides(requesterMember.id, now),
      },
      horizon,
      now,
    );
    const candidateSlots = materializeSlots(
      {
        availabilityPattern: (candidate.availabilityPattern?.slots ?? []) as unknown as TimeSlot[],
        availabilityOverrides: await this.loadOverrides(candidate.id, now),
      },
      horizon,
      now,
    );

    return intersectSlots(requesterSlots, candidateSlots);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private async resolveSeasonContext(seasonId: string, userId: string) {
    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      include: { settings: true },
    });
    if (!season) throw new NotFoundException('Season not found');
    if (season.status !== SeasonStatus.ACTIVE) {
      throw new ConflictException('Smart Match is only available for ACTIVE seasons');
    }

    const requesterMember = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: season.leagueId, userId } },
    });
    if (!requesterMember || !requesterMember.isActive) {
      throw new ForbiddenException('You are not a member of this league');
    }

    const requesterPlayer = await this.prisma.seasonPlayer.findUnique({
      where: { seasonId_memberId: { seasonId, memberId: requesterMember.id } },
    });
    if (!requesterPlayer) {
      throw new ForbiddenException('You are not registered in this season');
    }

    return {
      season,
      requesterMember,
      requesterPlayer: {
        ...requesterPlayer,
        leagueLevelSource: requesterMember.leagueLevel,
      },
    };
  }

  private async buildRequesterContext(
    memberId: string,
    leagueLevel: Parameters<typeof toEngineLevel>[0],
    now: Date,
  ): Promise<RequesterContext> {
    const [pattern, member] = await Promise.all([
      this.prisma.availabilityPattern.findUnique({ where: { memberId } }),
      this.prisma.leagueMember.findUnique({
        where: { id: memberId },
        include: {
          favoriteVenues: {
            orderBy: { priority: 'asc' },
            take: 1,
            include: { venue: { select: { latitude: true, longitude: true } } },
          },
        },
      }),
    ]);

    const favoriteVenue = member?.favoriteVenues[0]?.venue;
    return {
      memberId,
      level: toEngineLevel(leagueLevel),
      rating: member?.leagueRating ?? 1500,
      availabilityPattern: (pattern?.slots ?? []) as unknown as TimeSlot[],
      availabilityOverrides: await this.loadOverrides(memberId, now),
      ...(favoriteVenue?.latitude != null && favoriteVenue?.longitude != null
        ? { favoriteVenueLat: favoriteVenue.latitude, favoriteVenueLng: favoriteVenue.longitude }
        : {}),
    };
  }

  private async loadOverrides(memberId: string, now: Date): Promise<SpecificOverride[]> {
    const horizon = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.availabilityOverride.findMany({
      where: { memberId, endsAt: { gte: now }, startsAt: { lte: horizon } },
    });
    return rows.map((o) => ({ type: o.type, startsAt: o.startsAt, endsAt: o.endsAt }));
  }

  /**
   * Overrides + automatic occupation: scheduled platform matches block the
   * corresponding calendar window (spec 01 §10.1.3).
   */
  private async loadOverridesWithBusySlots(
    memberId: string,
    seasonPlayerId: string,
    now: Date,
  ): Promise<SpecificOverride[]> {
    const overrides = await this.loadOverrides(memberId, now);

    const scheduled = await this.prisma.match.findMany({
      where: {
        status: MatchStatus.SCHEDULED,
        scheduledAt: { gte: now },
        OR: [{ player1Id: seasonPlayerId }, { player2Id: seasonPlayerId }],
      },
      select: { scheduledAt: true },
    });
    for (const match of scheduled) {
      if (!match.scheduledAt) continue;
      overrides.push({
        type: 'UNAVAILABLE',
        startsAt: match.scheduledAt,
        endsAt: new Date(match.scheduledAt.getTime() + MATCH_BLOCK_HOURS * 60 * 60 * 1000),
      });
    }
    return overrides;
  }
}
