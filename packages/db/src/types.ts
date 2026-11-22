import type { ExamConfig, Modalita, OrganStates } from '@ct-buddy/core';

/** contenuto della bozza salvato nel modello (colonna `findings`) */
export interface TemplateFindings {
  organs: OrganStates;
  numericFields?: Record<string, number | string>;
  compact?: boolean;
  tecnicaOverride?: string | null;
  conclusioniIncluded?: boolean;
}

/** un pre-referto della libreria, come lo usano app e sito (camelCase) */
export interface TemplateRecord {
  id: string;
  title: string;
  modality: string;
  setting: Modalita;
  examConfig: ExamConfig;
  findings: TemplateFindings;
  conclusioni: string;
  renderedEsteso: string;
  renderedBreve: string;
  tags: string[];
  isFavorite: boolean;
  dataVersion: number;
  /** ISO 8601 (UTC, con millisecondi) */
  createdAt: string;
  /** ora dell'ultima modifica sul dispositivo che l'ha fatta: decide chi vince nei conflitti */
  updatedAt: string;
  deletedAt: string | null;
}

export type NewTemplate = Omit<TemplateRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

/** riga della tabella `templates` di Supabase (snake_case) */
export interface TemplateRow {
  id: string;
  owner_id?: string;
  title: string;
  modality: string;
  setting: string;
  exam_config: ExamConfig;
  findings: TemplateFindings;
  conclusioni: string;
  rendered_esteso: string;
  rendered_breve: string;
  tags: string[];
  is_favorite: boolean;
  data_version: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  server_updated_at?: string;
}
