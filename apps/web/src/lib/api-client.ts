import { createBrowserClient } from '@supabase/ssr';

function createSupabaseClient() {
  return createBrowserClient(
    process.env['NEXT_PUBLIC_SUPABASE_URL']!,
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
  );
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const supabase = createSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return {};
  return { Authorization: `Bearer ${session.access_token}` };
}

const API_URL = process.env['NEXT_PUBLIC_API_URL'] ?? '';

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },

  async post<T>(path: string, body: unknown): Promise<T> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },

  async put<T>(path: string, body: unknown): Promise<T> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PUT ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },

  async patch<T>(path: string, body: unknown): Promise<T> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
    return res.json() as Promise<T>;
  },

  async delete<T = void>(path: string): Promise<T> {
    const headers = await getAuthHeader();
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...headers },
    });
    if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status}`);
    if (res.status === 204 || res.headers.get('content-length') === '0') {
      return undefined as T;
    }
    return res.json() as Promise<T>;
  },
};
