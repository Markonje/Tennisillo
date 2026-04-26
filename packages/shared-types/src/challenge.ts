export type ChallengeStatus = 'pending' | 'confirmed' | 'rejected';
export type ChallengeType = 'match' | 'sparring';

export interface Challenge {
  id: string;
  fromId: string;
  proposedDate: string;
  venue?: string;
  time?: string;
  type?: ChallengeType;
  status?: ChallengeStatus;
  createdAt?: string;
}
