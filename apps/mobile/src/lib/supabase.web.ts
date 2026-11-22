/** client Supabase per l'anteprima web dell'app: sessione nel localStorage del browser */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { supabaseConfig } from './supabase-config';

export const supabase: SupabaseClient | null = supabaseConfig
  ? createClient(supabaseConfig.url, supabaseConfig.publishableKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;
