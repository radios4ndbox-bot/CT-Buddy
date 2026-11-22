'use client';

import type { Session } from '@supabase/supabase-js';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { getSupabase, useSession } from '@/lib/supabase';

import { Login } from './login';

/**
 * Intestazione e controllo dell'accesso: mostra il login se non c'è una sessione,
 * altrimenti la pagina richiesta (che riceve la sessione).
 */
export function Shell({ children }: { children: (session: Session) => ReactNode }) {
  const state = useSession();
  const pathname = usePathname();
  const session = state.status === 'signed_in' ? state.session : null;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <Link href="/" className="brand">
            CT Buddy
          </Link>
          {session ? (
            <>
              <Link
                href="/libreria"
                className={`nav-link${pathname.startsWith('/libreria') ? ' active' : ''}`}
              >
                Libreria
              </Link>
              <Link
                href="/collega"
                className={`nav-link${pathname.startsWith('/collega') ? ' active' : ''}`}
              >
                Collega il telefono
              </Link>
              <span className="user">{session.user.email}</span>
              <button className="btn ghost" onClick={() => void getSupabase()?.auth.signOut()}>
                Esci
              </button>
            </>
          ) : null}
        </div>
      </header>

      {state.status === 'loading' ? null : state.status === 'unconfigured' ? (
        <main className="page narrow">
          <div className="banner">
            Il sito non è ancora collegato a un server: crea il file{' '}
            <code>apps/web/.env.local</code> con indirizzo e chiave publishable del progetto
            Supabase (vedi <code>docs/SUPABASE.md</code>).
          </div>
        </main>
      ) : state.status === 'signed_out' ? (
        <Login />
      ) : (
        children(state.session)
      )}
    </>
  );
}
