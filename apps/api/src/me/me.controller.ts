import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { UserService, type SupabaseUserPayload } from '../users/user.service';

function buildPayload(user: AuthenticatedRequest['user']): SupabaseUserPayload {
  const payload: SupabaseUserPayload = { sub: user.sub };
  if (user.email !== undefined) payload.email = user.email;
  const raw = user as unknown as Record<string, unknown>;
  const meta = raw['user_metadata'];
  if (typeof meta === 'object' && meta !== null) {
    const m = meta as Record<string, unknown>;
    const metaObj: SupabaseUserPayload['user_metadata'] = {};
    if (typeof m['full_name'] === 'string') metaObj.full_name = m['full_name'];
    if (typeof m['name'] === 'string') metaObj.name = m['name'];
    payload.user_metadata = metaObj;
  }
  return payload;
}

@Controller('me')
export class MeController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(SupabaseJwtGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return this.userService.upsertFromSupabase(buildPayload(req.user));
  }
}
