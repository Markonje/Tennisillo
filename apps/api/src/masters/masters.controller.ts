import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { LeagueAdminGuard } from '../seasons/guards/league-admin.guard';
import { MastersService } from './masters.service';
import { PromoteMasterDto, UpdateMasterDto, UpdateMasterProfileDto } from './dto/master.dto';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class MastersController {
  constructor(private readonly masters: MastersService) {}

  /** Admin: invite/promote a member to MASTER */
  @Post('leagues/:leagueId/masters')
  @UseGuards(LeagueAdminGuard)
  promote(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: PromoteMasterDto,
  ) {
    return this.masters.promote(leagueId, req.dbUser.id, dto);
  }

  /** Admin: update masterMode or revoke the role */
  @Patch('leagues/:leagueId/masters/:memberId')
  @UseGuards(LeagueAdminGuard)
  update(
    @Param('leagueId') leagueId: string,
    @Param('memberId') memberId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateMasterDto,
  ) {
    return this.masters.update(leagueId, memberId, req.dbUser.id, dto);
  }

  /** Member: list active masters */
  @Get('leagues/:leagueId/masters')
  list(@Param('leagueId') leagueId: string) {
    return this.masters.list(leagueId);
  }

  /** Anyone: master profile + statistics */
  @Get('masters/:userId/profile')
  profile(@Param('userId') userId: string) {
    return this.masters.profile(userId);
  }

  /** Master: edit own certifications/specializations */
  @Patch('users/me/master-profile')
  updateOwnProfile(@Req() req: AuthenticatedRequest, @Body() dto: UpdateMasterProfileDto) {
    return this.masters.updateOwnProfile(req.dbUser.id, dto);
  }
}
