/**
 * Archivio dei modelli per l'anteprima web dell'app: localStorage.
 * expo-sqlite su web richiede wasm e header COOP/COEP; qui non serve.
 */
import { nextUpdatedAt, type LocalEntry, type TemplateRecord } from '@ct-buddy/db';

import type { NewTemplate, TemplateStore } from './types';

const KEY = 'ctbuddy_templates_v1';
const CURSOR_KEY = 'ctbuddy_sync_cursor';

interface StoredTemplate extends TemplateRecord {
  dirty?: boolean;
}

function readAll(): StoredTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as StoredTemplate[];
  } catch {
    return [];
  }
}

function writeAll(list: StoredTemplate[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function strip({ dirty: _dirty, ...rec }: StoredTemplate): TemplateRecord {
  return rec;
}

function upsert(list: StoredTemplate[], rec: StoredTemplate): StoredTemplate[] {
  const i = list.findIndex((t) => t.id === rec.id);
  if (i < 0) return [...list, rec];
  const next = [...list];
  next[i] = rec;
  return next;
}

export const templateStore: TemplateStore = {
  async list() {
    return readAll()
      .filter((t) => !t.deletedAt)
      .sort(
        (a, b) =>
          Number(b.isFavorite) - Number(a.isFavorite) || b.updatedAt.localeCompare(a.updatedAt),
      )
      .map(strip);
  },
  async get(id) {
    const t = readAll().find((x) => x.id === id && !x.deletedAt);
    return t ? strip(t) : null;
  },
  async create(t: NewTemplate) {
    const now = new Date().toISOString();
    const rec: TemplateRecord = {
      ...t,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    writeAll([...readAll(), { ...rec, dirty: true }]);
    return rec;
  },
  async update(id, patch) {
    const cur = await templateStore.get(id);
    if (!cur) return null;
    const rec = { ...cur, ...patch, updatedAt: nextUpdatedAt(cur.updatedAt) };
    writeAll(upsert(readAll(), { ...rec, dirty: true }));
    return rec;
  },
  async remove(id) {
    const cur = await templateStore.get(id);
    if (!cur) return;
    const updatedAt = nextUpdatedAt(cur.updatedAt);
    writeAll(upsert(readAll(), { ...cur, deletedAt: updatedAt, updatedAt, dirty: true }));
  },

  // ---- sincronizzazione ----
  async listDirty() {
    return readAll()
      .filter((t) => t.dirty !== false)
      .map(strip);
  },
  async markClean(items) {
    const clean = new Map(items.map((i) => [i.id, i.updatedAt]));
    writeAll(readAll().map((t) => (clean.get(t.id) === t.updatedAt ? { ...t, dirty: false } : t)));
  },
  async getEntries(ids) {
    const wanted = new Set(ids);
    const out = new Map<string, LocalEntry>();
    for (const t of readAll()) {
      if (wanted.has(t.id)) out.set(t.id, { record: strip(t), dirty: t.dirty !== false });
    }
    return out;
  },
  async applyRemote(records) {
    let list = readAll();
    for (const r of records) list = upsert(list, { ...r, dirty: false });
    writeAll(list);
  },
  async getCursor() {
    return localStorage.getItem(CURSOR_KEY);
  },
  async setCursor(cursor) {
    localStorage.setItem(CURSOR_KEY, cursor);
  },
  async resetSyncState() {
    writeAll(readAll().map((t) => ({ ...t, dirty: true })));
    localStorage.removeItem(CURSOR_KEY);
  },
};
