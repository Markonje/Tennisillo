import { randomBytes } from 'node:crypto';

// Excludes 0/O, 1/I/l/L to reduce visual ambiguity when reading codes aloud
const CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

// CHARSET.length === 32 divides 256 evenly → no modulo bias
export function generateInviteCode(
  length = 8,
  randomFn: (size: number) => Buffer = randomBytes,
): string {
  const bytes = randomFn(length);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join('');
}
