import { Module } from '@nestjs/common';
import { MastersController } from './masters.controller';
import { MastersService } from './masters.service';
import { LeagueAdminGuard } from '../seasons/guards/league-admin.guard';

@Module({
  controllers: [MastersController],
  providers: [MastersService, LeagueAdminGuard],
  exports: [MastersService],
})
export class MastersModule {}
