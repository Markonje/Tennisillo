import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class RescheduleMatchDto {
  @IsISO8601()
  scheduledAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  venueTextFallback?: string;
}
