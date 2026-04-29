'use client';

import { useState } from 'react';
import { GlassCard } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';
import type { LeagueContextValue } from '@/lib/league-context';

interface PendingMember {
  id: string;
  role: string;
  isActive: boolean;
  user: { id: string; displayName: string; globalLevel: string };
}

interface Labels {
  name: string;
  description: string;
  save: string;
  generateCode: string;
  pendingTitle: string;
  approve: string;
  noPending: string;
}

interface Props {
  league: LeagueContextValue;
  pendingMembers: PendingMember[];
  labels: Labels;
}

export function LeagueSettingsClient({ league, pendingMembers, labels }: Props) {
  const [form, setForm] = useState({
    name: league.name,
    description: league.description ?? '',
  });
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState(league.inviteCode ?? '');
  const [pending, setPending] = useState(pendingMembers);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    try {
      await apiClient.put(`/leagues/${league.id}/settings`, {
        name: form.name,
        description: form.description,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setSaveError('Impossibile salvare le impostazioni.');
    }
  }

  async function handleGenerateCode() {
    try {
      const res = await apiClient.post<{ inviteCode: string }>(`/leagues/${league.id}/invite`, {});
      setInviteCode(res.inviteCode ?? '');
    } catch {
      // silent — keep existing code
    }
  }

  async function handleApprove(memberId: string) {
    try {
      await apiClient.post(`/leagues/${league.id}/approve/${memberId}`, {});
      setPending((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      // silent
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 540 }}>
      {/* Name + description */}
      <GlassCard style={{ padding: 24 }}>
        <form onSubmit={(e) => { void handleSave(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={labelStyle}>
            {labels.name}
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={80}
              required
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            {labels.description}
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            />
          </label>
          {saveError && <p style={{ color: '#f09090', fontSize: 13, margin: 0 }}>{saveError}</p>}
          {saved && <p style={{ color: '#b0ef60', fontSize: 13, margin: 0 }}>Salvato!</p>}
          <button type="submit" style={btnStyle}>{labels.save}</button>
        </form>
      </GlassCard>

      {/* Invite code */}
      <GlassCard style={{ padding: 24 }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
          Codice invito
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {inviteCode && (
            <code style={codeStyle}>{inviteCode}</code>
          )}
          <button onClick={() => { void handleGenerateCode(); }} style={{ ...btnStyle, flex: 'none' }}>
            {labels.generateCode}
          </button>
        </div>
      </GlassCard>

      {/* Pending members */}
      <GlassCard style={{ padding: 24 }}>
        <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
          {labels.pendingTitle}
        </p>
        {pending.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{labels.noPending}</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {pending.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>{m.user.displayName}</span>
                <button
                  onClick={() => { void handleApprove(m.id); }}
                  style={{ ...btnStyle, padding: '7px 14px', fontSize: 12 }}
                >
                  {labels.approve}
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 13,
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 14px',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 14,
  outline: 'none',
};

const btnStyle: React.CSSProperties = {
  background: '#b0ef60',
  color: '#0a0e1a',
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
};

const codeStyle: React.CSSProperties = {
  background: 'rgba(176,239,96,0.08)',
  border: '1px solid rgba(176,239,96,0.2)',
  borderRadius: 8,
  padding: '8px 14px',
  fontFamily: 'monospace',
  fontSize: 16,
  fontWeight: 700,
  color: '#b0ef60',
  letterSpacing: '0.08em',
};
