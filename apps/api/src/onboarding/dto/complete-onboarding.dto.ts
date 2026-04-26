import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PlayerLevel } from '@tennisillo/db';

export class CompleteOnboardingDto {
  @IsEnum(PlayerLevel)
  skillLevel!: PlayerLevel;

  @IsInt()
  @Min(1940)
  @Max(2015)
  birthYear!: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;
}
