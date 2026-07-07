import { IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class AcceptChallengeDto {
  /** Required if the challenge did not propose a date */
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  venueId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  venueTextFallback?: string;
}
