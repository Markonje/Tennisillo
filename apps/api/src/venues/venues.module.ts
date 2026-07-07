import { Module } from '@nestjs/common';
import { VenuesController } from './venues.controller';
import { VenuesService } from './venues.service';
import { GeocodingService } from './geocoding.service';
import { LeagueAdminGuard } from '../seasons/guards/league-admin.guard';
import { ProposalAdminGuard, VenueAdminGuard } from './guards/venue-admin.guard';

@Module({
  controllers: [VenuesController],
  providers: [VenuesService, GeocodingService, LeagueAdminGuard, VenueAdminGuard, ProposalAdminGuard],
  exports: [VenuesService],
})
export class VenuesModule {}
