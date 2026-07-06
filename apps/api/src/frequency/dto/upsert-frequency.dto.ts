import { FrequencyUnit } from '@tennisillo/db';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpsertFrequencyDto {
  @IsInt()
  @Min(1)
  @Max(14)
  idealFrequency!: number;

  @IsInt()
  @Min(1)
  @Max(21)
  maxFrequency!: number;

  @IsOptional()
  @IsEnum(FrequencyUnit)
  unit?: FrequencyUnit;
}
