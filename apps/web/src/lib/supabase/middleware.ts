import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/([a-z]{2})\//);
  const locale = localeMatch?.[1] ?? 'it';

  const isAppRoute = /\/[a-z]{2}\/(leagues|profile|onboarding)/.test(pathname);

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  // Onboarding gate: redirect to /onboarding if not yet completed
  if (user && isAppRoute && !pathname.includes('/onboarding')) {
    const apiUrl = process.env['NEXT_PUBLIC_API_URL'];
    if (apiUrl) {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          const res = await fetch(`${apiUrl}/onboarding/status`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: 'no-store',
          });
          if (res.ok) {
            const { completed } = (await res.json()) as { completed: boolean };
            if (!completed) {
              const url = request.nextUrl.clone();
              url.pathname = `/${locale}/onboarding`;
              return NextResponse.redirect(url);
            }
          }
        }
      } catch {
        // Network failure — do not block the user
      }
    }
  }

  return supabaseResponse;
}
