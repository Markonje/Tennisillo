import { Type } from 'class-transformer';
import { VenueCover, VenueSurface } from '@tennisillo/db';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateVenueDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(5)
  @MaxLength(300)
  address!: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsEnum(VenueSurface)
  surface?: VenueSurface;

  @IsOptional()
  @IsEnum(VenueCover)
  cover?: VenueCover;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  courtCount?: number;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  bookingUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  /** cents EUR */
  @IsOptional()
  @IsInt()
  @Min(0)
  priceRangeLow?: number;

  /** cents EUR */
  @IsOptional()
  @IsInt()
  @Min(0)
  priceRangeHigh?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateVenueDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  address?: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsOptional()
  @IsEnum(VenueSurface)
  surface?: VenueSurface;

  @IsOptional()
  @IsEnum(VenueCover)
  cover?: VenueCover;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  courtCount?: number;

  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  bookingUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceRangeLow?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  priceRangeHigh?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class RejectProposalDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  reviewNotes!: string;
}

export class GeocodeDto {
  @IsString()
  @MinLength(5)
  @MaxLength(300)
  address!: string;
}

export class FavoriteVenueItemDto {
  @IsString()
  venueId!: string;

  @IsInt()
  @Min(1)
  @Max(3)
  priority!: number;
}

export class UpsertFavoriteVenuesDto {
  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => FavoriteVenueItemDto)
  venues!: FavoriteVenueItemDto[];
}
