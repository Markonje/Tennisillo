import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateSeasonDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(200)
  maxPlayers?: number;

  @IsOptional()
  @IsInt()
  @Min(6)
  @Max(52)
  plannedDurationWeeks?: number;
}
