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

/** Extracts the NestJS error message from a failed response body, if any. */
async function errorFromResponse(res: Response, fallback: string): Promise<Error> {
  try {
    const body = (await res.json()) as { message?: unknown; errors?: unknown };
    const parts: string[] = [];
    if (typeof body.message === 'string') parts.push(body.message);
    else if (Array.isArray(body.message)) parts.push(body.message.join('; '));
    else if (body.message && typeof body.message === 'object') {
      const nested = body.message as { message?: unknown; errors?: unknown };
      if (typeof nested.message === 'string') parts.push(nested.message);
      if (Array.isArray(nested.errors)) parts.push(nested.errors.join('; '));
    }
    if (Array.isArray(body.errors)) parts.push(body.errors.join('; '));
    if (parts.length > 0) return new Error(parts.join(' — '));
  } catch {
    // non-JSON body: fall through to the generic message
  }
  return new Error(fallback);
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await getAuthHeader();
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  });
  if (!res.ok) {
    throw await errorFromResponse(res, `${method} ${path} failed: ${res.status}`);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export const apiClient = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path);
  },

  post<T>(path: string, body: unknown): Promise<T> {
    return request<T>('POST', path, body);
  },

  put<T>(path: string, body: unknown): Promise<T> {
    return request<T>('PUT', path, body);
  },

  patch<T>(path: string, body: unknown): Promise<T> {
    return request<T>('PATCH', path, body);
  },

  delete<T = void>(path: string): Promise<T> {
    return request<T>('DELETE', path);
  },
};
