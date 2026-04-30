import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { LeagueAdminGuard } from './guards/league-admin.guard';
import { SeasonAdminGuard } from './guards/season-admin.guard';
import { SeasonService } from './season.service';
import { CreateSeasonDto } from './dto/create-season.dto';
import { UpdateSeasonDto } from './dto/update-season.dto';
import { TransitionSeasonDto } from './dto/transition-season.dto';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  /** Admin: create season (DRAFT) for a league */
  @Post('leagues/:leagueId/seasons')
  @UseGuards(LeagueAdminGuard)
  createSeason(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateSeasonDto,
  ) {
    return this.seasonService.createSeason(leagueId, req.dbUser.id, dto);
  }

  /** Member: list seasons of a league */
  @Get('leagues/:leagueId/seasons')
  listSeasons(@Param('leagueId') leagueId: string) {
    return this.seasonService.listByLeague(leagueId);
  }

  /** Member: get season detail */
  @Get('seasons/:id')
  getSeason(@Param('id') id: string) {
    return this.seasonService.findById(id);
  }

  /** Admin: update mutable fields (only DRAFT or REGISTRATION) */
  @Patch('seasons/:id')
  @UseGuards(SeasonAdminGuard)
  updateSeason(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateSeasonDto,
  ) {
    return this.seasonService.updateSeason(id, req.dbUser.id, dto);
  }

  /** Admin: transition season status */
  @Post('seasons/:id/transition')
  @UseGuards(SeasonAdminGuard)
  transitionSeason(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: TransitionSeasonDto,
  ) {
    return this.seasonService.transitionSeason(id, req.dbUser.id, dto);
  }

  /** Admin: delete season (only DRAFT) */
  @Delete('seasons/:id')
  @UseGuards(SeasonAdminGuard)
  deleteSeason(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.seasonService.deleteSeason(id, req.dbUser.id);
  }

  /** Member: register self for a season */
  @Post('seasons/:id/registrations')
  registerSelf(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.seasonService.registerSelf(id, req.dbUser.id);
  }

  /** Member: unregister self from a season */
  @Delete('seasons/:id/registrations/me')
  unregisterSelf(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.seasonService.unregisterSelf(id, req.dbUser.id);
  }

  /** Member: list registered players */
  @Get('seasons/:id/players')
  getPlayers(@Param('id') id: string) {
    return this.seasonService.getPlayers(id);
  }

  /** Member: get current ranking snapshot */
  @Get('seasons/:id/ranking')
  getRanking(@Param('id') id: string) {
    return this.seasonService.getRanking(id);
  }
}
