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
import { SessionLeagueAdminGuard } from './guards/session-league-admin.guard';
import { TrainingSessionsService } from './training-sessions.service';
import {
  DeclareLessonDto,
  DeclareSparringDto,
  RejectSessionDto,
  RevokeSessionDto,
} from './dto/training.dto';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class TrainingSessionsController {
  constructor(private readonly training: TrainingSessionsService) {}

  // ── Sparring (spec 02 §7.3) ──────────────────────────────────────────────

  /** Player: declare a sparring session (partner must confirm) */
  @Post('leagues/:leagueId/sparring')
  declareSparring(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: DeclareSparringDto,
  ) {
    return this.training.declareSparring(leagueId, req.dbUser.id, dto);
  }

  /** Partner: confirm → +fixed points each */
  @Post('sparring/:id/confirm')
  confirmSparring(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.training.confirmSparring(id, req.dbUser.id);
  }

  /** Partner: reject the declaration */
  @Post('sparring/:id/reject')
  rejectSparring(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RejectSessionDto,
  ) {
    return this.training.rejectSparring(id, req.dbUser.id, dto);
  }

  /** Member: session detail */
  @Get('sparring/:id')
  getSparring(@Param('id') id: string) {
    return this.training.getSession(id);
  }

  /** Member: league training sessions (both types), optional user filter */
  @Get('leagues/:leagueId/sparring')
  listByLeague(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Query('userId') userId?: string,
  ) {
    return this.training.listByLeague(leagueId, req.dbUser.id, userId);
  }

  // ── Master lessons ───────────────────────────────────────────────────────

  /** Player: declare a lesson done with a master */
  @Post('leagues/:leagueId/master-lessons')
  declareLesson(
    @Param('leagueId') leagueId: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: DeclareLessonDto,
  ) {
    return this.training.declareLesson(leagueId, req.dbUser.id, dto);
  }

  /** Master: validate → +XP on the player's global profile */
  @Post('master-lessons/:id/validate')
  validateLesson(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.training.validateLesson(id, req.dbUser.id);
  }

  /** Master: reject the declaration */
  @Post('master-lessons/:id/reject')
  rejectLesson(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RejectSessionDto,
  ) {
    return this.training.rejectLesson(id, req.dbUser.id, dto);
  }

  /** Member: lesson detail */
  @Get('master-lessons/:id')
  getLesson(@Param('id') id: string) {
    return this.training.getSession(id);
  }

  /** Player: own lessons */
  @Get('users/me/master-lessons')
  myLessons(@Req() req: AuthenticatedRequest) {
    return this.training.listMyLessons(req.dbUser.id);
  }

  /** Player: global XP summary */
  @Get('users/me/global-xp')
  myGlobalXp(@Req() req: AuthenticatedRequest) {
    return this.training.globalXp(req.dbUser.id);
  }

  // ── Admin ────────────────────────────────────────────────────────────────

  /** Admin: revoke a validated session with motivation (points/XP reversal) */
  @Post('admin/training-sessions/:id/revoke')
  @UseGuards(SessionLeagueAdminGuard)
  revoke(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
    @Body() dto: RevokeSessionDto,
  ) {
    return this.training.revoke(id, req.dbUser.id, dto);
  }
}
