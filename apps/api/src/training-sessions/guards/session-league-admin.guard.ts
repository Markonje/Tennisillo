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

/** ADMIN check for training-session routes (params.id = TrainingSession.id). */
@Injectable()
export class SessionLeagueAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const sessionId = req.params['id'];
    if (!sessionId) throw new ForbiddenException('session id required');

    const session = await this.prisma.trainingSession.findUnique({
      where: { id: sessionId },
      select: { leagueId: true },
    });
    if (!session) throw new NotFoundException('Training session not found');

    const membership = await this.prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId: session.leagueId, userId: req.dbUser.id } },
    });
    if (!membership || membership.role !== MemberRole.ADMIN) {
      throw new ForbiddenException('Admin role required');
    }
    return true;
  }
}
