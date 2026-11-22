/**
 * Archivio dei modelli per la versione web dell'app (anteprima/sviluppo): localStorage.
 * expo-sqlite su web richiede wasm e header COOP/COEP; qui non serve, e il sito vero
 * (Fase 4) leggerà la libreria da Supabase.
 */
import type { NewTemplate, TemplateRecord, TemplateStore } from './types';

const KEY = 'ctbuddy_templates_v1';

function readAll(): TemplateRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as TemplateRecord[];
  } catch {
    return [];
  }
}

function writeAll(list: TemplateRecord[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

function sortLive(list: TemplateRecord[]): TemplateRecord[] {
  return list
    .filter((t) => !t.deletedAt)
    .sort(
      (a, b) =>
        Number(b.isFavorite) - Number(a.isFavorite) || b.updatedAt.localeCompare(a.updatedAt),
    );
}

export const templateStore: TemplateStore = {
  async list() {
    return sortLive(readAll());
  },
  async get(id) {
    return readAll().find((t) => t.id === id && !t.deletedAt) ?? null;
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
    writeAll([...readAll(), rec]);
    return rec;
  },
  async update(id, patch) {
    const all = readAll();
    const i = all.findIndex((t) => t.id === id && !t.deletedAt);
    if (i < 0) return null;
    const rec = { ...all[i]!, ...patch, updatedAt: new Date().toISOString() };
    all[i] = rec;
    writeAll(all);
    return rec;
  },
  async remove(id) {
    const now = new Date().toISOString();
    writeAll(readAll().map((t) => (t.id === id ? { ...t, deletedAt: now, updatedAt: now } : t)));
  },
};
