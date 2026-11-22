// CT Buddy — Edge Function `claim-pairing`
//
// Il telefono (non ancora autenticato) invia il codice letto dal QR mostrato sul sito.
// Se il codice è valido (monouso, non scaduto) la funzione genera un token di accesso
// monouso per l'utente proprietario del codice; l'app lo scambia con una sessione tramite
// `supabase.auth.verifyOtp({ token_hash, type: 'email' })`.
//
// Va pubblicata SENZA verifica JWT (il telefono non ha ancora una sessione):
//   npx supabase functions deploy claim-pairing --no-verify-jwt
// L'autorizzazione è il codice stesso: ~60 bit casuali, valido 3 minuti, utilizzabile una volta.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** chiave segreta: nuove chiavi `sb_secret_…` se presenti, altrimenti la service_role legacy */
function secretKey(): string {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keys) {
    try {
      const parsed = JSON.parse(keys) as Record<string, string>;
      if (parsed.default) return parsed.default;
    } catch {
      // formato inatteso: si prova la chiave legacy
    }
  }
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!legacy) throw new Error('Nessuna chiave segreta disponibile');
  return legacy;
}

/** stessa normalizzazione del client: maiuscolo, senza spazi e trattini */
function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  let body: { code?: unknown; deviceName?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_body' }, 400);
  }
  const code = typeof body.code === 'string' ? normalizeCode(body.code) : '';
  const deviceName = typeof body.deviceName === 'string' ? body.deviceName.slice(0, 100) : '';
  if (code.length !== 12) return json({ error: 'invalid_code' }, 400);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userId, error: claimError } = await admin.rpc('claim_pairing', {
    p_code_hash: await sha256Hex(code),
    p_device_name: deviceName,
  });
  if (claimError) {
    console.error('claim_pairing', claimError);
    return json({ error: 'server_error' }, 500);
  }
  if (!userId) return json({ error: 'expired_or_used' }, 410);

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  const email = userData?.user?.email;
  if (userError || !email) {
    console.error('getUserById', userError);
    return json({ error: 'user_not_found' }, 404);
  }

  const { data: link, error: linkError } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    console.error('generateLink', linkError);
    return json({ error: 'server_error' }, 500);
  }

  return json({ tokenHash, email });
});
