import { Module } from '@nestjs/common';
import { FrequencyController } from './frequency.controller';
import { FrequencyService } from './frequency.service';

@Module({
  controllers: [FrequencyController],
  providers: [FrequencyService],
  exports: [FrequencyService],
})
export class FrequencyModule {}
