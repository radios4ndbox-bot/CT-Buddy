import type { TemplateRecord, TemplateRow } from './types';

/** Postgres restituisce "…123+00:00", JavaScript produce "…123Z": si uniforma tutto a toISOString */
export function normalizeTimestamp(ts: string): string;
export function normalizeTimestamp(ts: string | null): string | null;
export function normalizeTimestamp(ts: string | null): string | null {
  if (ts == null) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? ts : d.toISOString();
}

/** true se `a` è strettamente più recente di `b` */
export function isNewer(a: string, b: string): boolean {
  return new Date(a).getTime() > new Date(b).getTime();
}

/**
 * Orario da assegnare a una modifica: adesso, ma comunque dopo la versione su cui si basa.
 * Così una modifica fatta da un dispositivo con l'orologio indietro non viene scambiata per
 * "più vecchia" di ciò che modifica (e scartata dal last-write-wins).
 */
export function nextUpdatedAt(previous: string | null | undefined, now = new Date()): string {
  const prev = previous ? new Date(previous).getTime() : Number.NaN;
  const t = Number.isNaN(prev) ? now.getTime() : Math.max(now.getTime(), prev + 1);
  return new Date(t).toISOString();
}

export function fromRow(r: TemplateRow): TemplateRecord {
  return {
    id: r.id,
    title: r.title,
    modality: r.modality,
    setting: r.setting as TemplateRecord['setting'],
    examConfig: r.exam_config,
    findings: r.findings,
    conclusioni: r.conclusioni,
    renderedEsteso: r.rendered_esteso,
    renderedBreve: r.rendered_breve,
    tags: r.tags ?? [],
    isFavorite: r.is_favorite,
    dataVersion: r.data_version,
    createdAt: normalizeTimestamp(r.created_at),
    updatedAt: normalizeTimestamp(r.updated_at),
    deletedAt: normalizeTimestamp(r.deleted_at),
  };
}

/** riga da inviare a upsert_templates (owner_id lo imposta il server da auth.uid()) */
export function toRow(t: TemplateRecord): TemplateRow {
  return {
    id: t.id,
    title: t.title,
    modality: t.modality,
    setting: t.setting,
    exam_config: t.examConfig,
    findings: t.findings,
    conclusioni: t.conclusioni,
    rendered_esteso: t.renderedEsteso,
    rendered_breve: t.renderedBreve,
    tags: t.tags,
    is_favorite: t.isFavorite,
    data_version: t.dataVersion,
    created_at: t.createdAt,
    updated_at: t.updatedAt,
    deleted_at: t.deletedAt,
  };
}
