/**
 * Motore di sincronizzazione dell'app: collega la libreria locale all'account Supabase.
 *
 * Quando sincronizza: all'avvio, quando l'app torna in primo piano, qualche secondo dopo ogni
 * modifica locale, subito dopo il collegamento e quando l'utente lo chiede.
 * Il referto in corso NON viene mai sincronizzato: solo i modelli salvati nella libreria.
 */
import { claimPairing, supabaseRemote, syncTemplates, type ClaimError } from '@ct-buddy/db';
import * as Device from 'expo-device';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';

import { bumpLibrary } from '@/library/revision';
import { templateStore } from '@/library/store';
import { supabase } from '@/lib/supabase';

export type SyncStatus = 'disabled' | 'signed_out' | 'idle' | 'syncing' | 'error';

interface SyncState {
  status: SyncStatus;
  email: string | null;
  lastSyncAt: string | null;
  error: string | null;
}

export const useSync = create<SyncState>()(() => ({
  status: supabase ? 'signed_out' : 'disabled',
  email: null,
  lastSyncAt: null,
  error: null,
}));

let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** sincronizza adesso (se ne è già in corso una, ne accoda un'altra alla fine) */
export function syncNow(): Promise<void> {
  if (!supabase || !useSync.getState().email) return Promise.resolve();
  if (running) {
    again = true;
    return running;
  }
  const client = supabase;
  running = (async () => {
    do {
      again = false;
      useSync.setState({ status: 'syncing', error: null });
      try {
        const res = await syncTemplates(templateStore, supabaseRemote(client));
        if (res.pulled) bumpLibrary();
        useSync.setState({ status: 'idle', lastSyncAt: new Date().toISOString() });
      } catch (e) {
        useSync.setState({ status: 'error', error: e instanceof Error ? e.message : String(e) });
      }
    } while (again);
  })().finally(() => {
    running = null;
  });
  return running;
}

/** sincronizza tra poco, raggruppando modifiche ravvicinate */
export function scheduleSync(delayMs = 2500): void {
  if (!supabase) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    void syncNow();
  }, delayMs);
}

function deviceName(): string {
  const name = Device.deviceName ?? Device.modelName ?? null;
  const os = Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web';
  return name ? `${name} (${os})` : `CT Buddy ${os}`;
}

/** collega il telefono all'account con il codice letto dal QR del sito */
export async function linkWithCode(
  code: string,
): Promise<{ ok: true; email: string } | { ok: false; error: ClaimError }> {
  if (!supabase) return { ok: false, error: 'server_error' };
  const res = await claimPairing(supabase, code, deviceName());
  if (!res.ok) return res;
  // la libreria locale (anche quella creata prima del collegamento) va inviata all'account
  await templateStore.resetSyncState();
  useSync.setState({ status: 'idle', email: res.email || null, error: null });
  await syncNow();
  return res;
}

/** scollega: chiude la sessione, i modelli restano sul telefono */
export async function unlink(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut({ scope: 'local' });
  useSync.setState({ status: 'signed_out', email: null, lastSyncAt: null, error: null });
}

let started = false;

/** da chiamare una volta all'avvio dell'app */
export function startSync(): void {
  if (started || !supabase) return;
  started = true;
  const client = supabase;

  client.auth.onAuthStateChange((_event, session) => {
    const email = session?.user?.email ?? null;
    const prev = useSync.getState();
    if (email && !prev.email) {
      useSync.setState({ email, status: 'idle' });
      void syncNow();
    } else if (!email && prev.email) {
      useSync.setState({ email: null, status: 'signed_out' });
    }
  });

  AppState.addEventListener('change', (state) => {
    if (state === 'active') void syncNow();
  });
}
