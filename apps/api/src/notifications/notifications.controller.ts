import { Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SupabaseJwtGuard, type AuthenticatedRequest } from '../auth/supabase-jwt.guard';
import { NotificationsService } from './notifications.service';

@Controller()
@UseGuards(SupabaseJwtGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** User: own notifications, newest first */
  @Get('users/me/notifications')
  list(@Req() req: AuthenticatedRequest, @Query('unread') unread?: string) {
    return this.notifications.list(req.dbUser.id, unread === 'true');
  }

  /** User: unread counter (for the nav badge) */
  @Get('users/me/notifications/unread-count')
  unreadCount(@Req() req: AuthenticatedRequest) {
    return this.notifications.unreadCount(req.dbUser.id);
  }

  /** User: mark one notification as read */
  @Post('notifications/:id/read')
  markRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notifications.markRead(id, req.dbUser.id);
  }

  /** User: mark everything as read */
  @Post('users/me/notifications/read-all')
  markAllRead(@Req() req: AuthenticatedRequest) {
    return this.notifications.markAllRead(req.dbUser.id);
  }
}
