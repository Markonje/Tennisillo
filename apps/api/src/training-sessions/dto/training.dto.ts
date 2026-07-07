import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class DeclareSparringDto {
  /** LeagueMember.id of the sparring partner */
  @IsString()
  @MinLength(1)
  player2MemberId!: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsString()
  venueId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  focusNote?: string;
}

export class DeclareLessonDto {
  /** User.id of the master */
  @IsString()
  @MinLength(1)
  masterId!: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string;

  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(480)
  durationMinutes?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  focusNote?: string;

  @IsOptional()
  @IsString()
  venueId?: string;
}

export class RejectSessionDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reason!: string;
}

export class RevokeSessionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  reason!: string;
}
