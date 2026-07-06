'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  GlassCard,
  GlassInput,
  GlassSelect,
  Textarea,
} from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';
import type { MatchDto, MatchStatusValue, SetScoreDto } from '@/lib/match-types';
import { formatSets } from '@/lib/match-types';

interface Props {
  match: MatchDto;
  meId: string;
  isAdmin: boolean;
  locale: string;
}

function statusTone(status: MatchStatusValue): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
  switch (status) {
    case 'VALIDATED':
      return 'green';
    case 'PENDING_VALIDATION':
      return 'yellow';
    case 'DISPUTED':
      return 'red';
    case 'SCHEDULED':
    case 'PENDING_RESULT':
      return 'blue';
    default:
      return 'gray';
  }
}

function nameToHue(name: string): number {
  return Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
}

interface SetInput {
  p1: string;
  p2: string;
}

export function MatchDetailClient({ match, meId, isAdmin, locale }: Props) {
  const router = useRouter();
  const t = useTranslations('matches');
  const tDispute = useTranslations('dispute');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [acceptDate, setAcceptDate] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [showReschedule, setShowReschedule] = useState(false);
  const [setInputs, setSetInputs] = useState<SetInput[]>([
    { p1: '', p2: '' },
    { p1: '', p2: '' },
  ]);
  const [showResultForm, setShowResultForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [resolveDecision, setResolveDecision] = useState('REJECTED');
  const [resolveResolution, setResolveResolution] = useState('');

  const isParticipant = match.player1.userId === meId || match.player2.userId === meId;
  const isChallenger = match.challengerId === meId;
  const isChallenged = isParticipant && !isChallenger;
  const isSubmitter = match.result?.submittedById === meId;

  const playerName = (seasonPlayerId: string): string =>
    seasonPlayerId === match.player1.id ? match.player1.displayName : match.player2.displayName;

  const userName = (userId: string): string => {
    if (userId === match.player1.userId) return match.player1.displayName;
    if (userId === match.player2.userId) return match.player2.displayName;
    return 'Admin';
  };

  async function action(fn: () => Promise<unknown>) {
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

  function accept() {
    const body: Record<string, string> = {};
    if (acceptDate) body['scheduledAt'] = new Date(acceptDate).toISOString();
    return action(() => apiClient.post(`/matches/${match.id}/accept`, body));
  }

  function submitResult() {
    const sets: SetScoreDto[] = setInputs
      .filter((s) => s.p1 !== '' && s.p2 !== '')
      .map((s) => ({ p1: Number(s.p1), p2: Number(s.p2) }));
    return action(async () => {
      await apiClient.post(`/matches/${match.id}/result`, { sets });
      setShowResultForm(false);
    });
  }

  const needsAcceptDate = !match.scheduledAt;

  return (
    <div className="flex flex-col gap-5">
      {/* Header card: players + status */}
      <GlassCard className="px-5 py-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <Avatar
              initials={match.player1.displayName[0] ?? '?'}
              hue={nameToHue(match.player1.displayName)}
              size={44}
            />
            <div>
              <div className="text-sm font-bold text-primary-glass">
                {match.player1.displayName}
              </div>
              <div className="text-xs text-tertiary-glass">@{match.player1.username}</div>
            </div>
          </div>
          <span className="text-xs text-muted-glass font-bold">{t('vs')}</span>
          <div className="flex items-center gap-3">
            <Avatar
              initials={match.player2.displayName[0] ?? '?'}
              hue={nameToHue(match.player2.displayName)}
              size={44}
            />
            <div>
              <div className="text-sm font-bold text-primary-glass">
                {match.player2.displayName}
              </div>
              <div className="text-xs text-tertiary-glass">@{match.player2.username}</div>
            </div>
          </div>
          <div className="ml-auto">
            <Badge tone={statusTone(match.status)} dot>
              {t(`status.${match.status}`)}
            </Badge>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 pt-4 border-t border-glass text-xs text-tertiary-glass">
          <span>
            {t('scheduledAt')}:{' '}
            {match.scheduledAt
              ? new Date(match.scheduledAt).toLocaleString(locale, {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })
              : t('noDate')}
          </span>
          <span>
            {t('format')}: {t(`formats.${match.format}`)}
          </span>
          {match.venueTextFallback && (
            <span>
              {t('venue')}: {match.venueTextFallback}
            </span>
          )}
        </div>
      </GlassCard>

      {error && <Banner tone="danger">{error}</Banner>}

      {/* Result card */}
      {match.result && (
        <GlassCard className="px-5 py-5">
          <h2 className="text-sm font-bold text-secondary-glass m-0 mb-2">{t('score')}</h2>
          <div className="text-2xl font-extrabold text-primary-glass mb-1">
            {formatSets(match.result.sets)}
          </div>
          <div className="text-sm text-secondary-glass mb-2">
            {t('winner')}: <strong>{playerName(match.result.winnerId)}</strong>
          </div>
          <div className="text-xs text-tertiary-glass">
            {t('resultSubmittedBy', { name: userName(match.result.submittedById) })}
          </div>
          {!match.result.plausibilityPassed && match.result.plausibilityNotes && (
            <Banner tone="warning" className="mt-3">
              {t('flaggedResult', { notes: match.result.plausibilityNotes })}
            </Banner>
          )}
          {match.validation && (
            <div className="text-xs text-tertiary-glass mt-2">
              {match.validation.autoValidated
                ? t('autoValidated')
                : t('validatedBy', { name: userName(match.validation.validatedById) })}
            </div>
          )}
        </GlassCard>
      )}

      {/* Dispute card */}
      {match.dispute && (
        <GlassCard className="px-5 py-5">
          <h2 className="text-sm font-bold text-secondary-glass m-0 mb-2">{tDispute('title')}</h2>
          <div className="text-sm text-secondary-glass mb-1">
            {tDispute('openedBy', { name: userName(match.dispute.openedById) })}
          </div>
          {match.dispute.status === 'OPEN' && (
            <p className="text-xs text-tertiary-glass m-0">{tDispute('pendingAdmin')}</p>
          )}
          {match.dispute.resolution && (
            <Banner tone="info" className="mt-3">
              {match.dispute.status === 'RESOLVED'
                ? tDispute('resolvedUpheld')
                : tDispute('resolvedRejected')}{' '}
              — {match.dispute.resolution}
            </Banner>
          )}
        </GlassCard>
      )}

      {/* Actions */}
      {match.status === 'PENDING_ACCEPTANCE' && isParticipant && (
        <GlassCard className="px-5 py-5">
          {isChallenged ? (
            <div className="flex flex-col gap-3">
              {needsAcceptDate && (
                <GlassInput
                  label={t('acceptDateRequired')}
                  type="datetime-local"
                  value={acceptDate}
                  onChange={setAcceptDate}
                />
              )}
              <div className="flex flex-wrap gap-2.5">
                <Button
                  onClick={() => {
                    void accept();
                  }}
                  disabled={loading || (needsAcceptDate && !acceptDate)}
                  loading={loading}
                >
                  {t('actions.accept')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => {
                    void action(() => apiClient.post(`/matches/${match.id}/decline`, {}));
                  }}
                  disabled={loading}
                >
                  {t('actions.decline')}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              onClick={() => {
                void action(() => apiClient.post(`/matches/${match.id}/cancel`, {}));
              }}
              disabled={loading}
            >
              {t('actions.withdraw')}
            </Button>
          )}
        </GlassCard>
      )}

      {(match.status === 'SCHEDULED' || match.status === 'PENDING_RESULT') && isParticipant && (
        <GlassCard className="px-5 py-5">
          <div className="flex flex-col gap-3">
            {!showResultForm ? (
              <div className="flex flex-wrap gap-2.5">
                <Button onClick={() => setShowResultForm(true)} disabled={loading}>
                  {t('actions.submitResult')}
                </Button>
                {match.status === 'SCHEDULED' && (
                  <>
                    <Button
                      variant="secondary"
                      onClick={() => setShowReschedule((v) => !v)}
                      disabled={loading}
                    >
                      {t('actions.reschedule')}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        void action(() => apiClient.post(`/matches/${match.id}/cancel`, {}));
                      }}
                      disabled={loading}
                    >
                      {t('actions.cancel')}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {setInputs.map((s, i) => (
                  <div key={i} className="flex items-end gap-2.5">
                    <span className="text-xs text-tertiary-glass w-12 pb-2.5">
                      {t('set', { n: i + 1 })}
                    </span>
                    <GlassInput
                      type="number"
                      min={0}
                      max={30}
                      aria-label={`${t('set', { n: i + 1 })} ${match.player1.displayName}`}
                      value={s.p1}
                      onChange={(v) =>
                        setSetInputs((prev) =>
                          prev.map((row, j) => (j === i ? { ...row, p1: v } : row)),
                        )
                      }
                      className="w-20"
                    />
                    <GlassInput
                      type="number"
                      min={0}
                      max={30}
                      aria-label={`${t('set', { n: i + 1 })} ${match.player2.displayName}`}
                      value={s.p2}
                      onChange={(v) =>
                        setSetInputs((prev) =>
                          prev.map((row, j) => (j === i ? { ...row, p2: v } : row)),
                        )
                      }
                      className="w-20"
                    />
                  </div>
                ))}
                <div className="flex flex-wrap gap-2.5">
                  {setInputs.length < 5 && (
                    <Button
                      variant="ghost"
                      onClick={() => setSetInputs((prev) => [...prev, { p1: '', p2: '' }])}
                    >
                      {t('addSet')}
                    </Button>
                  )}
                  {setInputs.length > 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => setSetInputs((prev) => prev.slice(0, -1))}
                    >
                      {t('removeSet')}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <Button
                    onClick={() => {
                      void submitResult();
                    }}
                    disabled={loading}
                    loading={loading}
                  >
                    {t('actions.submitResult')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => setShowResultForm(false)}
                    disabled={loading}
                  >
                    ✕
                  </Button>
                </div>
              </div>
            )}

            {showReschedule && match.status === 'SCHEDULED' && (
              <div className="flex flex-wrap items-end gap-2.5">
                <GlassInput
                  type="datetime-local"
                  label={t('actions.reschedule')}
                  value={rescheduleDate}
                  onChange={setRescheduleDate}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    void action(() =>
                      apiClient.post(`/matches/${match.id}/reschedule`, {
                        scheduledAt: new Date(rescheduleDate).toISOString(),
                      }),
                    );
                  }}
                  disabled={loading || !rescheduleDate}
                >
                  {t('actions.reschedule')}
                </Button>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {match.status === 'PENDING_VALIDATION' && isParticipant && (
        <GlassCard className="px-5 py-5">
          {isSubmitter ? (
            <div>
              <p className="text-sm text-tertiary-glass m-0">{t('waitingOpponentConfirm')}</p>
              {match.resultWindowExpiresAt && (
                <p className="text-xs text-muted-glass mt-1 mb-0">
                  {t('autoConfirmNotice', {
                    date: new Date(match.resultWindowExpiresAt).toLocaleString(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }),
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {match.resultWindowExpiresAt && (
                <p className="text-xs text-muted-glass m-0">
                  {t('autoConfirmNotice', {
                    date: new Date(match.resultWindowExpiresAt).toLocaleString(locale, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }),
                  })}
                </p>
              )}
              <div className="flex flex-wrap gap-2.5">
                <Button
                  onClick={() => {
                    void action(() => apiClient.post(`/matches/${match.id}/confirm`, {}));
                  }}
                  disabled={loading}
                  loading={loading}
                >
                  {t('actions.confirmResult')}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setShowDisputeForm((v) => !v)}
                  disabled={loading}
                >
                  {t('actions.contestResult')}
                </Button>
              </div>
              {showDisputeForm && (
                <div className="flex flex-col gap-3">
                  <Textarea
                    label={tDispute('reasonLabel')}
                    placeholder={tDispute('reason')}
                    value={disputeReason}
                    onChange={setDisputeReason}
                    rows={3}
                  />
                  <div>
                    <Button
                      variant="danger"
                      onClick={() => {
                        void action(() =>
                          apiClient.post(`/matches/${match.id}/dispute`, {
                            reason: disputeReason,
                          }),
                        );
                      }}
                      disabled={loading || disputeReason.trim().length < 10}
                    >
                      {tDispute('submit')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {match.status === 'DISPUTED' && isAdmin && match.dispute?.status === 'OPEN' && (
        <GlassCard className="px-5 py-5">
          <h2 className="text-sm font-bold text-secondary-glass m-0 mb-3">
            {tDispute('resolveTitle')}
          </h2>
          <div className="flex flex-col gap-3">
            <GlassSelect
              label={tDispute('decision')}
              value={resolveDecision}
              onChange={setResolveDecision}
              options={[
                { label: tDispute('decisionRejected'), value: 'REJECTED' },
                { label: tDispute('decisionUpheld'), value: 'UPHELD' },
              ]}
            />
            <Textarea
              label={tDispute('resolution')}
              value={resolveResolution}
              onChange={setResolveResolution}
              rows={3}
            />
            <div>
              <Button
                onClick={() => {
                  void action(() =>
                    apiClient.post(`/matches/${match.id}/dispute/resolve`, {
                      decision: resolveDecision,
                      resolution: resolveResolution,
                    }),
                  );
                }}
                disabled={loading || resolveResolution.trim().length < 10}
                loading={loading}
              >
                {tDispute('resolve')}
              </Button>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
