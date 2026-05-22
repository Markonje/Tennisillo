'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GlassCard, GlassInput, GlassSelect, Textarea, Button, Banner } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

interface CreatedLeague {
  id: string;
}

const SPORT_OPTIONS = [
  { label: 'Tennis Singles', value: 'TENNIS_SINGLES' },
  { label: 'Tennis Doubles', value: 'TENNIS_DOUBLES' },
  { label: 'Padel', value: 'PADEL' },
];

export default function NewLeaguePage() {
  const t = useTranslations('createLeague');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'it';

  const [form, setForm] = useState({
    name: '',
    sport: 'TENNIS_SINGLES',
    type: 'PUBLIC',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const league = await apiClient.post<CreatedLeague>('/leagues', {
        name: form.name,
        sport: form.sport,
        type: form.type,
        ...(form.description && { description: form.description }),
      });
      router.push(`/${locale}/leagues/${league.id}`);
    } catch {
      setError('Impossibile creare la lega. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  const typeOptions = [
    { label: t('public'), value: 'PUBLIC' },
    { label: t('private'), value: 'PRIVATE' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass mb-6">{t('title')}</h1>

      <GlassCard className="p-7 max-w-lg">
        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
          <GlassInput
            label={t('name')}
            value={form.name}
            onChange={(v) => setForm({ ...form, name: v })}
            maxLength={80}
            required
          />
          <GlassSelect
            label={t('sport')}
            value={form.sport}
            onChange={(v) => setForm({ ...form, sport: v })}
            options={SPORT_OPTIONS}
          />
          <GlassSelect
            label={t('type')}
            value={form.type}
            onChange={(v) => setForm({ ...form, type: v })}
            options={typeOptions}
          />
          <Textarea
            label={t('description')}
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            maxLength={500}
            rows={3}
          />

          {error && <Banner tone="danger">{error}</Banner>}

          <Button
            type="submit"
            disabled={loading || !form.name.trim()}
            loading={loading}
            className="w-full"
          >
            {t('create')}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}
