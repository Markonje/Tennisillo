import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from './user.service';
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

@Controller('users')
@UseGuards(SupabaseJwtGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  getMe(@Req() req: AuthenticatedRequest) {
    return req.dbUser;
  }

  @Put('me')
  updateMe(@Req() req: AuthenticatedRequest, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.dbUser.id, dto);
  }

  @Get(':id')
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
}
