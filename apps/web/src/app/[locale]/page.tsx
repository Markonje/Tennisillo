import { useTranslations } from 'next-intl';
import { SmokePage } from './_smoke';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <>
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
        <h1 className="text-4xl font-bold text-primary-500">{t('title')}</h1>
        <p className="text-lg text-neutral-500">{t('subtitle')}</p>
      </main>
      {/* DEV ONLY */}
      <SmokePage />
    </>
  );
}
