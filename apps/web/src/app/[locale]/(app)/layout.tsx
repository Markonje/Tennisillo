import type { ReactNode } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';
import { Sidebar } from '@/components/Sidebar';

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const t = await getTranslations('nav');
  const locale = await getLocale();

  const labels = {
    leagues: t('leagues'),
    profile: t('profile'),
    members: t('members'),
    settings: t('settings'),
    back: t('back'),
    dashboard: t('dashboard'),
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1530 100%)',
      }}
    >
      <Sidebar locale={locale} labels={labels} />

      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
