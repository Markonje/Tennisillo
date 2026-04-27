import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@tennisillo/db';
import * as crypto from 'node:crypto';
import { AuthService, type SupabaseClaims } from './auth.service';

interface JwtPayload extends SupabaseClaims {
  exp?: number;
  aud?: string;
  role?: string;
}

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(padding), 'base64').toString('utf8');
}

function verifyHs256(token: string, secret: string): JwtPayload {
  const parts = token.split('.');
  if (parts.length !== 3) throw new UnauthorizedException('Invalid token format');

  const [headerB64, payloadB64, signatureB64] = parts as [string, string, string];

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  if (expectedSig !== signatureB64) throw new UnauthorizedException('Invalid token signature');

  const payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtPayload;

  if (payload.exp !== undefined && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new UnauthorizedException('Token expired');
  }

  return payload;
}

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
    const secret = process.env['SUPABASE_JWT_SECRET'];

    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    const claims = verifyHs256(token, secret);
    request.user = claims;
    request.dbUser = await this.authService.syncFromClaims(claims);
    return true;
  }
}
