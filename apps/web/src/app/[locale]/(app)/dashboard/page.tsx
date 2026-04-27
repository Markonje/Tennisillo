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

  // Check onboarding status — redirect if not completed
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
  try {
    const onboardingRes = await fetch(`${apiUrl}/onboarding/status`, {
      headers: {
        Authorization: `Bearer ${session?.access_token ?? ''}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    if (onboardingRes.ok) {
      const { completed } = (await onboardingRes.json()) as { completed: boolean };
      if (!completed) {
        redirect(`/${locale}/onboarding`);
      }
    }
  } catch {
    // API not reachable — allow access to dashboard
  }

  const profile = session?.access_token ? await fetchUserProfile(session.access_token) : null;

  return <DashboardClient profile={profile} />;
}
