'use client';

import { useState } from 'react';
import { GlassCard, GlassInput, Textarea, Button, Banner, Modal } from '@tennisillo/ui';
import { toast } from '@/lib/toast';
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
  regenerateCode: string;
  confirmRegenerate: string;
  confirm: string;
  cancel: string;
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
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  async function handleRegenerateCode() {
    setConfirmOpen(false);
    try {
      const res = await apiClient.post<{ inviteCode: string }>(`/leagues/${league.id}/invite`, {});
      setInviteCode(res.inviteCode ?? '');
      toast.success('Nuovo codice generato');
    } catch {
      toast.error('Impossibile rigenerare il codice');
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
    <>
      <div className="flex flex-col gap-5 max-w-lg">
        <GlassCard className="p-6">
          <form onSubmit={(e) => { void handleSave(e); }} className="flex flex-col gap-4">
            <GlassInput
              label={labels.name}
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              maxLength={80}
              required
            />
            <Textarea
              label={labels.description}
              value={form.description}
              onChange={(v) => setForm({ ...form, description: v })}
              maxLength={500}
              rows={3}
            />
            {saveError && <Banner tone="danger">{saveError}</Banner>}
            {saved && <Banner tone="success">Salvato!</Banner>}
            <Button type="submit" className="w-full">{labels.save}</Button>
          </form>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-[11px] font-medium text-tertiary-glass uppercase tracking-wider mb-3">
            Codice invito
          </p>
          <div className="flex gap-2.5 items-center">
            {inviteCode && (
              <code className="flex-1 bg-success/10 border border-success/20 rounded-input px-3.5 py-2 font-mono text-base font-bold text-accent-light tracking-widest truncate">
                {inviteCode}
              </code>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmOpen(true)}
            >
              {labels.regenerateCode}
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <p className="text-[11px] font-medium text-tertiary-glass uppercase tracking-wider mb-3.5">
            {labels.pendingTitle}
          </p>
          {pending.length === 0 ? (
            <p className="text-tertiary-glass text-sm">{labels.noPending}</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {pending.map((m) => (
                <div key={m.id} className="flex justify-between items-center">
                  <span className="text-secondary-glass text-sm">{m.user.displayName}</span>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => { void handleApprove(m.id); }}
                  >
                    {labels.approve}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {confirmOpen && <Modal
        onClose={() => setConfirmOpen(false)}
        title="Rigenera codice invito"
      >
        <p className="text-sm text-secondary-glass mb-6">{labels.confirmRegenerate}</p>
        <div className="flex gap-2.5 justify-end">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
            {labels.cancel}
          </Button>
          <Button variant="danger" onClick={() => { void handleRegenerateCode(); }}>
            {labels.confirm}
          </Button>
        </div>
      </Modal>}
    </>
  );
}
