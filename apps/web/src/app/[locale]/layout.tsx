import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { Toaster } from 'sonner';
import type { ReactNode } from 'react';
import '../globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tennisillo',
  description: 'Amateur tennis league management',
};

interface LocaleLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const messages = await getMessages();

  return (
    <html lang={params.locale} className={inter.variable}>
      <body>
        {/* Global app background — fixed layer, never repeated in card components */}
        <div aria-hidden="true" className="fixed inset-0 -z-10 bg-app" />
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              background: 'linear-gradient(135deg, rgba(255,255,255,0.14), rgba(255,255,255,0.07))',
              border: '1px solid rgba(255,255,255,0.18)',
              backdropFilter: 'blur(24px)',
              color: 'rgba(255,255,255,0.92)',
            },
          }}
        />
      </body>
    </html>
  );
}
