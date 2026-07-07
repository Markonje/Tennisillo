'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Banner,
  Button,
  EmptyState,
  GlassCard,
  GlassInput,
  GlassSelect,
  Textarea,
  cn,
} from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

export interface VenueDto {
  id: string;
  name: string;
  address: string;
  surface: string | null;
  cover: string | null;
  courtCount: number | null;
  bookingUrl: string | null;
  phone: string | null;
  notes: string | null;
  status: string;
}

export interface FavoriteDto {
  venueId: string;
  priority: number;
  venue: VenueDto;
}

export interface ProposalDto {
  id: string;
  proposedData: Partial<VenueDto>;
  proposedBy?: { displayName: string; username: string };
  createdAt: string;
}

interface Props {
  leagueId: string;
  isAdmin: boolean;
  venues: VenueDto[];
  favorites: FavoriteDto[];
  proposals: ProposalDto[];
}

const SURFACES = ['CLAY', 'HARD', 'GRASS', 'SYNTHETIC', 'OTHER'];
const COVERS = ['INDOOR', 'OUTDOOR', 'MIXED'];

export function VenuesClient({ leagueId, isAdmin, venues, favorites, proposals }: Props) {
  const router = useRouter();
  const t = useTranslations('venues');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // create / propose form
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [surface, setSurface] = useState('');
  const [cover, setCover] = useState('');
  const [courtCount, setCourtCount] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  // favorites (3 ordered selects)
  const [fav1, setFav1] = useState(favorites.find((f) => f.priority === 1)?.venueId ?? '');
  const [fav2, setFav2] = useState(favorites.find((f) => f.priority === 2)?.venueId ?? '');
  const [fav3, setFav3] = useState(favorites.find((f) => f.priority === 3)?.venueId ?? '');

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  async function run(fn: () => Promise<unknown>, successMessage?: string) {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      if (successMessage) setInfo(successMessage);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  function submitVenue() {
    const body = {
      name,
      address,
      ...(surface && { surface }),
      ...(cover && { cover }),
      ...(courtCount && { courtCount: Number(courtCount) }),
      ...(bookingUrl && { bookingUrl }),
      ...(phone && { phone }),
      ...(notes && { notes }),
    };
    const path = isAdmin ? `/leagues/${leagueId}/venues` : `/leagues/${leagueId}/venue-proposals`;
    return run(async () => {
      await apiClient.post(path, body);
      setShowForm(false);
      setName('');
      setAddress('');
      setSurface('');
      setCover('');
      setCourtCount('');
      setBookingUrl('');
      setPhone('');
      setNotes('');
    }, isAdmin ? undefined : t('proposalSent'));
  }

  function saveFavorites() {
    const list = [fav1, fav2, fav3]
      .map((venueId, i) => ({ venueId, priority: i + 1 }))
      .filter((f) => f.venueId !== '');
    return run(
      () => apiClient.put(`/leagues/${leagueId}/members/me/favorite-venues`, { venues: list }),
      t('favoritesSaved'),
    );
  }

  const favoriteOptions = (exclude: string[]) => [
    { label: t('noFavorite'), value: '' },
    ...venues
      .filter((v) => !exclude.includes(v.id))
      .map((v) => ({ label: v.name, value: v.id })),
  ];

  return (
    <div className="flex flex-col gap-5">
      {error && <Banner tone="danger">{error}</Banner>}
      {info && <Banner tone="success">{info}</Banner>}

      {/* Venue list */}
      <GlassCard className="px-5 py-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-secondary-glass m-0">{t('title')}</h2>
          <Button variant="secondary" onClick={() => setShowForm((v) => !v)}>
            {isAdmin ? t('add') : t('propose')}
          </Button>
        </div>

        {showForm && (
          <div className="mb-5 pb-5 border-b border-glass grid gap-3 sm:grid-cols-2">
            <GlassInput label={t('name')} value={name} onChange={setName} />
            <GlassInput label={t('address')} value={address} onChange={setAddress} />
            <GlassSelect
              label={t('surface')}
              value={surface}
              onChange={setSurface}
              options={[
                { label: '—', value: '' },
                ...SURFACES.map((s) => ({ label: t(`surfaces.${s}`), value: s })),
              ]}
            />
            <GlassSelect
              label={t('cover')}
              value={cover}
              onChange={setCover}
              options={[
                { label: '—', value: '' },
                ...COVERS.map((c) => ({ label: t(`covers.${c}`), value: c })),
              ]}
            />
            <GlassInput
              label={t('courtCount')}
              type="number"
              min={1}
              value={courtCount}
              onChange={setCourtCount}
            />
            <GlassInput label={t('bookingUrl')} value={bookingUrl} onChange={setBookingUrl} />
            <GlassInput label={t('phone')} value={phone} onChange={setPhone} />
            <Textarea label={t('notes')} value={notes} onChange={setNotes} rows={2} />
            <div className="sm:col-span-2">
              <Button
                onClick={() => {
                  void submitVenue();
                }}
                disabled={loading || name.length < 2 || address.length < 5}
                loading={loading}
              >
                {isAdmin ? t('add') : t('propose')}
              </Button>
            </div>
          </div>
        )}

        {venues.length === 0 ? (
          <EmptyState icon="📍" title={t('empty')} />
        ) : (
          <div className="flex flex-col">
            {venues.map((v, i) => (
              <div
                key={v.id}
                className={cn(
                  'flex flex-wrap items-start gap-x-4 gap-y-1 py-3',
                  i < venues.length - 1 && 'border-b border-glass',
                )}
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="text-sm font-semibold text-primary-glass">{v.name}</div>
                  <div className="text-xs text-tertiary-glass">{v.address}</div>
                  <div className="text-[11px] text-muted-glass mt-0.5 flex flex-wrap gap-x-3">
                    {v.surface && <span>{t(`surfaces.${v.surface}`)}</span>}
                    {v.cover && <span>{t(`covers.${v.cover}`)}</span>}
                    {v.courtCount && (
                      <span>
                        {t('courtCount')}: {v.courtCount}
                      </span>
                    )}
                    {v.phone && <span>{v.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  {v.bookingUrl && (
                    <a
                      href={v.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-accent-light no-underline hover:underline"
                    >
                      {t('book')} ↗
                    </a>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        void run(() => apiClient.delete(`/venues/${v.id}`));
                      }}
                      className="text-xs text-danger-light hover:underline bg-transparent border-0 cursor-pointer"
                    >
                      {t('archive')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Admin: pending proposals */}
      {isAdmin && proposals.length > 0 && (
        <GlassCard className="px-5 py-5">
          <h2 className="text-sm font-bold text-secondary-glass m-0 mb-4">
            {t('pendingProposals')} ({proposals.length})
          </h2>
          <div className="flex flex-col gap-4">
            {proposals.map((p) => (
              <div key={p.id} className="rounded-[12px] border border-glass px-4 py-3">
                <div className="text-sm font-semibold text-primary-glass">
                  {p.proposedData.name}
                </div>
                <div className="text-xs text-tertiary-glass mb-2">
                  {p.proposedData.address}
                  {p.proposedBy && (
                    <span className="ml-2 text-muted-glass">
                      {t('proposedBy', { name: p.proposedBy.displayName })}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    onClick={() => {
                      void run(() => apiClient.post(`/venue-proposals/${p.id}/approve`, {}));
                    }}
                    disabled={loading}
                  >
                    {t('approve')}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)}
                    disabled={loading}
                  >
                    {t('reject')}
                  </Button>
                </div>
                {rejectingId === p.id && (
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
                          await apiClient.post(`/venue-proposals/${p.id}/reject`, {
                            reviewNotes: rejectReason,
                          });
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

      {/* Favorites */}
      {venues.length > 0 && (
        <GlassCard className="px-5 py-5">
          <h2 className="text-sm font-bold text-secondary-glass m-0 mb-1">
            {t('favoritesTitle')}
          </h2>
          <p className="text-xs text-tertiary-glass mt-0 mb-4">{t('favoritesHint')}</p>
          <div className="flex flex-wrap items-end gap-3">
            <GlassSelect
              label={t('priority', { n: 1 })}
              value={fav1}
              onChange={setFav1}
              options={favoriteOptions([fav2, fav3])}
              className="w-56"
            />
            <GlassSelect
              label={t('priority', { n: 2 })}
              value={fav2}
              onChange={setFav2}
              options={favoriteOptions([fav1, fav3])}
              className="w-56"
            />
            <GlassSelect
              label={t('priority', { n: 3 })}
              value={fav3}
              onChange={setFav3}
              options={favoriteOptions([fav1, fav2])}
              className="w-56"
            />
            <Button
              variant="secondary"
              onClick={() => {
                void saveFavorites();
              }}
              disabled={loading || (fav2 !== '' && fav1 === '') || (fav3 !== '' && fav2 === '')}
            >
              {t('favoritesSave')}
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
