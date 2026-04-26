import { Body, Controller, Get, Post, Req, UseGuards, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserService } from '../users/user.service';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Controller('onboarding')
@UseGuards(SupabaseJwtGuard)
export class OnboardingController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  @Get('status')
  async getStatus(@Req() req: AuthenticatedRequest) {
    const user = await this.userService.findBySupabaseId(req.user.sub);
    if (!user) throw new UnauthorizedException('User not synced');
    return { completed: user.onboardingCompleted };
  }

  @Post('complete')
  async complete(@Req() req: AuthenticatedRequest, @Body() dto: CompleteOnboardingDto) {
    const user = await this.userService.findBySupabaseId(req.user.sub);
    if (!user) throw new UnauthorizedException('User not synced');

    const cityValue = dto.city ?? null;

    await this.prisma.userOnboarding.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        skillLevel: dto.skillLevel,
        birthYear: dto.birthYear,
        city: cityValue,
        currentStep: 3,
        completedAt: new Date(),
      },
      update: {
        skillLevel: dto.skillLevel,
        birthYear: dto.birthYear,
        city: cityValue,
        currentStep: 3,
        completedAt: new Date(),
      },
    });

    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        globalLevel: dto.skillLevel,
        birthYear: dto.birthYear,
        city: cityValue,
        onboardingCompleted: true,
      },
    });
  }
}
