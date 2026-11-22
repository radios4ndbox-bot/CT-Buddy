'use client';

import {
  createPairing,
  formatPairingCode,
  getPairingStatus,
  pairingUrl,
  type Pairing,
} from '@ct-buddy/db';
import QRCode from 'qrcode';
import { useCallback, useEffect, useState } from 'react';

import { Shell } from '@/components/shell';
import { getSupabase } from '@/lib/supabase';

type State =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; pairing: Pairing; svg: string }
  | { kind: 'expired' }
  | { kind: 'linked'; deviceName: string | null };

/**
 * "Collega il telefono": genera un codice monouso (3 minuti) e lo mostra come QR.
 * Il telefono lo inquadra dall'app (Libreria → Collega con QR code) e riceve la sessione.
 */
function Collega() {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [now, setNow] = useState(() => Date.now());

  const generate = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) return;
    setState({ kind: 'loading' });
    try {
      const pairing = await createPairing(sb);
      const svg = await QRCode.toString(pairingUrl(pairing.code), {
        type: 'svg',
        margin: 0,
        errorCorrectionLevel: 'M',
      });
      setState({ kind: 'ready', pairing, svg });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void generate());
  }, [generate]);

  // conto alla rovescia e controllo periodico: il telefono ha usato il codice?
  useEffect(() => {
    if (state.kind !== 'ready') return;
    const id = setInterval(async () => {
      setNow(Date.now());
      if (Date.now() > new Date(state.pairing.expiresAt).getTime()) {
        setState({ kind: 'expired' });
        return;
      }
      const sb = getSupabase();
      if (!sb) return;
      const status = await getPairingStatus(sb, state.pairing.id).catch(() => null);
      if (status?.claimedAt) setState({ kind: 'linked', deviceName: status.deviceName });
    }, 2000);
    return () => clearInterval(id);
  }, [state]);

  const secondsLeft =
    state.kind === 'ready'
      ? Math.max(0, Math.round((new Date(state.pairing.expiresAt).getTime() - now) / 1000))
      : 0;

  return (
    <main className="page narrow">
      <h1>Collega il telefono</h1>
      <p className="muted">
        Apri CT Buddy sul telefono, vai in <strong>Libreria → Collega con QR code</strong> e
        inquadra questo codice. Il telefono avrà la stessa libreria di questo account e resterà
        sincronizzato.
      </p>

      <section className="card">
        {state.kind === 'loading' ? <p className="muted">Generazione del codice…</p> : null}

        {state.kind === 'error' ? (
          <>
            <div className="banner">Impossibile generare il codice: {state.message}</div>
            <button className="btn" onClick={() => void generate()}>
              Riprova
            </button>
          </>
        ) : null}

        {state.kind === 'ready' ? (
          <>
            <div className="qr" dangerouslySetInnerHTML={{ __html: state.svg }} />
            <div className="code">{formatPairingCode(state.pairing.code)}</div>
            <p className="muted" style={{ textAlign: 'center' }}>
              Oppure digita il codice nell’app. Valido ancora {Math.floor(secondsLeft / 60)}:
              {String(secondsLeft % 60).padStart(2, '0')}, si può usare una sola volta.
            </p>
          </>
        ) : null}

        {state.kind === 'expired' ? (
          <>
            <p className="muted">Il codice è scaduto.</p>
            <button className="btn" onClick={() => void generate()}>
              Genera un nuovo codice
            </button>
          </>
        ) : null}

        {state.kind === 'linked' ? (
          <>
            <p className="success">
              ✓ Telefono collegato{state.deviceName ? `: ${state.deviceName}` : ''}
            </p>
            <p className="muted">
              La libreria si sincronizza in automatico. Per collegare un altro telefono genera un
              nuovo codice.
            </p>
            <button className="btn secondary" onClick={() => void generate()}>
              Collega un altro telefono
            </button>
          </>
        ) : null}
      </section>

      <div className="banner info">
        Il codice dà accesso alla tua libreria: non mostrarlo e non inviarlo ad altri.
      </div>
    </main>
  );
}

export default function CollegaPage() {
  return <Shell>{() => <Collega />}</Shell>;
}
