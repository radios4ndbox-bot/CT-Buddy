'use client';

import { useState, type FormEvent } from 'react';

import { getSupabase } from '@/lib/supabase';

/** accesso con link via email (nessuna password) */
export function Login() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setState('sending');
    const { error } = await sb.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setState('error');
    } else {
      setState('sent');
    }
  }

  return (
    <main className="page narrow">
      <h1>CT Buddy</h1>
      <p className="muted">
        La tua libreria di pre-referti TC, la stessa che hai nell’app. Accedi con la tua email: ti
        mandiamo un link, nessuna password da ricordare.
      </p>
      {state === 'sent' ? (
        <div className="card">
          <h2>Controlla la posta</h2>
          <p className="muted">
            Abbiamo inviato un link di accesso a <strong>{email}</strong>. Aprilo da questo stesso
            browser per entrare.
          </p>
          <button className="btn ghost" onClick={() => setState('idle')}>
            Usa un’altra email
          </button>
        </div>
      ) : (
        <form className="card" onSubmit={submit}>
          <label className="label" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="input"
            type="email"
            required
            autoComplete="email"
            placeholder="nome@ospedale.it"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" type="submit" disabled={state === 'sending'}>
            {state === 'sending' ? 'Invio in corso…' : 'Inviami il link di accesso'}
          </button>
          {state === 'error' ? <div className="banner">{error}</div> : null}
        </form>
      )}
      <p className="muted">
        CT Buddy è uno strumento di supporto alla redazione del testo: la responsabilità clinica
        resta del medico. La libreria contiene solo modelli anonimi.
      </p>
    </main>
  );
}
