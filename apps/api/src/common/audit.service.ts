import { Injectable } from '@nestjs/common';
import { Prisma } from '@tennisillo/db';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    action: string,
    actorId: string,
    entityType: string,
    entityId: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        action,
        userId: actorId,
        entityType,
        entityId,
        payload: payload as Prisma.InputJsonValue,
      },
    });
  }
}
