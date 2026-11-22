'use client';

/**
 * Client Supabase del sito. Tutto avviene nel browser: la sessione sta nel localStorage e i dati
 * sono protetti dalle regole RLS del database (ognuno vede solo i propri modelli).
 * Configurazione in apps/web/.env.local (vedi .env.example).
 */
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isConfigured = !!url && !!key && !url.includes('xxxxxxxx');

let client: SupabaseClient | null = null;

/** null se il server non è configurato */
export function getSupabase(): SupabaseClient | null {
  if (!isConfigured) return null;
  client ??= createClient(url!, key!, {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

export type SessionState =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; session: Session };

export function useSession(): SessionState {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      queueMicrotask(() => setState({ status: 'unconfigured' }));
      return;
    }
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: 'signed_in', session } : { status: 'signed_out' });
    });
    return () => data.subscription.unsubscribe();
  }, []);
  return state;
}
