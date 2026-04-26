import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { LeagueService } from './league.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueSettingsDto } from './dto/update-settings.dto';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { UserService } from '../users/user.service';

@Controller('leagues')
@UseGuards(SupabaseJwtGuard)
export class LeagueController {
  constructor(
    private readonly leagueService: LeagueService,
    private readonly userService: UserService,
  ) {}

  private async resolveDbUserId(sub: string): Promise<string> {
    const user = await this.userService.findBySupabaseId(sub);
    if (!user) throw new UnauthorizedException('User not synced — call GET /me first');
    return user.id;
  }

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() dto: CreateLeagueDto) {
    const userId = await this.resolveDbUserId(req.user.sub);
    return this.leagueService.create(dto, userId);
  }

  @Get('me')
  async getMyLeagues(@Req() req: AuthenticatedRequest) {
    const userId = await this.resolveDbUserId(req.user.sub);
    return this.leagueService.findByUser(userId);
  }

  @Get(':id')
  getLeague(@Param('id') id: string) {
    return this.leagueService.findById(id);
  }

  @Post(':id/join')
  async joinLeague(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = await this.resolveDbUserId(req.user.sub);
    return this.leagueService.join(id, userId);
  }

  @Post(':id/approve/:memberId')
  async approveMember(
    @Param('id') leagueId: string,
    @Param('memberId') memberId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = await this.resolveDbUserId(req.user.sub);
    return this.leagueService.approve(leagueId, memberId, adminId);
  }

  @Post(':id/invite')
  async generateInvite(@Param('id') leagueId: string, @Req() req: AuthenticatedRequest) {
    const adminId = await this.resolveDbUserId(req.user.sub);
    return this.leagueService.generateInviteCode(leagueId, adminId);
  }

  @Post('join/:code')
  async joinByCode(@Param('code') code: string, @Req() req: AuthenticatedRequest) {
    const userId = await this.resolveDbUserId(req.user.sub);
    return this.leagueService.joinByCode(code, userId);
  }

  @Put(':id/settings')
  async updateSettings(
    @Param('id') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateLeagueSettingsDto,
  ) {
    const adminId = await this.resolveDbUserId(req.user.sub);
    return this.leagueService.updateSettings(leagueId, dto, adminId);
  }
}
