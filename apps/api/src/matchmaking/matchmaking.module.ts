import { Module } from '@nestjs/common';
import { FrequencyModule } from '../frequency/frequency.module';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';

@Module({
  imports: [FrequencyModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService],
})
export class MatchmakingModule {}
