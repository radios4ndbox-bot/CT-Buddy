/** server e dispositivi finti che riproducono il comportamento di Supabase e degli store locali */
import {
  isNewer,
  nextUpdatedAt,
  type LocalEntry,
  type LocalSyncStore,
  type PullPage,
  type RemoteTemplates,
} from '../src';
import type { TemplateRecord } from '../src';
import { defaultExamConfig } from '@ct-buddy/core';

/** come la tabella `templates` + upsert_templates + trigger server_updated_at */
export class FakeServer {
  rows = new Map<string, { record: TemplateRecord; serverUpdatedAt: string }>();
  private clock = Date.parse('2026-11-23T08:00:00.000Z');
  /** se impostato, push e pull falliscono (rete assente) */
  offline = false;

  private tick(): string {
    this.clock += 1000;
    return new Date(this.clock).toISOString();
  }

  api(): RemoteTemplates {
    return {
      push: async (records) => {
        if (this.offline) throw new Error('offline');
        for (const r of records) {
          const cur = this.rows.get(r.id);
          // ON CONFLICT ... WHERE t.updated_at < excluded.updated_at
          if (!cur || isNewer(r.updatedAt, cur.record.updatedAt)) {
            this.rows.set(r.id, { record: structuredClone(r), serverUpdatedAt: this.tick() });
          }
        }
      },
      pullSince: async (since, limit): Promise<PullPage> => {
        if (this.offline) throw new Error('offline');
        const list = [...this.rows.values()]
          .filter((x) => !since || isNewer(x.serverUpdatedAt, since))
          .sort((a, b) => a.serverUpdatedAt.localeCompare(b.serverUpdatedAt))
          .slice(0, limit);
        return {
          records: list.map((x) => structuredClone(x.record)),
          cursor: list.length ? list[list.length - 1]!.serverUpdatedAt : null,
        };
      },
    };
  }
}

/** dispositivo con libreria locale (come store.ts / store.web.ts) */
export class FakeDevice implements LocalSyncStore {
  entries = new Map<string, LocalEntry>();
  cursor: string | null = null;
  private clock: number;

  constructor(clockStart = '2026-11-23T09:00:00.000Z') {
    this.clock = Date.parse(clockStart);
  }

  now(): string {
    this.clock += 1000;
    return new Date(this.clock).toISOString();
  }

  create(title: string): TemplateRecord {
    const now = this.now();
    const record: TemplateRecord = {
      id: crypto.randomUUID(),
      title,
      modality: 'TC',
      setting: 'elettiva',
      examConfig: defaultExamConfig(),
      findings: { organs: {} },
      conclusioni: '',
      renderedEsteso: '',
      renderedBreve: '',
      tags: [],
      isFavorite: false,
      dataVersion: 1,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    this.entries.set(record.id, { record, dirty: true });
    return record;
  }

  edit(id: string, patch: Partial<TemplateRecord>): void {
    const e = this.entries.get(id)!;
    const updatedAt = nextUpdatedAt(e.record.updatedAt, new Date(this.now()));
    this.entries.set(id, { record: { ...e.record, ...patch, updatedAt }, dirty: true });
  }

  remove(id: string): void {
    this.edit(id, { deletedAt: new Date(this.clock).toISOString() });
  }

  live(): TemplateRecord[] {
    return [...this.entries.values()].map((e) => e.record).filter((r) => !r.deletedAt);
  }

  titles(): string[] {
    return this.live()
      .map((r) => r.title)
      .sort();
  }

  // ---- LocalSyncStore ----
  async listDirty() {
    return [...this.entries.values()].filter((e) => e.dirty).map((e) => e.record);
  }
  async markClean(items: readonly Pick<TemplateRecord, 'id' | 'updatedAt'>[]) {
    for (const it of items) {
      const e = this.entries.get(it.id);
      if (e && e.record.updatedAt === it.updatedAt) e.dirty = false;
    }
  }
  async getEntries(ids: readonly string[]) {
    const m = new Map<string, LocalEntry>();
    for (const id of ids) {
      const e = this.entries.get(id);
      if (e) m.set(id, e);
    }
    return m;
  }
  async applyRemote(records: readonly TemplateRecord[]) {
    for (const r of records) this.entries.set(r.id, { record: structuredClone(r), dirty: false });
  }
  async getCursor() {
    return this.cursor;
  }
  async setCursor(c: string) {
    this.cursor = c;
  }
}
