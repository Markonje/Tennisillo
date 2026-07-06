import { generateInviteCode } from './invite-code';

const CHARSET = new Set('ABCDEFGHJKMNPQRSTUVWXYZ23456789');

describe('generateInviteCode', () => {
  it('produces a string of the requested length', () => {
    expect(generateInviteCode(8)).toHaveLength(8);
    expect(generateInviteCode(6)).toHaveLength(6);
    expect(generateInviteCode(12)).toHaveLength(12);
  });

  it('only contains characters from the allowed charset', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateInviteCode(8);
      for (const char of code) {
        expect(CHARSET.has(char)).toBe(true);
      }
    }
  });

  it('does not produce collisions across 1000 calls', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateInviteCode(8));
    }
    // With 32^8 ≈ 1 trillion possibilities, collision probability is negligible
    expect(codes.size).toBeGreaterThan(995);
  });

  it('uses the provided randomFn for deterministic testing', () => {
    const fakeRandom = () => Buffer.alloc(8, 0); // all-zero bytes
    // CHARSET[0 % 32] === 'A'
    expect(generateInviteCode(8, fakeRandom)).toBe('AAAAAAAA');
  });
});
