import { getTranslations } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import { FrequencyClient, type FrequencyDetail } from './FrequencyClient';

interface Props {
  params: { leagueId: string };
}

export default async function FrequencyPage({ params }: Props) {
  const { leagueId } = params;
  const t = await getTranslations('frequency');

  const detail = await apiServer.get<FrequencyDetail>(
    `/leagues/${leagueId}/members/me/frequency`,
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass m-0 mb-2">{t('title')}</h1>
      <p className="text-sm text-tertiary-glass mt-0 mb-6">{t('hint')}</p>
      <FrequencyClient leagueId={leagueId} initial={detail} />
    </div>
  );
}
