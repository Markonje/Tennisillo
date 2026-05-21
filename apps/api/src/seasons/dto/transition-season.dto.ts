import { IsIn } from 'class-validator';

export class TransitionSeasonDto {
  @IsIn(['REGISTRATION', 'ACTIVE', 'COMPLETED'])
  to!: 'REGISTRATION' | 'ACTIVE' | 'COMPLETED';
}
