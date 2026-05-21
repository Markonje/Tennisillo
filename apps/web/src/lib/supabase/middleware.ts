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

  // CAMBIO CHIAVE: getSession() legge solo i cookie — zero chiamate di rete.
  // getUser() faceva una chiamata HTTP verso Supabase Auth ad ogni request
  // → timeout su Vercel Edge Runtime.
  // La verifica server-side dell'identità avviene nelle singole Server Pages
  // via createClient() + getUser(), non nel middleware.
  const { data: { session } } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;
  const localeMatch = pathname.match(/^\/([a-z]{2})\//);
  const locale = localeMatch?.[1] ?? 'it';

  // Proteggi le route app: se non c'è sessione → login
  const isAppRoute = /\/[a-z]{2}\/(leagues|profile|onboarding|seasons)/.test(pathname);
  if (isAppRoute && !session) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
