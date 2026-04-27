'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    );
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <button
      onClick={() => {
        void handleLogout();
      }}
      style={{
        width: '100%',
        display: 'block',
        padding: '10px 14px',
        borderRadius: 10,
        background: '#f09090',
        color: '#0a0e1a',
        border: 'none',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      🚪 Logout
    </button>
  );
}
