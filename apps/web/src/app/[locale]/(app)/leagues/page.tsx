import { getTranslations, getLocale } from 'next-intl/server';
import { GlassCard, Avatar, EmptyState } from '@tennisillo/ui';
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

function nameToHue(name: string): number {
  return Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
}

export default async function LeaguesPage() {
  const t = await getTranslations('leagues');
  const locale = await getLocale();

  const leagues = await apiServer.get<League[]>('/leagues/me');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-primary-glass m-0">{t('title')}</h1>
        <Link
          href={`/${locale}/leagues/new`}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-btn bg-gradient-to-br from-accent-light to-accent-dark text-[#0a1a0e] text-sm font-bold shadow-accent-glow hover:shadow-accent-glow-lg hover:-translate-y-px transition-all duration-150 no-underline"
        >
          {t('create')}
        </Link>
      </div>

      <JoinByCodeForm locale={locale} joinLabel={t('join')} placeholder={t('joinWithCode')} />

      {!leagues || leagues.length === 0 ? (
        <EmptyState icon="🎾" title={t('empty')} />
      ) : (
        <div className="flex flex-col gap-3">
          {leagues.map((league) => (
            <Link
              key={league.id}
              href={`/${locale}/leagues/${league.id}`}
              className="no-underline"
            >
              <GlassCard interactive className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      initials={league.name.charAt(0)}
                      hue={nameToHue(league.name)}
                      size={44}
                    />
                    <div>
                      <p className="font-bold text-primary-glass m-0 text-base">{league.name}</p>
                      <p className="text-xs text-tertiary-glass m-0 mt-1">
                        {league.sport} · {league.type} · {league._count?.members ?? 0} {t('members')}
                      </p>
                    </div>
                  </div>
                  <span className="text-accent-light text-xl">→</span>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
