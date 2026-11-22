/**
 * Client Supabase per iOS/Android.
 *
 * La sessione viene cifrata (AES-CTR) e salvata in expo-sqlite; la chiave AES sta nel portachiavi
 * del sistema (expo-secure-store), che ha un limite di dimensione troppo basso per la sessione
 * intera. È lo schema "LargeSecureStore" raccomandato dalla guida Supabase per Expo.
 */
import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import * as aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import Storage from 'expo-sqlite/kv-store';
import { AppState } from 'react-native';

import { supabaseConfig } from './supabase-config';

class LargeSecureStore {
  private async encrypt(key: string, value: string): Promise<string> {
    const encryptionKey = Crypto.getRandomBytes(256 / 8);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encrypted = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    await SecureStore.setItemAsync(storeKey(key), aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encrypted);
  }

  private async decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(storeKey(key));
    if (!encryptionKeyHex) return null;
    const cipher = new aesjs.ModeOfOperation.ctr(
      aesjs.utils.hex.toBytes(encryptionKeyHex),
      new aesjs.Counter(1),
    );
    return aesjs.utils.utf8.fromBytes(cipher.decrypt(aesjs.utils.hex.toBytes(value)));
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await Storage.getItemAsync(key);
    return encrypted ? this.decrypt(key, encrypted) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    await Storage.setItemAsync(key, await this.encrypt(key, value));
  }

  async removeItem(key: string): Promise<void> {
    await Storage.removeItemAsync(key);
    await SecureStore.deleteItemAsync(storeKey(key));
  }
}

// SecureStore accetta solo [A-Za-z0-9._-] nelle chiavi
function storeKey(key: string): string {
  return 'ctb_' + key.replace(/[^A-Za-z0-9._-]/g, '_');
}

function create(): SupabaseClient | null {
  if (!supabaseConfig) return null;
  const client = createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
    auth: {
      storage: new LargeSecureStore(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  // il rinnovo automatico del token si ferma quando l'app va in background
  AppState.addEventListener('change', (state) => {
    if (state === 'active') client.auth.startAutoRefresh();
    else client.auth.stopAutoRefresh();
  });
  return client;
}

/** null se il server non è configurato (manca .env): l'app funziona solo in locale */
export const supabase = create();
