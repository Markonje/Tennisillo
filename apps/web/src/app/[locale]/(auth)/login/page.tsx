'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '../../../../lib/supabase/client';
import { GlassCard } from '@tennisillo/ui';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: authError } = isRegister
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    if (isRegister && data.user && !data.session) {
      setMessage('Controlla la tua email per confermare la registrazione.');
      return;
    }

    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/${locale}/dashboard` },
    });
  }

  return (
    <GlassCard style={{ width: '100%', maxWidth: 400, padding: '36px 32px' }}>
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: 'rgba(255,255,255,0.95)',
          marginBottom: 24,
          textAlign: 'center',
        }}
      >
        {isRegister ? t('register') : t('login')}
      </h1>

      <form onSubmit={(e) => { void handleSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <input
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
        <input
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        {error && (
          <p style={{ color: '#f09090', fontSize: 13, textAlign: 'center' }}>{error}</p>
        )}

        {message && (
          <p style={{ color: '#b0ef60', fontSize: 13, textAlign: 'center' }}>{message}</p>
        )}

        <button type="submit" disabled={loading} style={primaryBtnStyle}>
          {loading ? '…' : isRegister ? t('register') : t('login')}
        </button>
      </form>

      <button onClick={() => { void handleGoogle(); }} style={{ ...primaryBtnStyle, marginTop: 10, background: 'rgba(255,255,255,0.08)' }}>
        {t('loginWithGoogle')}
      </button>

      <p style={{ textAlign: 'center', marginTop: 18, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
        <button
          onClick={() => setIsRegister(!isRegister)}
          style={{ background: 'none', border: 'none', color: '#b0ef60', cursor: 'pointer', fontSize: 13 }}
        >
          {isRegister ? t('alreadyHaveAccount') : t('noAccount')}
        </button>
      </p>
    </GlassCard>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '12px 14px',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

const primaryBtnStyle: React.CSSProperties = {
  background: '#b0ef60',
  color: '#0a0e1a',
  border: 'none',
  borderRadius: 10,
  padding: '12px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  width: '100%',
};
