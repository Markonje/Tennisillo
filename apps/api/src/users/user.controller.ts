import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Post,
  Req,
  UseGuards,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { UserService, type SupabaseUserPayload } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';

interface PublicUserProfile {
  id: string;
  displayName: string;
  globalLevel: string;
  globalRating: number;
  globalExperiencePoints: number;
  reputationScore: number;
}

function extractUserMetadata(
  user: AuthenticatedRequest['user'],
): SupabaseUserPayload['user_metadata'] {
  const raw = user as unknown as Record<string, unknown>;
  const meta = raw['user_metadata'];
  if (typeof meta !== 'object' || meta === null) return undefined;
  const m = meta as Record<string, unknown>;
  const result: SupabaseUserPayload['user_metadata'] = {};
  if (typeof m['full_name'] === 'string') result.full_name = m['full_name'];
  if (typeof m['name'] === 'string') result.name = m['name'];
  return result;
}

function buildPayload(user: AuthenticatedRequest['user']): SupabaseUserPayload {
  const payload: SupabaseUserPayload = { sub: user.sub };
  if (user.email !== undefined) payload.email = user.email;
  const meta = extractUserMetadata(user);
  if (meta !== undefined) payload.user_metadata = meta;
  return payload;
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(SupabaseJwtGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return this.userService.upsertFromSupabase(buildPayload(req.user));
  }

  @Put('me')
  @UseGuards(SupabaseJwtGuard)
  async updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    const user = await this.userService.findBySupabaseId(req.user.sub);
    if (!user) throw new UnauthorizedException('User not synced');
    return this.userService.updateProfile(user.id, dto);
  }

  @Get(':id')
  @UseGuards(SupabaseJwtGuard)
  async getPublicProfile(@Param('id') id: string): Promise<PublicUserProfile> {
    const user = await this.userService.findById(id);
    if (!user) throw new NotFoundException('User not found');

    return {
      id: user.id,
      displayName: user.displayName,
      globalLevel: user.globalLevel,
      globalRating: user.globalRating,
      globalExperiencePoints: user.globalExperiencePoints,
      reputationScore: user.reputationScore,
    };
  }

  @Post('sync')
  async syncFromSupabase(
    @Body() body: { sub: string; email?: string; user_metadata?: { full_name?: string } },
    @Req() req: Request,
  ) {
    const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
    const authHeader = req.headers['authorization'];
    if (!serviceKey || authHeader !== `Bearer ${serviceKey}`) {
      throw new UnauthorizedException('Service role key required');
    }
    const payload: SupabaseUserPayload = { sub: body.sub };
    if (body.email !== undefined) payload.email = body.email;
    if (body.user_metadata !== undefined) payload.user_metadata = body.user_metadata;
    return this.userService.upsertFromSupabase(payload);
  }
}
