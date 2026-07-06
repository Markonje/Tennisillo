import { AvailabilityOverrideType } from '@tennisillo/db';
import { IsEnum, IsISO8601, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateOverrideDto {
  @IsEnum(AvailabilityOverrideType)
  type!: AvailabilityOverrideType;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  note?: string;
}
