import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@tennisillo/db';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { AuthService, type SupabaseClaims } from './auth.service';

interface JwtPayload extends SupabaseClaims {
  exp?: number;
  aud?: string;
  role?: string;
}

// Module-level singleton: jose caches the key set after the first fetch and
// re-fetches only when it encounters an unknown key ID (i.e. after rotation).
const supabaseJwks = createRemoteJWKSet(
  new URL(
    `${process.env['SUPABASE_URL'] ?? 'https://xmtrfkphtvqgxmscfcgw.supabase.co'}/auth/v1/.well-known/jwks.json`,
  ),
);

export interface AuthenticatedRequest extends Request {
  /** Raw JWT claims as decoded from the Supabase access token. */
  user: JwtPayload;
  /** Local DB user row, lazily upserted on first authenticated request. */
  dbUser: User;
}

@Injectable()
export class SupabaseJwtGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers['authorization'];

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }

    const token = authHeader.slice(7);

    let claims: JwtPayload;
    try {
      const { payload } = await jwtVerify(token, supabaseJwks, {
        algorithms: ['ES256'],
      });
      claims = payload as unknown as JwtPayload;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = claims;
    request.dbUser = await this.authService.syncFromClaims(claims);
    return true;
  }
}
