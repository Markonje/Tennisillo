'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Badge,
  Banner,
  Button,
  EmptyState,
  GlassCard,
  GlassInput,
  GlassSelect,
  KpiCard,
  cn,
} from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

interface UserRef {
  id: string;
  displayName: string;
  username: string;
}

export interface TrainingSessionDto {
  id: string;
  type: 'SPARRING' | 'MASTER_LESSON';
  status: 'PENDING_VALIDATION' | 'VALIDATED' | 'REJECTED' | 'DISPUTED' | 'REVOKED';
  player1: UserRef;
  player2: UserRef | null;
  master: UserRef | null;
  scheduledAt: string | null;
  focusNote: string | null;
  pointsAwarded: number;
  xpAwarded: number;
  createdAt: string;
}

export interface MasterEntry {
  id: string; // LeagueMember.id
  user: { id: string; displayName: string; username: string };
}

export interface XpSummary {
  totalXp: number;
  globalLevel: string;
  validatedLessons: number;
}

interface MemberOption {
  memberId: string;
  userId: string;
  displayName: string;
}

interface Props {
  leagueId: string;
  meId: string;
  isAdmin: boolean;
  members: MemberOption[];
  masters: MasterEntry[];
  sessions: TrainingSessionDto[];
  xp: XpSummary | null;
}

const STATUS_TONE = {
  PENDING_VALIDATION: 'yellow',
  VALIDATED: 'green',
  REJECTED: 'gray',
  DISPUTED: 'red',
  REVOKED: 'red',
} as const;

export function TrainingClient({ leagueId, meId, isAdmin, members, masters, sessions, xp }: Props) {
  const router = useRouter();
  const t = useTranslations('training');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sparringPartner, setSparringPartner] = useState('');
  const [sparringDate, setSparringDate] = useState('');
  const [sparringNote, setSparringNote] = useState('');

  const [lessonMaster, setLessonMaster] = useState('');
  const [lessonDate, setLessonDate] = useState('');
  const [lessonDuration, setLessonDuration] = useState('');
  const [lessonNote, setLessonNote] = useState('');

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokeReason, setRevokeReason] = useState('');

  const [promoteUserId, setPromoteUserId] = useState('');
  const [promoteMode, setPromoteMode] = useState('HYBRID');

  const pendingForMe = sessions.filter(
    (s) =>
      s.status === 'PENDING_VALIDATION' &&
      ((s.type === 'SPARRING' && s.player2?.id === meId) ||
        (s.type === 'MASTER_LESSON' && s.master?.id === meId)),
  );

  const availableMasters = masters.filter((m) => m.user.id !== meId);

  async function run(fn: () => Promise<unknown>) {
    setLoading(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  function declareSparring() {
    return run(async () => {
      await apiClient.post(`/leagues/${leagueId}/sparring`, {
        player2MemberId: sparringPartner,
        ...(sparringDate && { scheduledAt: new Date(sparringDate).toISOString() }),
        ...(sparringNote && { focusNote: sparringNote }),
      });
      setSparringPartner('');
      setSparringDate('');
      setSparringNote('');
    });
  }

  function declareLesson() {
    return run(async () => {
      await apiClient.post(`/leagues/${leagueId}/master-lessons`, {
        masterId: lessonMaster,
        ...(lessonDate && { scheduledAt: new Date(lessonDate).toISOString() }),
        ...(lessonDuration && { durationMinutes: Number(lessonDuration) }),
        ...(lessonNote && { focusNote: lessonNote }),
      });
      setLessonMaster('');
      setLessonDate('');
      setLessonDuration('');
      setLessonNote('');
    });
  }

  function sessionLabel(s: TrainingSessionDto): string {
    if (s.type === 'SPARRING') {
      return t('sparringWith', {
        p1: s.player1.displayName,
        p2: s.player2?.displayName ?? '?',
      });
    }
    return t('lessonWith', {
      player: s.player1.displayName,
      master: s.master?.displayName ?? '?',
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {error && <Banner tone="danger">{error}</Banner>}

      {/* XP summary */}
      {xp && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5">
          <KpiCard icon="✨" label={t('totalXp')} value={xp.totalXp} />
          <KpiCard icon="🎓" label={t('validatedLessons')} value={xp.validatedLessons} />
          <KpiCard icon="🏅" label={t('globalLevel')} value={xp.globalLevel} />
        </div>
      )}

      {/* Pending actions (partner confirmations + master panel) */}
      {pendingForMe.length > 0 && (
        <GlassCard className="px-5 py-5">
          <h2 className="text-sm font-bold text-secondary-glass m-0 mb-4">
            {pendingForMe.some((s) => s.type === 'MASTER_LESSON')
              ? t('masterPanel')
              : t('pendingTitle')}
          </h2>
          <div className="flex flex-col gap-4">
            {pendingForMe.map((s) => (
              <div key={s.id} className="rounded-[12px] border border-glass px-4 py-3">
                <div className="text-sm font-semibold text-primary-glass">{sessionLabel(s)}</div>
                {s.focusNote && <div className="text-xs text-tertiary-glass">{s.focusNote}</div>}
                <div className="flex flex-wrap items-center gap-2.5 mt-2.5">
                  <Button
                    onClick={() => {
                      void run(() =>
                        apiClient.post(
                          s.type === 'SPARRING'
                            ? `/sparring/${s.id}/confirm`
                            : `/master-lessons/${s.id}/validate`,
                          {},
                        ),
                      );
                    }}
                    disabled={loading}
                  >
                    {s.type === 'SPARRING' ? t('confirm') : t('validate')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setRejectingId(rejectingId === s.id ? null : s.id)}
                    disabled={loading}
                  >
                    {t('reject')}
                  </Button>
                </div>
                {rejectingId === s.id && (
                  <div className="mt-3 flex flex-wrap items-end gap-2.5">
                    <GlassInput
                      label={t('rejectReason')}
                      value={rejectReason}
                      onChange={setRejectReason}
                      className="flex-1 min-w-[220px]"
                    />
                    <Button
                      variant="danger"
                      onClick={() => {
                        void run(async () => {
                          await apiClient.post(
                            s.type === 'SPARRING'
                              ? `/sparring/${s.id}/reject`
                              : `/master-lessons/${s.id}/reject`,
                            { reason: rejectReason },
                          );
                          setRejectingId(null);
                          setRejectReason('');
                        });
                      }}
                      disabled={loading || rejectReason.length < 5}
                    >
                      {t('reject')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Declare sparring */}
      <GlassCard className="px-5 py-5">
        <h2 className="text-sm font-bold text-secondary-glass m-0 mb-4">{t('declareSparring')}</h2>
        <div className="flex flex-wrap items-end gap-3">
          <GlassSelect
            label={t('partner')}
            value={sparringPartner}
            onChange={setSparringPartner}
            options={[
              { label: t('selectPartner'), value: '' },
              ...members.map((m) => ({ label: m.displayName, value: m.memberId })),
            ]}
            className="w-56"
          />
          <GlassInput
            label={t('date')}
            type="datetime-local"
            value={sparringDate}
            onChange={setSparringDate}
          />
          <GlassInput
            label={t('focusNote')}
            value={sparringNote}
            onChange={setSparringNote}
            className="w-56"
          />
          <Button
            onClick={() => {
              void declareSparring();
            }}
            disabled={loading || !sparringPartner}
            loading={loading}
          >
            {t('declare')}
          </Button>
        </div>
      </GlassCard>

      {/* Declare master lesson */}
      <GlassCard className="px-5 py-5">
        <h2 className="text-sm font-bold text-secondary-glass m-0 mb-4">{t('declareLesson')}</h2>
        {availableMasters.length === 0 ? (
          <p className="text-sm text-tertiary-glass m-0">{t('noMasters')}</p>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <GlassSelect
              label={t('master')}
              value={lessonMaster}
              onChange={setLessonMaster}
              options={[
                { label: t('selectMaster'), value: '' },
                ...availableMasters.map((m) => ({
                  label: m.user.displayName,
                  value: m.user.id,
                })),
              ]}
              className="w-56"
            />
            <GlassInput
              label={t('date')}
              type="datetime-local"
              value={lessonDate}
              onChange={setLessonDate}
            />
            <GlassInput
              label={t('duration')}
              type="number"
              min={15}
              max={480}
              value={lessonDuration}
              onChange={setLessonDuration}
              className="w-40"
            />
            <GlassInput
              label={t('focusNote')}
              value={lessonNote}
              onChange={setLessonNote}
              className="w-56"
            />
            <Button
              onClick={() => {
                void declareLesson();
              }}
              disabled={loading || !lessonMaster}
              loading={loading}
            >
              {t('declare')}
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Admin: masters management */}
      {isAdmin && (
        <GlassCard className="px-5 py-5">
          <h2 className="text-sm font-bold text-secondary-glass m-0 mb-4">
            {t('manageMasters')}
          </h2>
          {masters.length > 0 && (
            <div className="flex flex-col mb-4">
              {masters.map((m, i) => (
                <div
                  key={m.id}
                  className={cn(
                    'flex flex-wrap items-center gap-3 py-2.5',
                    i < masters.length - 1 && 'border-b border-glass',
                  )}
                >
                  <span className="text-sm text-secondary-glass flex-1">
                    🎓 {m.user.displayName}{' '}
                    <span className="text-xs text-tertiary-glass">@{m.user.username}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void run(() =>
                        apiClient.patch(`/leagues/${leagueId}/masters/${m.id}`, {
                          revoke: true,
                        }),
                      );
                    }}
                    className="text-xs text-danger-light hover:underline bg-transparent border-0 cursor-pointer"
                  >
                    {t('revokeMaster')}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <GlassSelect
              label={t('promoteMember')}
              value={promoteUserId}
              onChange={setPromoteUserId}
              options={[
                { label: t('selectPartner'), value: '' },
                ...members
                  .filter((m) => !masters.some((ma) => ma.user.id === m.userId))
                  .map((m) => ({ label: m.displayName, value: m.userId })),
              ]}
              className="w-56"
            />
            <GlassSelect
              label={t('masterMode')}
              value={promoteMode}
              onChange={setPromoteMode}
              options={[
                { label: t('modeHYBRID'), value: 'HYBRID' },
                { label: t('modePURE'), value: 'PURE' },
              ]}
              className="w-56"
            />
            <Button
              variant="secondary"
              onClick={() => {
                void run(async () => {
                  await apiClient.post(`/leagues/${leagueId}/masters`, {
                    userId: promoteUserId,
                    masterMode: promoteMode,
                  });
                  setPromoteUserId('');
                });
              }}
              disabled={loading || !promoteUserId}
            >
              {t('promote')}
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Sessions list */}
      <GlassCard className="px-5 py-5">
        <h2 className="text-sm font-bold text-secondary-glass m-0 mb-4">{t('sessionsTitle')}</h2>
        {sessions.length === 0 ? (
          <EmptyState icon="🏋️" title={t('empty')} />
        ) : (
          <div className="flex flex-col">
            {sessions.slice(0, 20).map((s, i) => (
              <div
                key={s.id}
                className={cn(
                  'py-3',
                  i < Math.min(sessions.length, 20) - 1 && 'border-b border-glass',
                )}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone={s.type === 'SPARRING' ? 'blue' : 'green'}>
                    {t(`type.${s.type}`)}
                  </Badge>
                  <span className="text-sm text-secondary-glass flex-1 min-w-[180px]">
                    {sessionLabel(s)}
                  </span>
                  {s.status === 'VALIDATED' && s.type === 'SPARRING' && (
                    <span className="text-xs font-bold text-accent-light">
                      {t('points', { points: s.pointsAwarded })}
                    </span>
                  )}
                  {s.status === 'VALIDATED' && s.type === 'MASTER_LESSON' && (
                    <span className="text-xs font-bold text-accent-light">
                      {t('xp', { xp: s.xpAwarded })}
                    </span>
                  )}
                  <Badge tone={STATUS_TONE[s.status]} dot>
                    {t(`status.${s.status}`)}
                  </Badge>
                  {isAdmin && s.status === 'VALIDATED' && (
                    <button
                      type="button"
                      onClick={() => setRevokingId(revokingId === s.id ? null : s.id)}
                      className="text-xs text-danger-light hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      {t('revoke')}
                    </button>
                  )}
                </div>
                {revokingId === s.id && (
                  <div className="mt-3 flex flex-wrap items-end gap-2.5">
                    <GlassInput
                      label={t('revokeReason')}
                      value={revokeReason}
                      onChange={setRevokeReason}
                      className="flex-1 min-w-[220px]"
                    />
                    <Button
                      variant="danger"
                      onClick={() => {
                        void run(async () => {
                          await apiClient.post(`/admin/training-sessions/${s.id}/revoke`, {
                            reason: revokeReason,
                          });
                          setRevokingId(null);
                          setRevokeReason('');
                        });
                      }}
                      disabled={loading || revokeReason.length < 10}
                    >
                      {t('revoke')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
