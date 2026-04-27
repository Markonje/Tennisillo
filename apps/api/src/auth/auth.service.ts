import { Injectable } from '@nestjs/common';
import type { User } from '@tennisillo/db';
import { PrismaService } from '../prisma/prisma.service';

export interface SupabaseClaims {
  sub: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
}

function generateUsername(email: string): string {
  const base = email.split('@')[0]?.replace(/[^a-z0-9]/gi, '') ?? 'user';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}_${suffix}`;
}

function deriveDisplayName(claims: SupabaseClaims, email: string): string {
  return (
    claims.user_metadata?.full_name ??
    claims.user_metadata?.name ??
    email.split('@')[0] ??
    'Player'
  );
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lazy upsert from Supabase JWT claims.
   *
   * - On first call (user not in DB): creates the row.
   * - On subsequent calls: updates only `email` (the single field that can
   *   change in Supabase Auth and is also tracked locally). User-editable
   *   fields like `displayName` are NEVER overwritten here.
   */
  async syncFromClaims(claims: SupabaseClaims): Promise<User> {
    const email = claims.email ?? `${claims.sub}@unknown.local`;

    const existing = await this.prisma.user.findUnique({
      where: { supabaseId: claims.sub },
    });

    if (existing) {
      if (existing.email === email) return existing;
      return this.prisma.user.update({
        where: { supabaseId: claims.sub },
        data: { email },
      });
    }

    return this.prisma.user.create({
      data: {
        supabaseId: claims.sub,
        email,
        username: generateUsername(email),
        displayName: deriveDisplayName(claims, email),
      },
    });
  }
}
