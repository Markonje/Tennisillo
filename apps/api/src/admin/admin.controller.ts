import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard } from '../auth/supabase-jwt.guard';
import { LeagueAdminGuard } from '../seasons/guards/league-admin.guard';
import { AdminService } from './admin.service';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  /** Admin: league dashboard (overview, disputes, anti-fraud alerts, audit) */
  @Get('leagues/:leagueId/admin/overview')
  @UseGuards(LeagueAdminGuard)
  overview(@Param('leagueId') leagueId: string) {
    return this.admin.overview(leagueId);
  }
}
