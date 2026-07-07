import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { LeagueAdminGuard } from '../seasons/guards/league-admin.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, LeagueAdminGuard],
})
export class AdminModule {}
