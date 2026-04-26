import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PlayerLevel } from '@tennisillo/db';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsInt()
  @Min(1940)
  @Max(2015)
  birthYear?: number;

  @IsOptional()
  @IsEnum(PlayerLevel)
  globalLevel?: PlayerLevel;
}
