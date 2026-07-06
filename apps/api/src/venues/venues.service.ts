import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, VenueStatus } from '@tennisillo/db';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import type { CreateVenueDto, UpdateVenueDto, UpsertFavoriteVenuesDto } from './dto/venue.dto';

export interface SerializedProposal {
  id: string;
  leagueId: string;
  status: string;
  proposedData: unknown;
  proposedBy?: { displayName: string; username: string };
  reviewNotes: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}

@Injectable()
export class VenuesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─── Venues (admin CRUD + member reads) ───────────────────────────────────

  async listByLeague(leagueId: string, userId: string, includeArchived = false) {
    await this.assertMember(leagueId, userId);
    return this.prisma.venue.findMany({
      where: {
        leagueId,
        status: includeArchived
          ? { in: [VenueStatus.ACTIVE, VenueStatus.ARCHIVED] }
          : VenueStatus.ACTIVE,
      },
      orderBy: { name: 'asc' },
    });
  }

  async getById(venueId: string, userId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Venue not found');
    await this.assertMember(venue.leagueId, userId);
    return venue;
  }

  /** Admin: create venue, published immediately (spec 01 §11.2). */
  async create(leagueId: string, adminId: string, dto: CreateVenueDto) {
    this.validatePriceRange(dto);
    const venue = await this.prisma.venue.create({
      data: {
        leagueId,
        status: VenueStatus.ACTIVE,
        approvedById: adminId,
        name: dto.name,
        address: dto.address,
        ...this.toVenueData(dto),
      },
    });
    await this.audit.record('VENUE_CREATED', adminId, 'Venue', venue.id, { leagueId });
    return venue;
  }

  /** Admin: update venue fields. */
  async update(venueId: string, adminId: string, dto: UpdateVenueDto) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Venue not found');
    const effectiveLow = dto.priceRangeLow ?? venue.priceRangeLow;
    const effectiveHigh = dto.priceRangeHigh ?? venue.priceRangeHigh;
    this.validatePriceRange({
      ...(effectiveLow !== null && { priceRangeLow: effectiveLow }),
      ...(effectiveHigh !== null && { priceRangeHigh: effectiveHigh }),
    });

    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: this.toVenueData(dto),
    });
    await this.audit.record('VENUE_UPDATED', adminId, 'Venue', venueId, {
      leagueId: venue.leagueId,
    });
    return updated;
  }

  /** Admin: archive (never hard-delete — history must survive, spec 01 §11.6). */
  async archive(venueId: string, adminId: string) {
    const venue = await this.prisma.venue.findUnique({ where: { id: venueId } });
    if (!venue) throw new NotFoundException('Venue not found');
    if (venue.status === VenueStatus.ARCHIVED) {
      throw new ConflictException('Venue is already archived');
    }

    const updated = await this.prisma.venue.update({
      where: { id: venueId },
      data: { status: VenueStatus.ARCHIVED, archivedAt: new Date() },
    });
    await this.audit.record('VENUE_ARCHIVED', adminId, 'Venue', venueId, {
      leagueId: venue.leagueId,
    });
    return updated;
  }

  // ─── Proposals (player → admin approval) ──────────────────────────────────

  async propose(leagueId: string, userId: string, dto: CreateVenueDto) {
    await this.assertMember(leagueId, userId);
    this.validatePriceRange(dto);

    const proposal = await this.prisma.venueProposal.create({
      data: {
        leagueId,
        proposedById: userId,
        proposedData: dto as unknown as Prisma.InputJsonValue,
        status: VenueStatus.PENDING_VALIDATION,
      },
    });

    // notify league admins (spec 01 §11.2)
    const admins = await this.prisma.leagueMember.findMany({
      where: { leagueId, role: 'ADMIN', isActive: true },
      select: { userId: true },
    });
    for (const admin of admins) {
      await this.prisma.notification.create({
        data: {
          userId: admin.userId,
          type: NotificationType.VENUE_PROPOSAL_RECEIVED,
          payload: { leagueId, proposalId: proposal.id, name: dto.name },
        },
      });
    }

    await this.audit.record('VENUE_PROPOSED', userId, 'VenueProposal', proposal.id, {
      leagueId,
      name: dto.name,
    });
    return this.serializeProposal(proposal);
  }

  async listProposals(leagueId: string): Promise<SerializedProposal[]> {
    const proposals = await this.prisma.venueProposal.findMany({
      where: { leagueId, status: VenueStatus.PENDING_VALIDATION },
      orderBy: { createdAt: 'asc' },
      include: { proposedBy: { select: { displayName: true, username: true } } },
    });
    return proposals.map((p) => this.serializeProposal(p, p.proposedBy));
  }

  /** Admin: approve → creates the Venue (possibly with edited data). */
  async approveProposal(proposalId: string, adminId: string, edits?: UpdateVenueDto) {
    const proposal = await this.prisma.venueProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status !== VenueStatus.PENDING_VALIDATION) {
      throw new ConflictException('Proposal was already reviewed');
    }

    const data = {
      ...(proposal.proposedData as unknown as CreateVenueDto),
      ...(edits ?? {}),
    };
    if (!data.name || !data.address) {
      throw new BadRequestException('Proposal data is incomplete');
    }

    const venue = await this.prisma.$transaction(async (tx) => {
      const created = await tx.venue.create({
        data: {
          leagueId: proposal.leagueId,
          status: VenueStatus.ACTIVE,
          createdById: proposal.proposedById,
          approvedById: adminId,
          name: data.name,
          address: data.address,
          ...this.toVenueData(data),
        },
      });
      await tx.venueProposal.update({
        where: { id: proposalId },
        data: {
          status: VenueStatus.ACTIVE,
          venueId: created.id,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
      return created;
    });

    await this.prisma.notification.create({
      data: {
        userId: proposal.proposedById,
        type: NotificationType.VENUE_PROPOSAL_APPROVED,
        payload: { leagueId: proposal.leagueId, venueId: venue.id, name: venue.name },
      },
    });
    await this.audit.record('VENUE_PROPOSAL_APPROVED', adminId, 'VenueProposal', proposalId, {
      leagueId: proposal.leagueId,
      venueId: venue.id,
    });
    return venue;
  }

  async rejectProposal(proposalId: string, adminId: string, reviewNotes: string) {
    const proposal = await this.prisma.venueProposal.findUnique({ where: { id: proposalId } });
    if (!proposal) throw new NotFoundException('Proposal not found');
    if (proposal.status !== VenueStatus.PENDING_VALIDATION) {
      throw new ConflictException('Proposal was already reviewed');
    }

    const updated = await this.prisma.venueProposal.update({
      where: { id: proposalId },
      data: {
        status: VenueStatus.ARCHIVED,
        reviewedById: adminId,
        reviewNotes,
        reviewedAt: new Date(),
      },
    });
    await this.audit.record('VENUE_PROPOSAL_REJECTED', adminId, 'VenueProposal', proposalId, {
      leagueId: proposal.leagueId,
      reviewNotes,
    });
    return this.serializeProposal(updated);
  }

  // ─── Favorite venues (max 3, ordered — spec 01 §11.5) ─────────────────────

  async getFavorites(leagueId: string, userId: string) {
    const member = await this.assertMember(leagueId, userId);
    return this.prisma.playerFavoriteVenue.findMany({
      where: { memberId: member.id },
      orderBy: { priority: 'asc' },
      include: { venue: true },
    });
  }

  async upsertFavorites(leagueId: string, userId: string, dto: UpsertFavoriteVenuesDto) {
    const member = await this.assertMember(leagueId, userId);

    const priorities = dto.venues.map((v) => v.priority);
    if (new Set(priorities).size !== priorities.length) {
      throw new BadRequestException('Duplicate priorities');
    }
    const venueIds = dto.venues.map((v) => v.venueId);
    if (new Set(venueIds).size !== venueIds.length) {
      throw new BadRequestException('Duplicate venues');
    }

    const venues = await this.prisma.venue.findMany({
      where: { id: { in: venueIds }, leagueId, status: VenueStatus.ACTIVE },
    });
    if (venues.length !== venueIds.length) {
      throw new BadRequestException('All venues must be active venues of this league');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.playerFavoriteVenue.deleteMany({ where: { memberId: member.id } });
      for (const item of dto.venues) {
        await tx.playerFavoriteVenue.create({
          data: { memberId: member.id, venueId: item.venueId, priority: item.priority },
        });
      }
    });

    await this.audit.record('FAVORITE_VENUES_UPDATED', userId, 'LeagueMember', member.id, {
      leagueId,
      venueIds,
    });
    return this.getFavorites(leagueId, userId);
  }

  // ─── Internals ────────────────────────────────────────────────────────────

  private serializeProposal(
    p: {
      id: string;
      leagueId: string;
      status: string;
      proposedData: unknown;
      reviewNotes: string | null;
      createdAt: Date;
      reviewedAt: Date | null;
    },
    proposedBy?: { displayName: string; username: string },
  ): SerializedProposal {
    return {
      id: p.id,
      leagueId: p.leagueId,
      status: p.status,
      proposedData: p.proposedData,
      ...(proposedBy && { proposedBy }),
      reviewNotes: p.reviewNotes,
      createdAt: p.createdAt,
      reviewedAt: p.reviewedAt,
    };
  }

  /** Optional venue fields only — name/address are handled by the callers. */
  private toVenueData(dto: CreateVenueDto | UpdateVenueDto) {
    return {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.address !== undefined && { address: dto.address }),
      ...(dto.latitude !== undefined && { latitude: dto.latitude }),
      ...(dto.longitude !== undefined && { longitude: dto.longitude }),
      ...(dto.surface !== undefined && { surface: dto.surface }),
      ...(dto.cover !== undefined && { cover: dto.cover }),
      ...(dto.courtCount !== undefined && { courtCount: dto.courtCount }),
      ...(dto.bookingUrl !== undefined && { bookingUrl: dto.bookingUrl }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.priceRangeLow !== undefined && { priceRangeLow: dto.priceRangeLow }),
      ...(dto.priceRangeHigh !== undefined && { priceRangeHigh: dto.priceRangeHigh }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    };
  }

  private validatePriceRange(dto: { priceRangeLow?: number; priceRangeHigh?: number }) {
    if (
      dto.priceRangeLow !== undefined &&
      dto.priceRangeHigh !== undefined &&
      dto.priceRangeHigh < dto.priceRangeLow
    ) {
      throw new BadRequestException('priceRangeHigh cannot be lower than priceRangeLow');
    }
  }

  private async assertMember(leagueId: string, userId: string) {
    const member = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    if (!member || !member.isActive) {
      throw new ForbiddenException('You are not a member of this league');
    }
    return member;
  }
}
