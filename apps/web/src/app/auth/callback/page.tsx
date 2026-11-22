'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { getSupabase } from '@/lib/supabase';

/**
 * Pagina di ritorno dal link email. Il client Supabase (flusso PKCE, detectSessionInUrl)
 * scambia da solo il `code` dell'URL con una sessione; qui si aspetta e si va alla libreria.
 */
export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error_description') ?? params.get('error');
    const sb = getSupabase();
    if (urlError || !sb) {
      queueMicrotask(() => setError(urlError ?? 'Server non configurato.'));
      return;
    }
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace('/libreria');
    });
    const timeout = setTimeout(
      () =>
        setError(
          'Accesso non riuscito. Il link potrebbe essere scaduto o aperto in un browser diverso da quello in cui l’hai richiesto.',
        ),
      10_000,
    );
    return () => {
      data.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [router]);

  return (
    <main className="page narrow">
      {error ? (
        <div className="card">
          <h2>Accesso non riuscito</h2>
          <p className="muted">{error}</p>
          <Link className="btn" href="/">
            Riprova
          </Link>
        </div>
      ) : (
        <p className="muted">Accesso in corso…</p>
      )}
    </main>
  );
}
