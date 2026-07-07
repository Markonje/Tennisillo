import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { NotificationType } from '@tennisillo/db';
import { PrismaService } from '../prisma/prisma.service';

export interface SerializedNotification {
  id: string;
  type: NotificationType;
  payload: unknown;
  isRead: boolean;
  createdAt: Date;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string, unreadOnly: boolean, limit = 50): Promise<SerializedNotification[]> {
    const rows = await this.prisma.notification.findMany({
      where: { userId, ...(unreadOnly && { isRead: false }) },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return rows.map((n) => this.serialize(n));
  }

  async unreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { count };
  }

  async markRead(notificationId: string, userId: string): Promise<SerializedNotification> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) {
      throw new ForbiddenException('Not your notification');
    }
    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });
    return this.serialize(updated);
  }

  private serialize(n: {
    id: string;
    type: NotificationType;
    payload: unknown;
    isRead: boolean;
    createdAt: Date;
  }): SerializedNotification {
    return {
      id: n.id,
      type: n.type,
      payload: n.payload,
      isRead: n.isRead,
      createdAt: n.createdAt,
    };
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { count: 0 };
  }
}
