import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@tennisillo/db';
import type { UpdateProfileDto } from './dto/update-profile.dto';

export interface SupabaseUserPayload {
  sub: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string };
}

function generateUsername(email: string): string {
  const base = email.split('@')[0]?.replace(/[^a-z0-9]/gi, '') ?? 'user';
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}_${suffix}`;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async upsertFromSupabase(payload: SupabaseUserPayload): Promise<User> {
    const email = payload.email ?? `${payload.sub}@unknown.local`;
    const displayName =
      payload.user_metadata?.full_name ??
      payload.user_metadata?.name ??
      email.split('@')[0] ??
      'Player';

    const existing = await this.prisma.user.findUnique({
      where: { supabaseId: payload.sub },
    });

    if (existing) {
      return this.prisma.user.update({
        where: { supabaseId: payload.sub },
        data: { email, displayName },
      });
    }

    return this.prisma.user.create({
      data: {
        supabaseId: payload.sub,
        email,
        username: generateUsername(email),
        displayName,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findBySupabaseId(supabaseId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { supabaseId } });
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.displayName !== undefined && { displayName: dto.displayName }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.birthYear !== undefined && { birthYear: dto.birthYear }),
        ...(dto.globalLevel !== undefined && { globalLevel: dto.globalLevel }),
      },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({ where: { deletedAt: null } });
  }
}
