import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

export const DISPUTE_DECISIONS = ['UPHELD', 'REJECTED'] as const;
export type DisputeDecision = (typeof DISPUTE_DECISIONS)[number];

export class ResolveDisputeDto {
  /**
   * UPHELD  → the dispute is founded: the submitted result is discarded and
   *           the match returns to PENDING_RESULT for resubmission.
   * REJECTED → the dispute is unfounded: the submitted result stands and the
   *            match is finalized as VALIDATED.
   */
  @IsIn(DISPUTE_DECISIONS)
  decision!: DisputeDecision;

  /** Mandatory motivation, recorded in the audit trail */
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  resolution!: string;
}
