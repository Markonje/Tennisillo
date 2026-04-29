import { getTranslations, getLocale } from 'next-intl/server';
import { GlassCard } from '@tennisillo/ui';
import Link from 'next/link';
import { apiServer } from '@/lib/api-server';
import { JoinByCodeForm } from './JoinByCodeForm';

interface League {
  id: string;
  name: string;
  sport: string;
  type: string;
  _count?: { members: number };
}

export default async function LeaguesPage() {
  const t = await getTranslations('leagues');
  const locale = await getLocale();

  const leagues = await apiServer.get<League[]>('/leagues/me');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
          {t('title')}
        </h1>
        <Link
          href={`/${locale}/leagues/new`}
          style={{
            background: '#b0ef60',
            color: '#0a0e1a',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {t('create')}
        </Link>
      </div>

      <JoinByCodeForm locale={locale} joinLabel={t('join')} placeholder={t('joinWithCode')} />

      {!leagues || leagues.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 20 }}>
            {t('empty')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/${locale}/leagues/${league.id}`}
              style={{ textDecoration: 'none' }}
            >
              <GlassCard style={{ padding: 16 }} hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(176,239,96,0.15)',
                        border: '1px solid rgba(176,239,96,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#b0ef60',
                        flexShrink: 0,
                      }}
                    >
                      {league.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: 15 }}>
                        {league.name}
                      </p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                        {league.sport} · {league.type} · {league._count?.members ?? 0} {t('members')}
                      </p>
                    </div>
                  </div>
                  <span style={{ color: '#b0ef60', fontSize: 20 }}>→</span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
