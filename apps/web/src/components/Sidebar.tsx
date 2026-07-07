'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { apiClient } from '@/lib/api-client';
import { cn, LogoMark } from '@tennisillo/ui';

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
    availability: string;
    frequency: string;
    venues: string;
    training: string;
    notifications: string;
    admin: string;
  };
}

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-[13.5px] font-medium transition-all duration-150 no-underline',
        active
          ? 'bg-accent/[0.18] border border-accent/35 text-accent-light font-bold'
          : 'text-secondary-glass hover:bg-white/[0.07] hover:text-primary-glass',
      )}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </Link>
  );
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

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col w-[230px] shrink-0',
        'sticky top-3.5 h-[calc(100vh-28px)] overflow-y-auto',
        'rounded-[22px] border border-glass bg-glass-card backdrop-glass shadow-glass',
        'p-[18px_12px]',
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 px-2 pb-5 mb-2 border-b border-glass">
        <LogoMark size={22} />
        <span className="text-lg font-black text-accent tracking-tight">Tennisillo</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1 py-2">
        {isLeagueScope ? (
          <>
            {/* Back to leagues */}
            <Link
              href={`/${locale}/leagues`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] text-[12px] font-medium text-tertiary-glass hover:text-secondary-glass transition-colors mb-1"
            >
              ← {labels.back}
            </Link>

            {/* League name */}
            {league && (
              <div className="px-3.5 py-1.5 mb-1 text-[13px] font-bold text-primary-glass truncate border-b border-glass pb-3 mb-2">
                {league.name}
              </div>
            )}

            <NavItem
              href={`/${locale}/leagues/${leagueId}`}
              icon="⊞"
              label={labels.dashboard}
              active={isActive(`/${locale}/leagues/${leagueId}`, true)}
            />
            <NavItem
              href={`/${locale}/leagues/${leagueId}/seasons`}
              icon="🏆"
              label={labels.seasons}
              active={isActive(`/${locale}/leagues/${leagueId}/seasons`)}
            />
            <NavItem
              href={`/${locale}/leagues/${leagueId}/members`}
              icon="👥"
              label={labels.members}
              active={isActive(`/${locale}/leagues/${leagueId}/members`)}
            />
            <NavItem
              href={`/${locale}/leagues/${leagueId}/availability`}
              icon="📅"
              label={labels.availability}
              active={isActive(`/${locale}/leagues/${leagueId}/availability`)}
            />
            <NavItem
              href={`/${locale}/leagues/${leagueId}/frequency`}
              icon="🚦"
              label={labels.frequency}
              active={isActive(`/${locale}/leagues/${leagueId}/frequency`)}
            />
            <NavItem
              href={`/${locale}/leagues/${leagueId}/venues`}
              icon="📍"
              label={labels.venues}
              active={isActive(`/${locale}/leagues/${leagueId}/venues`)}
            />
            <NavItem
              href={`/${locale}/leagues/${leagueId}/training`}
              icon="🏋️"
              label={labels.training}
              active={isActive(`/${locale}/leagues/${leagueId}/training`)}
            />
            <NavItem
              href={`/${locale}/leagues/${leagueId}/admin`}
              icon="🛡️"
              label={labels.admin}
              active={isActive(`/${locale}/leagues/${leagueId}/admin`)}
            />
            <NavItem
              href={`/${locale}/leagues/${leagueId}/settings`}
              icon="⚙️"
              label={labels.settings}
              active={isActive(`/${locale}/leagues/${leagueId}/settings`)}
            />
          </>
        ) : (
          <>
            <NavItem
              href={`/${locale}/leagues`}
              icon="🏆"
              label={labels.leagues}
              active={isActive(`/${locale}/leagues`)}
            />
            <NavItem
              href={`/${locale}/notifications`}
              icon="🔔"
              label={labels.notifications}
              active={isActive(`/${locale}/notifications`)}
            />
            <NavItem
              href={`/${locale}/profile`}
              icon="👤"
              label={labels.profile}
              active={isActive(`/${locale}/profile`)}
            />
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="pt-3 border-t border-glass">
        <button
          type="button"
          onClick={() => { void handleLogout(); }}
          className={cn(
            'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-[13.5px] font-medium',
            'bg-danger/10 border border-danger/20 text-danger-light',
            'hover:bg-danger/20 transition-colors',
          )}
        >
          <span>🚪</span>
          Logout
        </button>
      </div>
    </aside>
  );
}
