import { MatchFormat } from '@tennisillo/db';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateChallengeDto {
  /** SeasonPlayer.id of the challenged opponent */
  @IsString()
  @MinLength(1)
  opponentPlayerId!: string;

  @IsOptional()
  @IsEnum(MatchFormat)
  format?: MatchFormat;

  /** Proposed date/time; can also be agreed at acceptance time */
  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  /** Freeform venue text (structured Venue FK arrives in Sprint 5) */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  venueTextFallback?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;
}
