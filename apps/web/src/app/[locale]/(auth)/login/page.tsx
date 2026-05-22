'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '../../../../lib/supabase/client';
import { GlassCard, GlassInput, Button, Banner } from '@tennisillo/ui';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const locale = useLocale();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (isRegister && password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

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

    router.push(`/${locale}/leagues`);
    router.refresh();
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/${locale}/leagues` },
    });
  }

  function switchMode() {
    setIsRegister(!isRegister);
    setError(null);
    setMessage(null);
    setConfirmPassword('');
  }

  return (
    <GlassCard className="w-full max-w-sm p-9">
      <h1 className="text-xl font-extrabold text-primary-glass text-center mb-6">
        {isRegister ? t('register') : t('login')}
      </h1>

      <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-3.5">
        <GlassInput
          type="email"
          placeholder={t('email')}
          value={email}
          onChange={setEmail}
          required
        />
        <GlassInput
          type="password"
          placeholder={t('password')}
          value={password}
          onChange={setPassword}
          required
        />
        {isRegister && (
          <GlassInput
            type="password"
            placeholder="Conferma password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />
        )}

        {error && <Banner tone="danger">{error}</Banner>}
        {message && <Banner tone="success">{message}</Banner>}

        <Button type="submit" loading={loading} className="w-full mt-1">
          {isRegister ? t('register') : t('login')}
        </Button>
      </form>

      {!isRegister && (
        <Button
          variant="secondary"
          type="button"
          onClick={() => { void handleGoogle(); }}
          className="w-full mt-2.5"
        >
          {t('loginWithGoogle')}
        </Button>
      )}

      <p className="text-center mt-4 text-xs text-tertiary-glass">
        <button
          type="button"
          onClick={switchMode}
          className="text-accent-light hover:underline bg-transparent border-none cursor-pointer text-xs"
        >
          {isRegister ? t('alreadyHaveAccount') : t('noAccount')}
        </button>
      </p>
    </GlassCard>
  );
}
