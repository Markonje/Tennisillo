import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthService } from './auth.service';
import { SupabaseJwtGuard } from './supabase-jwt.guard';

@Module({
  imports: [PrismaModule],
  providers: [AuthService, SupabaseJwtGuard],
  exports: [AuthService, SupabaseJwtGuard],
})
export class AuthModule {}
