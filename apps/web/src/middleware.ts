import createIntlMiddleware from 'next-intl/middleware';
import { type NextRequest } from 'next/server';
import { updateSession } from './lib/supabase/middleware';
import { routing } from './routing';

const intlMiddleware = createIntlMiddleware(routing);

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
