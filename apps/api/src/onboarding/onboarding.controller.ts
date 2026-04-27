import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@Controller('onboarding')
@UseGuards(SupabaseJwtGuard)
export class OnboardingController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('status')
  getStatus(@Req() req: AuthenticatedRequest) {
    return { completed: req.dbUser.onboardingCompleted };
  }

  @Post('complete')
  async complete(@Req() req: AuthenticatedRequest, @Body() dto: CompleteOnboardingDto) {
    const userId = req.dbUser.id;
    const cityValue = dto.city ?? null;

    return this.prisma.$transaction(async (tx) => {
      await tx.userOnboarding.upsert({
        where: { userId },
        create: {
          userId,
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

      return tx.user.update({
        where: { id: userId },
        data: {
          globalLevel: dto.skillLevel,
          birthYear: dto.birthYear,
          city: cityValue,
          onboardingCompleted: true,
        },
      });
    });
  }
}
