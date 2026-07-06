import { MatchStatus } from '@tennisillo/db';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';

export class ListMatchesQuery {
  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  /** SeasonPlayer.id — filters matches where the player is P1 or P2 */
  @IsOptional()
  @IsString()
  playerId?: string;

  @IsOptional()
  @IsISO8601()
  from?: string;

  @IsOptional()
  @IsISO8601()
  to?: string;
}
