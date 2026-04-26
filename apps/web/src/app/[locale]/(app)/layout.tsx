import type { ReactNode } from 'react';
import { getTranslations, getLocale } from 'next-intl/server';

interface AppLayoutProps {
  children: ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const t = await getTranslations('nav');
  const locale = await getLocale();

  const navItems = [
    { href: `/${locale}/dashboard`, label: '🏠 Dashboard' },
    { href: `/${locale}/leagues`, label: `🏆 ${t('leagues')}` },
    { href: `/${locale}/ranking`, label: `📊 ${t('ranking')}` },
    { href: `/${locale}/profile`, label: `👤 ${t('profile')}` },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1530 100%)' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 0',
        }}
      >
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#b0ef60', letterSpacing: '-0.02em' }}>
            Tennisillo
          </span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '16px 10px', flex: 1 }}>
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                display: 'block',
                padding: '10px 14px',
                borderRadius: 10,
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.15s',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
