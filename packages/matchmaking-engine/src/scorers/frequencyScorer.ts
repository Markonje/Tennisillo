import type { CandidateContext, FrequencyStatus } from '../types';

export interface FrequencyScore {
  score: number;
  status: FrequencyStatus;
  warnings: string[];
}

/** Frequency traffic light (specs/02 §6.4 + spec 01 §10.3). */
export function scoreFrequency(c: CandidateContext): FrequencyScore {
  if (!c.hasFrequencyDeclared) {
    return { score: 50, status: 'UNKNOWN', warnings: [] };
  }

  if (c.currentPeriodMatches >= c.maxFrequency) {
    return { score: 5, status: 'RED', warnings: ['MAX_FREQUENCY_REACHED'] };
  }

  if (c.currentPeriodMatches >= c.idealFrequency) {
    return { score: 50, status: 'YELLOW', warnings: [] };
  }

  return { score: 100, status: 'GREEN', warnings: [] };
}
