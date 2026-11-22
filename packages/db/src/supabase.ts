/** adattatori Supabase condivisi da app e sito */
import type { SupabaseClient } from '@supabase/supabase-js';

import { fromRow, nextUpdatedAt, normalizeTimestamp, toRow } from './mapping';
import type { ClaimError } from './pairing';
import type { PullPage, RemoteTemplates } from './sync';
import type { TemplateRecord, TemplateRow } from './types';

export function supabaseRemote(client: SupabaseClient): RemoteTemplates {
  return {
    async push(records) {
      const { error } = await client.rpc('upsert_templates', { items: records.map(toRow) });
      if (error) throw new Error(`Invio modelli non riuscito: ${error.message}`);
    },
    async pullSince(since, limit): Promise<PullPage> {
      let q = client
        .from('templates')
        .select('*')
        .order('server_updated_at', { ascending: true })
        .limit(limit);
      if (since) q = q.gt('server_updated_at', since);
      const { data, error } = await q;
      if (error) throw new Error(`Download modelli non riuscito: ${error.message}`);
      const rows = (data ?? []) as TemplateRow[];
      const last = rows[rows.length - 1];
      return {
        records: rows.map(fromRow),
        cursor: last?.server_updated_at ? normalizeTimestamp(last.server_updated_at) : null,
      };
    },
  };
}

/** modelli non cancellati, dal più recente (per il sito) */
export async function listTemplates(client: SupabaseClient): Promise<TemplateRecord[]> {
  const { data, error } = await client
    .from('templates')
    .select('*')
    .is('deleted_at', null)
    .order('is_favorite', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as TemplateRow[]).map(fromRow);
}

/** salva una modifica fatta sul sito passando dalla stessa regola last-write-wins */
export async function saveTemplate(client: SupabaseClient, t: TemplateRecord): Promise<void> {
  const record = { ...t, updatedAt: nextUpdatedAt(t.updatedAt) };
  const { error } = await client.rpc('upsert_templates', { items: [toRow(record)] });
  if (error) throw new Error(error.message);
}

export async function deleteTemplate(client: SupabaseClient, t: TemplateRecord): Promise<void> {
  const now = new Date().toISOString();
  await saveTemplate(client, { ...t, deletedAt: now });
}

// ---------- collegamento dispositivi ----------

export interface Pairing {
  id: string;
  code: string;
  expiresAt: string;
}

export async function createPairing(client: SupabaseClient): Promise<Pairing> {
  const { data, error } = await client.rpc('create_pairing');
  if (error) throw new Error(error.message);
  const row = (Array.isArray(data) ? data[0] : data) as {
    id: string;
    code: string;
    expires_at: string;
  };
  return { id: row.id, code: row.code, expiresAt: normalizeTimestamp(row.expires_at) };
}

export async function getPairingStatus(
  client: SupabaseClient,
  id: string,
): Promise<{ claimedAt: string | null; deviceName: string | null } | null> {
  const { data, error } = await client
    .from('device_pairings')
    .select('claimed_at, device_name')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { claimedAt: data.claimed_at, deviceName: data.device_name };
}

/**
 * Telefono: riscatta il codice e apre la sessione dell'utente proprietario.
 * Restituisce l'email dell'account collegato oppure il tipo di errore.
 */
export async function claimPairing(
  client: SupabaseClient,
  code: string,
  deviceName: string,
): Promise<{ ok: true; email: string } | { ok: false; error: ClaimError }> {
  let res: { tokenHash?: string; email?: string; error?: string } | null = null;
  try {
    const { data, error } = await client.functions.invoke('claim-pairing', {
      body: { code, deviceName },
    });
    if (error) {
      // FunctionsHttpError: il corpo contiene { error: '...' }
      const ctx = (error as { context?: Response }).context;
      const body =
        ctx && typeof ctx.json === 'function' ? await ctx.json().catch(() => null) : null;
      const kind = (body as { error?: string } | null)?.error;
      if (kind === 'invalid_code' || kind === 'expired_or_used') return { ok: false, error: kind };
      return { ok: false, error: ctx ? 'server_error' : 'network' };
    }
    res = data;
  } catch {
    return { ok: false, error: 'network' };
  }
  if (!res?.tokenHash) return { ok: false, error: 'server_error' };

  // 'email' è il tipo raccomandato per i token_hash; 'magiclink' come ripiego per server più vecchi
  let { error } = await client.auth.verifyOtp({ token_hash: res.tokenHash, type: 'email' });
  if (error)
    ({ error } = await client.auth.verifyOtp({ token_hash: res.tokenHash, type: 'magiclink' }));
  if (error) return { ok: false, error: 'server_error' };
  return { ok: true, email: res.email ?? '' };
}
