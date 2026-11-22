/**
 * Sincronizzazione offline-first della libreria.
 *
 * - Ogni dispositivo tiene una copia completa e segna come "da inviare" (dirty) ciò che modifica.
 * - push: invia i modelli dirty; il server applica una modifica solo se è più recente della sua
 *   (`updated_at`, last-write-wins).
 * - pull: scarica ciò che è cambiato sul server dopo il cursore (`server_updated_at`, assegnato
 *   dal server e quindi immune agli orologi sbagliati) e lo applica in locale se più recente.
 * - Le cancellazioni sono "morbide" (`deletedAt`), così si propagano come modifiche normali.
 *
 * Il modulo non dipende da Supabase né dallo storage: riceve due adattatori, così è testabile.
 */
import { isNewer } from './mapping';
import type { TemplateRecord } from './types';

export interface LocalEntry {
  record: TemplateRecord;
  dirty: boolean;
}

export interface LocalSyncStore {
  /** modelli modificati in locale e non ancora inviati (comprese le cancellazioni) */
  listDirty(): Promise<TemplateRecord[]>;
  /** segna come inviati, ma solo se nel frattempo non sono stati modificati di nuovo */
  markClean(items: readonly Pick<TemplateRecord, 'id' | 'updatedAt'>[]): Promise<void>;
  getEntries(ids: readonly string[]): Promise<Map<string, LocalEntry>>;
  /** scrive i modelli arrivati dal server come "non dirty" */
  applyRemote(records: readonly TemplateRecord[]): Promise<void>;
  getCursor(): Promise<string | null>;
  setCursor(cursor: string): Promise<void>;
}

export interface PullPage {
  records: TemplateRecord[];
  /** server_updated_at più alto della pagina, null se vuota */
  cursor: string | null;
}

export interface RemoteTemplates {
  push(records: readonly TemplateRecord[]): Promise<void>;
  /** pagina di modelli con server_updated_at > since, in ordine crescente */
  pullSince(since: string | null, limit: number): Promise<PullPage>;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
}

/**
 * Margine con cui si ri-scarica l'ultimo tratto prima del cursore: una transazione partita
 * prima ma conclusa dopo potrebbe avere un server_updated_at inferiore al cursore. Riapplicare
 * un modello già visto è innocuo (la scelta è idempotente).
 */
export const PULL_OVERLAP_MS = 60_000;
const PUSH_BATCH = 100;
const PULL_PAGE = 500;

/** quali modelli remoti vanno applicati in locale */
export function remoteToApply(
  local: ReadonlyMap<string, LocalEntry>,
  remote: readonly TemplateRecord[],
): TemplateRecord[] {
  const latest = new Map<string, TemplateRecord>();
  for (const r of remote) {
    const prev = latest.get(r.id);
    if (!prev || isNewer(r.updatedAt, prev.updatedAt)) latest.set(r.id, r);
  }
  return [...latest.values()].filter((r) => {
    const l = local.get(r.id);
    return !l || isNewer(r.updatedAt, l.record.updatedAt);
  });
}

function withOverlap(cursor: string | null): string | null {
  if (!cursor) return null;
  const t = new Date(cursor).getTime();
  return Number.isNaN(t) ? null : new Date(t - PULL_OVERLAP_MS).toISOString();
}

export async function syncTemplates(
  local: LocalSyncStore,
  remote: RemoteTemplates,
): Promise<SyncResult> {
  // 1) push
  const dirty = await local.listDirty();
  for (let i = 0; i < dirty.length; i += PUSH_BATCH) {
    const batch = dirty.slice(i, i + PUSH_BATCH);
    await remote.push(batch);
    await local.markClean(batch);
  }

  // 2) pull
  const savedCursor = await local.getCursor();
  let since = withOverlap(savedCursor);
  let newCursor = savedCursor;
  let pulled = 0;
  for (;;) {
    const page = await remote.pullSince(since, PULL_PAGE);
    if (page.records.length) {
      const entries = await local.getEntries(page.records.map((r) => r.id));
      const apply = remoteToApply(entries, page.records);
      if (apply.length) await local.applyRemote(apply);
      pulled += apply.length;
    }
    if (page.cursor && (!newCursor || isNewer(page.cursor, newCursor))) newCursor = page.cursor;
    if (page.records.length < PULL_PAGE || !page.cursor) break;
    since = page.cursor;
  }
  if (newCursor && newCursor !== savedCursor) await local.setCursor(newCursor);

  return { pushed: dirty.length, pulled };
}
