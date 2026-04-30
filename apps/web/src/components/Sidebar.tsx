'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface LeagueInfo {
  name: string;
}

interface SidebarProps {
  locale: string;
  labels: {
    leagues: string;
    profile: string;
    members: string;
    seasons: string;
    settings: string;
    back: string;
    dashboard: string;
  };
}

export function Sidebar({ locale, labels }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const leagueMatch = pathname.match(/\/leagues\/([^/]+)/);
  const leagueId = leagueMatch?.[1];
  const isLeagueScope = !!leagueId && leagueId !== 'new';

  const [league, setLeague] = useState<LeagueInfo | null>(null);

  useEffect(() => {
    if (!isLeagueScope || !leagueId) {
      setLeague(null);
      return;
    }
    apiClient
      .get<LeagueInfo>(`/leagues/${leagueId}`)
      .then((data) => setLeague(data))
      .catch(() => setLeague(null));
  }, [leagueId, isLeagueScope]);

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    );
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
  }

  function navLinkStyle(href: string, exact = false): React.CSSProperties {
    const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
    return {
      display: 'block',
      padding: '10px 14px',
      borderRadius: 10,
      color: active ? '#b0ef60' : 'rgba(255,255,255,0.7)',
      background: active ? 'rgba(176,239,96,0.08)' : 'transparent',
      textDecoration: 'none',
      fontSize: 14,
      fontWeight: 500,
      transition: 'all 0.15s',
    };
  }

  return (
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
        {isLeagueScope ? (
          <>
            <Link
              href={`/${locale}/leagues`}
              style={{
                display: 'block',
                padding: '8px 14px',
                borderRadius: 10,
                color: 'rgba(255,255,255,0.45)',
                textDecoration: 'none',
                fontSize: 12,
                fontWeight: 500,
                marginBottom: 4,
              }}
            >
              {labels.back}
            </Link>
            {league && (
              <div
                style={{
                  padding: '4px 14px 12px',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.9)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  marginBottom: 8,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {league.name}
              </div>
            )}
            <Link
              href={`/${locale}/leagues/${leagueId}`}
              style={navLinkStyle(`/${locale}/leagues/${leagueId}`, true)}
            >
              🏠 {labels.dashboard}
            </Link>
            <Link
              href={`/${locale}/leagues/${leagueId}/seasons`}
              style={navLinkStyle(`/${locale}/leagues/${leagueId}/seasons`)}
            >
              🏆 {labels.seasons}
            </Link>
            <Link
              href={`/${locale}/leagues/${leagueId}/members`}
              style={navLinkStyle(`/${locale}/leagues/${leagueId}/members`)}
            >
              👥 {labels.members}
            </Link>
            <Link
              href={`/${locale}/leagues/${leagueId}/settings`}
              style={navLinkStyle(`/${locale}/leagues/${leagueId}/settings`)}
            >
              ⚙️ {labels.settings}
            </Link>
          </>
        ) : (
          <>
            <Link href={`/${locale}/leagues`} style={navLinkStyle(`/${locale}/leagues`)}>
              🏆 {labels.leagues}
            </Link>
            <Link href={`/${locale}/profile`} style={navLinkStyle(`/${locale}/profile`)}>
              👤 {labels.profile}
            </Link>
          </>
        )}
      </nav>

      <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => {
            void handleLogout();
          }}
          style={{
            width: '100%',
            display: 'block',
            padding: '10px 14px',
            borderRadius: 10,
            background: 'rgba(240,144,144,0.1)',
            color: '#f09090',
            border: '1px solid rgba(240,144,144,0.15)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s',
            textAlign: 'left',
          }}
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
