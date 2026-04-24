import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';

@Controller('me')
export class MeController {
  @Get()
  @UseGuards(SupabaseJwtGuard)
  getMe(@Req() req: AuthenticatedRequest): { sub: string; email?: string } {
    return { sub: req.user.sub, email: req.user.email };
  }
}
