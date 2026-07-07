import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { MatchLeagueAdminGuard } from './guards/match-league-admin.guard';
import { MatchesService } from './matches.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { AcceptChallengeDto } from './dto/accept-challenge.dto';
import { RescheduleMatchDto } from './dto/reschedule-match.dto';
import { SubmitResultDto } from './dto/submit-result.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';
import { ListMatchesQuery } from './dto/list-matches.query';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class MatchesController {
  constructor(private readonly matches: MatchesService) {}

  /** Player: challenge another season player (creates a PENDING_ACCEPTANCE match) */
  @Post('seasons/:seasonId/challenges')
  createChallenge(
    @Param('seasonId') seasonId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateChallengeDto,
  ) {
    return this.matches.createChallenge(seasonId, req.dbUser.id, dto);
  }

  /** Member: list matches of a season, with filters */
  @Get('seasons/:seasonId/matches')
  listMatches(@Param('seasonId') seasonId: string, @Query() query: ListMatchesQuery) {
    return this.matches.listBySeason(seasonId, query);
  }

  /** Member: match detail */
  @Get('matches/:id')
  getMatch(@Param('id') id: string) {
    return this.matches.getMatch(id);
  }

  /** Challenged player: accept (schedules the match) */
  @Post('matches/:id/accept')
  accept(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: AcceptChallengeDto,
  ) {
    return this.matches.acceptChallenge(id, req.dbUser.id, dto);
  }

  /** Challenged player: decline */
  @Post('matches/:id/decline')
  decline(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.matches.declineChallenge(id, req.dbUser.id);
  }

  /** Participant: cancel (withdraw pending challenge or cancel scheduled match) */
  @Post('matches/:id/cancel')
  cancel(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.matches.cancelMatch(id, req.dbUser.id);
  }

  /** Participant: reschedule a SCHEDULED match */
  @Post('matches/:id/reschedule')
  reschedule(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RescheduleMatchDto,
  ) {
    return this.matches.rescheduleMatch(id, req.dbUser.id, dto);
  }

  /** Participant: submit the result (starts the validation window) */
  @Post('matches/:id/result')
  submitResult(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubmitResultDto,
  ) {
    return this.matches.submitResult(id, req.dbUser.id, dto);
  }

  /** Non-submitter participant: confirm the result */
  @Post('matches/:id/confirm')
  confirm(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.matches.confirmResult(id, req.dbUser.id);
  }

  /** Non-submitter participant: contest the result (opens a dispute) */
  @Post('matches/:id/dispute')
  openDispute(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: OpenDisputeDto,
  ) {
    return this.matches.openDispute(id, req.dbUser.id, dto);
  }

  /** Admin: resolve an open dispute */
  @Post('matches/:id/dispute/resolve')
  @UseGuards(MatchLeagueAdminGuard)
  resolveDispute(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.matches.resolveDispute(id, req.dbUser.id, dto);
  }
}
