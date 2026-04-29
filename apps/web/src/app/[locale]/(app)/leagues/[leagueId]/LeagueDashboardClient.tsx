'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@tennisillo/ui';
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
  createSeasonLabel: string;
  comingSoonLabel: string;
}

export function LeagueDashboardClient({
  league,
  topMembers,
  locale,
  inviteCodeLabel,
  copyLabel,
  membersLabel,
  createSeasonLabel,
  comingSoonLabel,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Invite code */}
      {league.inviteCode && (
        <GlassCard style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {inviteCodeLabel}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <code
              style={{
                background: 'rgba(176,239,96,0.08)',
                border: '1px solid rgba(176,239,96,0.2)',
                borderRadius: 8,
                padding: '8px 14px',
                fontFamily: 'monospace',
                fontSize: 16,
                fontWeight: 700,
                color: '#b0ef60',
                letterSpacing: '0.08em',
                flex: 1,
              }}
            >
              {league.inviteCode}
            </code>
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'rgba(176,239,96,0.15)' : 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 8,
                padding: '8px 14px',
                color: copied ? '#b0ef60' : 'rgba(255,255,255,0.7)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {copied ? '✓ Copiato' : copyLabel}
            </button>
          </div>
        </GlassCard>
      )}

      {/* Members preview */}
      <GlassCard style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.8)', margin: 0 }}>
            {membersLabel}
          </p>
          <Link
            href={`/${locale}/leagues/${league.id}/members`}
            style={{ fontSize: 12, color: '#b0ef60', textDecoration: 'none', fontWeight: 600 }}
          >
            Vedi tutti →
          </Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {topMembers.map((m) => (
            <div
              key={m.id}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(176,239,96,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#b0ef60',
                  }}
                >
                  {m.user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>
                    {m.user.displayName}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                    {m.role}
                  </p>
                </div>
              </div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                {m.user.globalLevel}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Create season CTA (disabled — Sprint 3) */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          disabled
          title={comingSoonLabel}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10,
            padding: '12px 22px',
            color: 'rgba(255,255,255,0.25)',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'not-allowed',
          }}
        >
          {createSeasonLabel} — {comingSoonLabel}
        </button>
      </div>
    </div>
  );
}
