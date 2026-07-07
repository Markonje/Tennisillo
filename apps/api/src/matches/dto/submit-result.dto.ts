import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SetScoreDto {
  @IsInt()
  @Min(0)
  @Max(30)
  p1!: number;

  @IsInt()
  @Min(0)
  @Max(30)
  p2!: number;
}

export class SubmitResultDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => SetScoreDto)
  sets!: SetScoreDto[];
}
