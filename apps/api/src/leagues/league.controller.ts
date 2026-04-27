import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeagueService } from './league.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueSettingsDto } from './dto/update-settings.dto';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';

@Controller('leagues')
@UseGuards(SupabaseJwtGuard)
export class LeagueController {
  constructor(private readonly leagueService: LeagueService) {}

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateLeagueDto) {
    return this.leagueService.create(dto, req.dbUser.id);
  }

  @Get('me')
  getMyLeagues(@Req() req: AuthenticatedRequest) {
    return this.leagueService.findByUser(req.dbUser.id);
  }

  @Get(':id')
  getLeague(@Param('id') id: string) {
    return this.leagueService.findById(id);
  }

  @Post(':id/join')
  joinLeague(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.leagueService.join(id, req.dbUser.id);
  }

  @Post(':id/approve/:memberId')
  approveMember(
    @Param('id') leagueId: string,
    @Param('memberId') memberId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.leagueService.approve(leagueId, memberId, req.dbUser.id);
  }

  @Post(':id/invite')
  generateInvite(@Param('id') leagueId: string, @Req() req: AuthenticatedRequest) {
    return this.leagueService.generateInviteCode(leagueId, req.dbUser.id);
  }

  @Post('join/:code')
  joinByCode(@Param('code') code: string, @Req() req: AuthenticatedRequest) {
    return this.leagueService.joinByCode(code, req.dbUser.id);
  }

  @Put(':id/settings')
  updateSettings(
    @Param('id') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateLeagueSettingsDto,
  ) {
    return this.leagueService.updateSettings(leagueId, dto, req.dbUser.id);
  }
}
