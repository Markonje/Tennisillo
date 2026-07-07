import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedRequest } from '../../auth/supabase-jwt.guard';
import { MemberRole } from '@tennisillo/db';

/** ADMIN check for venue-scoped routes (params.id = Venue.id). */
@Injectable()
export class VenueAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const venueId = req.params['id'];
    if (!venueId) throw new ForbiddenException('venue id required');

    const venue = await this.prisma.venue.findUnique({
      where: { id: venueId },
      select: { leagueId: true },
    });
    if (!venue) throw new NotFoundException('Venue not found');

    const membership = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: venue.leagueId, userId: req.dbUser.id } },
    });
    if (!membership || membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }
    return true;
  }
}

/** ADMIN check for proposal-scoped routes (params.id = VenueProposal.id). */
@Injectable()
export class ProposalAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const proposalId = req.params['id'];
    if (!proposalId) throw new ForbiddenException('proposal id required');

    const proposal = await this.prisma.venueProposal.findUnique({
      where: { id: proposalId },
      select: { leagueId: true },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');

    const membership = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: proposal.leagueId, userId: req.dbUser.id } },
    });
    if (!membership || membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }
    return true;
  }
}
