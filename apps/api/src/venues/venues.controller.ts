import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { LeagueAdminGuard } from '../seasons/guards/league-admin.guard';
import { ProposalAdminGuard, VenueAdminGuard } from './guards/venue-admin.guard';
import { VenuesService } from './venues.service';
import { GeocodingService } from './geocoding.service';
import {
  CreateVenueDto,
  GeocodeDto,
  RejectProposalDto,
  UpdateVenueDto,
  UpsertFavoriteVenuesDto,
} from './dto/venue.dto';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class VenuesController {
  constructor(
    private readonly venues: VenuesService,
    private readonly geocoding: GeocodingService,
  ) {}

  /** Member: list league venues */
  @Get('leagues/:leagueId/venues')
  list(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Query('includeArchived') includeArchived?: string,
  ) {
    return this.venues.listByLeague(leagueId, req.dbUser.id, includeArchived === 'true');
  }

  /** Admin: create venue (published immediately) */
  @Post('leagues/:leagueId/venues')
  @UseGuards(LeagueAdminGuard)
  create(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateVenueDto,
  ) {
    return this.venues.create(leagueId, req.dbUser.id, dto);
  }

  /** Member: venue detail */
  @Get('venues/:id')
  getById(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.venues.getById(id, req.dbUser.id);
  }

  /** Admin: update venue */
  @Patch('venues/:id')
  @UseGuards(VenueAdminGuard)
  update(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateVenueDto,
  ) {
    return this.venues.update(id, req.dbUser.id, dto);
  }

  /** Admin: archive venue (soft delete) */
  @Delete('venues/:id')
  @UseGuards(VenueAdminGuard)
  archive(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.venues.archive(id, req.dbUser.id);
  }

  /** Player: propose a new venue (requires admin approval) */
  @Post('leagues/:leagueId/venue-proposals')
  propose(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateVenueDto,
  ) {
    return this.venues.propose(leagueId, req.dbUser.id, dto);
  }

  /** Admin: list pending proposals */
  @Get('leagues/:leagueId/venue-proposals')
  @UseGuards(LeagueAdminGuard)
  listProposals(@Param('leagueId') leagueId: string) {
    return this.venues.listProposals(leagueId);
  }

  /** Admin: approve proposal → creates the venue */
  @Post('venue-proposals/:id/approve')
  @UseGuards(ProposalAdminGuard)
  approveProposal(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() edits: UpdateVenueDto,
  ) {
    return this.venues.approveProposal(id, req.dbUser.id, edits);
  }

  /** Admin: reject proposal with motivation */
  @Post('venue-proposals/:id/reject')
  @UseGuards(ProposalAdminGuard)
  rejectProposal(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RejectProposalDto,
  ) {
    return this.venues.rejectProposal(id, req.dbUser.id, dto.reviewNotes);
  }

  /** Member: own favorite venues (max 3, ordered) */
  @Get('leagues/:leagueId/members/me/favorite-venues')
  getFavorites(@Param('leagueId') leagueId: string, @Req() req: AuthenticatedRequest) {
    return this.venues.getFavorites(leagueId, req.dbUser.id);
  }

  /** Member: replace favorite venues list */
  @Put('leagues/:leagueId/members/me/favorite-venues')
  upsertFavorites(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpsertFavoriteVenuesDto,
  ) {
    return this.venues.upsertFavorites(leagueId, req.dbUser.id, dto);
  }

  /** Member: geocode an address (Mapbox wrapper, cached) */
  @Post('venues/geocode')
  geocode(@Body() dto: GeocodeDto) {
    return this.geocoding.geocode(dto.address);
  }
}
