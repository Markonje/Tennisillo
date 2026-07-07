import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { FrequencyService } from './frequency.service';
import { UpsertFrequencyDto } from './dto/upsert-frequency.dto';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class FrequencyController {
  constructor(private readonly frequency: FrequencyService) {}

  /** Member: traffic-light status of another member (no numbers) */
  @Get('members/:memberId/frequency')
  getPublicStatus(@Param('memberId') memberId: string, @Req() req: AuthenticatedRequest) {
    return this.frequency.getPublicStatus(memberId, req.dbUser.id);
  }

  /** Member: own full frequency detail (league-scoped "me") */
  @Get('leagues/:leagueId/members/me/frequency')
  getOwnDetail(@Param('leagueId') leagueId: string, @Req() req: AuthenticatedRequest) {
    return this.frequency.getOwnDetail(leagueId, req.dbUser.id);
  }

  /** Member: upsert own frequency preference */
  @Put('leagues/:leagueId/members/me/frequency')
  upsert(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertFrequencyDto,
  ) {
    return this.frequency.upsert(leagueId, req.dbUser.id, dto);
  }
}
