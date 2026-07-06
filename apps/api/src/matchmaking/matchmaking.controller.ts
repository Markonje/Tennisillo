import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { MatchmakingService } from './matchmaking.service';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class MatchmakingController {
  constructor(private readonly matchmaking: MatchmakingService) {}

  /** Player: Smart Match candidates for an active season */
  @Get('seasons/:seasonId/matchmaking/candidates')
  candidates(
    @Param('seasonId') seasonId: string,
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit?: string,
    @Query('requireAvailability') requireAvailability?: string,
    @Query('enableGeo') enableGeo?: string,
  ) {
    return this.matchmaking.getCandidates(seasonId, req.dbUser.id, {
      ...(limit !== undefined && { limit: Math.max(1, Math.min(50, Number(limit) || 10)) }),
      requireAvailability: requireAvailability === 'true',
      enableGeo: enableGeo === 'true',
    });
  }

  /** Player: common availability slots with a candidate */
  @Get('seasons/:seasonId/matchmaking/slots')
  slots(
    @Param('seasonId') seasonId: string,
    @Req() req: AuthenticatedRequest,
    @Query('candidateMemberId') candidateMemberId: string,
    @Query('horizonDays') horizonDays?: string,
  ) {
    return this.matchmaking.getSlots(
      seasonId,
      req.dbUser.id,
      candidateMemberId,
      Number(horizonDays) || 14,
    );
  }
}
