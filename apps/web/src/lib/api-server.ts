import { createClient } from '@/lib/supabase/server';

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? '';

async function getServerAuthHeader(): Promise<Record<string, string>> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

export const apiServer = {
  async get<T>(path: string): Promise<T | null> {
    try {
      const headers = await getServerAuthHeader();
      const res = await fetch(`${API_URL}${path}`, {
        headers: { 'Content-Type': 'application/json', ...headers },
        cache: 'no-store',
      });
      if (!res.ok) return null;
      return res.json() as Promise<T>;
    } catch {
      return null;
    }
  },
};
