import { MasterMode } from '@tennisillo/db';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class PromoteMasterDto {
  /** User.id to promote */
  @IsString()
  @MinLength(1)
  userId!: string;

  @IsEnum(MasterMode)
  masterMode!: MasterMode;
}

export class UpdateMasterDto {
  @IsOptional()
  @IsEnum(MasterMode)
  masterMode?: MasterMode;

  /** true → revoke the MASTER role (back to PLAYER) */
  @IsOptional()
  @IsBoolean()
  revoke?: boolean;
}

export class UpdateMasterProfileDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  certifications?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  specializations?: string[];
}
