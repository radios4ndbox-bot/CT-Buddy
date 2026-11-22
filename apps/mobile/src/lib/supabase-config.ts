/**
 * Configurazione del server, da apps/mobile/.env (vedi .env.example). Le variabili
 * EXPO_PUBLIC_* vengono incluse nell'app al momento del build: vanno lette per esteso
 * (process.env.NOME), non tramite accesso dinamico.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfig =
  url && publishableKey && !url.includes('xxxxxxxx') ? { url, publishableKey } : null;
