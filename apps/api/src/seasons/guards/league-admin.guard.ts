import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedRequest } from '../../auth/supabase-jwt.guard';
import { MemberRole } from '@tennisillo/db';

/** Checks that req.dbUser is ADMIN in the league identified by params.leagueId. */
@Injectable()
export class LeagueAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const leagueId = req.params['leagueId'] as string | undefined;

    if (!leagueId) {
      throw new ForbiddenException('leagueId required');
    }

    const membership = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: req.dbUser.id } },
    });

    if (!membership || membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }

    return true;
  }
}
