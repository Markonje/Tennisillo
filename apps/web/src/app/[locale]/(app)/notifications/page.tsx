import { getLocale, getTranslations } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import { NotificationsClient, type NotificationDto } from './NotificationsClient';

export default async function NotificationsPage() {
  const locale = await getLocale();
  const t = await getTranslations('notifications');

  const notifications = await apiServer.get<NotificationDto[]>('/users/me/notifications');

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass m-0 mb-6">{t('title')}</h1>
      <NotificationsClient locale={locale} notifications={notifications ?? []} />
    </div>
  );
}
