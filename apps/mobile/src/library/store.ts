/** archivio dei modelli su SQLite (iOS/Android) */
import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';

import type { NewTemplate, TemplateRecord, TemplateStore } from './types';

interface Row {
  id: string;
  title: string;
  modality: string;
  setting: string;
  exam_config: string;
  findings: string;
  conclusioni: string;
  rendered_esteso: string;
  rendered_breve: string;
  tags: string;
  is_favorite: number;
  data_version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// migrazioni in ordine: l'indice + 1 è il valore di PRAGMA user_version dopo averla applicata
const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS templates (
     id TEXT PRIMARY KEY NOT NULL,
     title TEXT NOT NULL,
     modality TEXT NOT NULL DEFAULT 'TC',
     setting TEXT NOT NULL,
     exam_config TEXT NOT NULL,
     findings TEXT NOT NULL,
     conclusioni TEXT NOT NULL DEFAULT '',
     rendered_esteso TEXT NOT NULL DEFAULT '',
     rendered_breve TEXT NOT NULL DEFAULT '',
     tags TEXT NOT NULL DEFAULT '[]',
     is_favorite INTEGER NOT NULL DEFAULT 0,
     data_version INTEGER NOT NULL,
     created_at TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     deleted_at TEXT
   );
   CREATE INDEX IF NOT EXISTS templates_updated_idx ON templates (updated_at);`,
];

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function db(): Promise<SQLite.SQLiteDatabase> {
  dbPromise ??= (async () => {
    const d = await SQLite.openDatabaseAsync('ctbuddy.db');
    await d.execAsync('PRAGMA journal_mode = WAL;');
    const v =
      (await d.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
    for (let i = v; i < MIGRATIONS.length; i++) {
      await d.withTransactionAsync(async () => {
        await d.execAsync(MIGRATIONS[i]!);
        await d.execAsync(`PRAGMA user_version = ${i + 1}`);
      });
    }
    return d;
  })();
  return dbPromise;
}

function fromRow(r: Row): TemplateRecord {
  return {
    id: r.id,
    title: r.title,
    modality: r.modality,
    setting: r.setting as TemplateRecord['setting'],
    examConfig: JSON.parse(r.exam_config),
    findings: JSON.parse(r.findings),
    conclusioni: r.conclusioni,
    renderedEsteso: r.rendered_esteso,
    renderedBreve: r.rendered_breve,
    tags: JSON.parse(r.tags),
    isFavorite: r.is_favorite === 1,
    dataVersion: r.data_version,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    deletedAt: r.deleted_at,
  };
}

async function write(t: TemplateRecord): Promise<void> {
  const d = await db();
  await d.runAsync(
    `INSERT OR REPLACE INTO templates (id, title, modality, setting, exam_config, findings,
       conclusioni, rendered_esteso, rendered_breve, tags, is_favorite, data_version,
       created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    t.id,
    t.title,
    t.modality,
    t.setting,
    JSON.stringify(t.examConfig),
    JSON.stringify(t.findings),
    t.conclusioni,
    t.renderedEsteso,
    t.renderedBreve,
    JSON.stringify(t.tags),
    t.isFavorite ? 1 : 0,
    t.dataVersion,
    t.createdAt,
    t.updatedAt,
    t.deletedAt,
  );
}

export const templateStore: TemplateStore = {
  async list() {
    const d = await db();
    const rows = await d.getAllAsync<Row>(
      'SELECT * FROM templates WHERE deleted_at IS NULL ORDER BY is_favorite DESC, updated_at DESC',
    );
    return rows.map(fromRow);
  },
  async get(id) {
    const d = await db();
    const row = await d.getFirstAsync<Row>(
      'SELECT * FROM templates WHERE id = ? AND deleted_at IS NULL',
      id,
    );
    return row ? fromRow(row) : null;
  },
  async create(t: NewTemplate) {
    const now = new Date().toISOString();
    const rec: TemplateRecord = {
      ...t,
      id: Crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await write(rec);
    return rec;
  },
  async update(id, patch) {
    const cur = await templateStore.get(id);
    if (!cur) return null;
    const rec = { ...cur, ...patch, updatedAt: new Date().toISOString() };
    await write(rec);
    return rec;
  },
  async remove(id) {
    const d = await db();
    const now = new Date().toISOString();
    await d.runAsync(
      'UPDATE templates SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      id,
    );
  },
};
