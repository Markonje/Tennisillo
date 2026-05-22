'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@tennisillo/ui';

interface MobileNavProps {
  locale: string;
  labels: {
    leagues: string;
    profile: string;
    members: string;
    seasons: string;
    settings: string;
    dashboard: string;
  };
}

interface MobileNavItemProps {
  href: string;
  icon: string;
  label: string;
  active: boolean;
}

function MobileNavItem({ href, icon, label, active }: MobileNavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-col items-center gap-0.5 px-3 py-2 rounded-[10px] text-[10px] font-semibold transition-all duration-150 no-underline flex-1',
        active
          ? 'text-accent-light'
          : 'text-tertiary-glass hover:text-secondary-glass',
      )}
    >
      <span className={cn('text-xl leading-none', active && 'drop-shadow-[0_0_6px_rgba(185,255,90,0.6)]')}>
        {icon}
      </span>
      <span className="leading-tight">{label}</span>
    </Link>
  );
}

export function MobileNav({ locale, labels }: MobileNavProps) {
  const pathname = usePathname();

  const leagueMatch = pathname.match(/\/leagues\/([^/]+)/);
  const leagueId = leagueMatch?.[1];
  const isLeagueScope = !!leagueId && leagueId !== 'new';

  function isActive(href: string, exact = false) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <nav
      className={cn(
        'md:hidden fixed bottom-0 left-0 right-0 z-50',
        'border-t border-glass bg-glass-card backdrop-glass',
        'flex items-center px-2 py-1 pb-safe',
      )}
    >
      {isLeagueScope ? (
        <>
          <MobileNavItem
            href={`/${locale}/leagues/${leagueId}`}
            icon="⊞"
            label={labels.dashboard}
            active={isActive(`/${locale}/leagues/${leagueId}`, true)}
          />
          <MobileNavItem
            href={`/${locale}/leagues/${leagueId}/seasons`}
            icon="🏆"
            label={labels.seasons}
            active={isActive(`/${locale}/leagues/${leagueId}/seasons`)}
          />
          <MobileNavItem
            href={`/${locale}/leagues/${leagueId}/members`}
            icon="👥"
            label={labels.members}
            active={isActive(`/${locale}/leagues/${leagueId}/members`)}
          />
          <MobileNavItem
            href={`/${locale}/leagues/${leagueId}/settings`}
            icon="⚙️"
            label={labels.settings}
            active={isActive(`/${locale}/leagues/${leagueId}/settings`)}
          />
        </>
      ) : (
        <>
          <MobileNavItem
            href={`/${locale}/leagues`}
            icon="🏆"
            label={labels.leagues}
            active={isActive(`/${locale}/leagues`)}
          />
          <MobileNavItem
            href={`/${locale}/profile`}
            icon="👤"
            label={labels.profile}
            active={isActive(`/${locale}/profile`)}
          />
        </>
      )}
    </nav>
  );
}
