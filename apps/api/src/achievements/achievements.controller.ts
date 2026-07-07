import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { AchievementsService } from './achievements.service';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class AchievementsController {
  constructor(private readonly achievements: AchievementsService) {}

  /** Anyone: badge catalog (created lazily on first award) */
  @Get('achievements')
  catalog() {
    return this.achievements.catalog();
  }

  /** User: own earned badges */
  @Get('users/me/achievements')
  mine(@Req() req: AuthenticatedRequest) {
    return this.achievements.forUser(req.dbUser.id);
  }
}
