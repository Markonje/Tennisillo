'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Banner, Button, EmptyState, GlassCard, cn } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

interface NotificationPayload {
  leagueId?: string;
  seasonId?: string;
  matchId?: string;
  sessionId?: string;
  name?: string;
  reason?: string;
}

export interface NotificationDto {
  id: string;
  type: string;
  payload: NotificationPayload;
  isRead: boolean;
  createdAt: string;
}

interface Props {
  locale: string;
  notifications: NotificationDto[];
}

function linkFor(n: NotificationDto, locale: string): string | null {
  const p = n.payload;
  if (p.matchId && p.leagueId && p.seasonId) {
    return `/${locale}/leagues/${p.leagueId}/seasons/${p.seasonId}/matches/${p.matchId}`;
  }
  if (p.sessionId && p.leagueId) {
    return `/${locale}/leagues/${p.leagueId}/training`;
  }
  if (n.type.startsWith('VENUE_') && p.leagueId) {
    return `/${locale}/leagues/${p.leagueId}/venues`;
  }
  if (p.leagueId) {
    return `/${locale}/leagues/${p.leagueId}`;
  }
  return null;
}

export function NotificationsClient({ locale, notifications }: Props) {
  const router = useRouter();
  const t = useTranslations('notifications');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setLoading(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  const hasUnread = notifications.some((n) => !n.isRead);

  return (
    <div className="flex flex-col gap-4">
      {error && <Banner tone="danger">{error}</Banner>}

      {hasUnread && (
        <div>
          <Button
            variant="secondary"
            onClick={() => {
              void run(() => apiClient.post('/users/me/notifications/read-all', {}));
            }}
            disabled={loading}
          >
            {t('markAllRead')}
          </Button>
        </div>
      )}

      <GlassCard className="px-5 py-2">
        {notifications.length === 0 ? (
          <EmptyState icon="🔔" title={t('empty')} />
        ) : (
          notifications.map((n, i) => {
            const href = linkFor(n, locale);
            return (
              <div
                key={n.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 py-3',
                  i < notifications.length - 1 && 'border-b border-glass',
                  !n.isRead && 'bg-accent/[0.04] -mx-2 px-2 rounded-[10px]',
                )}
              >
                {!n.isRead && <span className="size-2 rounded-full bg-accent shrink-0" />}
                <div className="flex-1 min-w-[200px]">
                  <div
                    className={cn(
                      'text-sm',
                      n.isRead ? 'text-tertiary-glass' : 'text-primary-glass font-semibold',
                    )}
                  >
                    {t(`types.${n.type}`)}
                    {n.payload.name && (
                      <span className="text-secondary-glass"> — {n.payload.name}</span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-glass">
                    {new Date(n.createdAt).toLocaleString(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </div>
                </div>
                {href && (
                  <Link
                    href={href}
                    onClick={() => {
                      if (!n.isRead) void apiClient.post(`/notifications/${n.id}/read`, {});
                    }}
                    className="text-xs text-accent-light no-underline hover:underline"
                  >
                    {t('open')} →
                  </Link>
                )}
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => {
                      void run(() => apiClient.post(`/notifications/${n.id}/read`, {}));
                    }}
                    className="text-xs text-tertiary-glass hover:text-secondary-glass bg-transparent border-0 cursor-pointer"
                  >
                    ✓
                  </button>
                )}
              </div>
            );
          })
        )}
      </GlassCard>
    </div>
  );
}
