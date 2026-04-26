import { IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { LeagueSport, LeagueType } from '@tennisillo/db';

export class CreateLeagueDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsEnum(LeagueSport)
  sport!: LeagueSport;

  @IsEnum(LeagueType)
  type!: LeagueType;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  maxMembers?: number;
}
