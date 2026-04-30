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
 * Checks that req.dbUser is ADMIN in the league that owns the season identified by params.id.
 * Used for season-scoped routes (e.g. PATCH /seasons/:id).
 */
@Injectable()
export class SeasonAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const seasonId = req.params['id'] as string | undefined;

    if (!seasonId) {
      throw new ForbiddenException('season id required');
    }

    const season = await this.prisma.season.findUnique({
      where: { id: seasonId },
      select: { leagueId: true },
    });

    if (!season) {
      throw new NotFoundException('Season not found');
    }

    const membership = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: season.leagueId, userId: req.dbUser.id } },
    });

    if (!membership || membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }

    return true;
  }
}
