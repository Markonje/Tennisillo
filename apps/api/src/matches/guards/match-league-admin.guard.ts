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

/**
 * Checks that req.dbUser is ADMIN in the league that owns the match
 * identified by params.id. Used for admin-only match routes (dispute resolution).
 */
@Injectable()
export class MatchLeagueAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const matchId = req.params['id'];

    if (!matchId) {
      throw new ForbiddenException('match id required');
    }

    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      select: { season: { select: { leagueId: true } } },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const membership = await this.prisma.leagueMember.findUnique({
      where: {
        leagueId_userId: { leagueId: match.season.leagueId, userId: req.dbUser.id },
      },
    });

    if (!membership || membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }

    return true;
  }
}
