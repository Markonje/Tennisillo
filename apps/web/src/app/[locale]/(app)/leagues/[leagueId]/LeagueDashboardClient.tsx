'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard, Button, Avatar } from '@tennisillo/ui';
import type { LeagueContextValue } from '@/lib/league-context';

interface Member {
  id: string;
  role: string;
  isActive: boolean;
  user: {
    id: string;
    displayName: string;
    globalLevel: string;
  };
}

interface Props {
  league: LeagueContextValue;
  topMembers: Member[];
  locale: string;
  inviteCodeLabel: string;
  copyLabel: string;
  membersLabel: string;
}

function nameToHue(name: string): number {
  return Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
}

export function LeagueDashboardClient({
  league,
  topMembers,
  locale,
  inviteCodeLabel,
  copyLabel,
  membersLabel,
}: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (!league.inviteCode) return;
    void navigator.clipboard.writeText(league.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {league.inviteCode && (
        <GlassCard className="p-5">
          <p className="text-[11px] font-medium text-tertiary-glass uppercase tracking-wider mb-2.5">
            {inviteCodeLabel}
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 bg-success/10 border border-success/20 rounded-input px-3.5 py-2 font-mono text-base font-bold text-accent-light tracking-widest">
              {league.inviteCode}
            </code>
            <Button
              variant={copied ? 'ghost' : 'secondary'}
              size="sm"
              onClick={handleCopy}
              className={copied ? 'text-accent-light' : ''}
            >
              {copied ? '✓ Copiato' : copyLabel}
            </Button>
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-5">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-bold text-secondary-glass m-0">{membersLabel}</p>
          <Link
            href={`/${locale}/leagues/${league.id}/members`}
            className="text-xs text-accent-light no-underline font-semibold hover:underline"
          >
            Vedi tutti →
          </Link>
        </div>
        <div className="flex flex-col gap-2.5">
          {topMembers.map((m) => (
            <div key={m.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar
                  initials={m.user.displayName.charAt(0)}
                  hue={nameToHue(m.user.displayName)}
                  size={32}
                />
                <div>
                  <p className="m-0 text-sm text-secondary-glass font-semibold">
                    {m.user.displayName}
                  </p>
                  <p className="m-0 text-[11px] text-tertiary-glass">{m.role}</p>
                </div>
              </div>
              <span className="text-[11px] text-tertiary-glass font-medium">
                {m.user.globalLevel}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
