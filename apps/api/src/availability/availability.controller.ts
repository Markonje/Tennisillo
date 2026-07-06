import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { AvailabilityService } from './availability.service';
import { UpsertPatternDto } from './dto/upsert-pattern.dto';
import { CreateOverrideDto } from './dto/create-override.dto';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class AvailabilityController {
  constructor(private readonly availability: AvailabilityService) {}

  /** Member: pattern + overrides (next 60 days) of a league member */
  @Get('members/:memberId/availability')
  getForMember(@Param('memberId') memberId: string, @Req() req: AuthenticatedRequest) {
    return this.availability.getForMember(memberId, req.dbUser.id);
  }

  /** Member: upsert own recurring weekly pattern (league-scoped "me") */
  @Put('leagues/:leagueId/members/me/availability/pattern')
  upsertPattern(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertPatternDto,
  ) {
    return this.availability.upsertPattern(leagueId, req.dbUser.id, dto);
  }

  /** Member: create a date-specific override */
  @Post('leagues/:leagueId/members/me/availability/overrides')
  createOverride(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateOverrideDto,
  ) {
    return this.availability.createOverride(leagueId, req.dbUser.id, dto);
  }

  /** Member: delete own override */
  @Delete('availability/overrides/:id')
  deleteOverride(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.availability.deleteOverride(id, req.dbUser.id);
  }

  /** Member: collective availability map of the league */
  @Get('leagues/:leagueId/availability/overview')
  overview(@Param('leagueId') leagueId: string, @Req() req: AuthenticatedRequest) {
    return this.availability.leagueOverview(leagueId, req.dbUser.id);
  }
}
