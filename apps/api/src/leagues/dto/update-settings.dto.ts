import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateLeagueSettingsDto {
  @IsOptional()
  @IsBoolean()
  sparringEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  masterLessonsEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  availabilityEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  venuesEnabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  sparringWeeklyCapPerPlayer?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  sparringPointsPerPlayer?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  masterXpPerSession?: number;
}
