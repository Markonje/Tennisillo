import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { createClient } from '../../../../lib/supabase/server';
import { DashboardClient } from './DashboardClient';

interface UserProfile {
  id: string;
  displayName: string;
  globalLevel: string;
  globalRating: number;
  globalExperiencePoints: number;
  reputationScore: number;
}

async function fetchUserProfile(accessToken: string): Promise<UserProfile | null> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<UserProfile>;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/login`);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const profile = session?.access_token ? await fetchUserProfile(session.access_token) : null;

  return <DashboardClient userEmail={user.email} profile={profile} />;
}
