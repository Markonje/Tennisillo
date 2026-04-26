import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@tennisillo/shared-types';

const intlMiddleware = createIntlMiddleware({
  locales: SUPPORTED_LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  // Auth session refresh first (sets cookies)
  const sessionResponse = await updateSession(request);

  // If updateSession returned a redirect, honour it
  if (sessionResponse.status === 307 || sessionResponse.status === 302) {
    return sessionResponse;
  }

  // Then run i18n routing
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
