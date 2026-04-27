import { redirect } from 'next/navigation';
import { createClient } from '../../../../lib/supabase/server';
import { DashboardClient } from './DashboardClient';

interface UserProfile {
  id: string;
  displayName: string;
  globalLevel: string;
  globalRating: number;
  globalExperiencePoints: number;
  reputationScore: number;
  onboardingCompleted: boolean;
}

async function fetchUserProfile(accessToken: string): Promise<UserProfile | null> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'];
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as UserProfile;
  } catch {
    return null;
  }
}

export default async function DashboardPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
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

  // Onboarding gate.
  // We trust /users/me as the single source of truth: the guard upserts the
  // local user lazily, and the User row carries onboardingCompleted. If the
  // API is unreachable we surface an empty dashboard rather than silently
  // skipping the gate.
  if (profile && !profile.onboardingCompleted) {
    redirect(`/${locale}/onboarding`);
  }

  return <DashboardClient profile={profile} />;
}
