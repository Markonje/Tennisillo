import type { ReactNode } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { Sidebar } from '@/components/Sidebar';
import { MobileNav } from '@/components/MobileNav';
import { PageWrapper } from '@/components/PageWrapper';

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const t = await getTranslations('nav');
  const locale = await getLocale();

  const labels = {
    leagues:      t('leagues'),
    profile:      t('profile'),
    members:      t('members'),
    seasons:      t('seasons'),
    settings:     t('settings'),
    back:         t('back'),
    dashboard:    t('dashboard'),
    availability: t('availability'),
    frequency:    t('frequency'),
    venues:       t('venues'),
  };

  return (
    <div className="flex min-h-screen p-3.5 gap-3.5">
      <Sidebar locale={locale} labels={labels} />

      <main className="flex-1 min-w-0 overflow-y-auto pb-20 md:pb-6">
        <PageWrapper>{children}</PageWrapper>
      </main>

      <MobileNav locale={locale} labels={labels} />
    </div>
  );
}
