import type { ExamConfig, Modalita, OrganStates } from '@ct-buddy/core';

/** contenuto della bozza salvato nel modello (colonna `findings` in Supabase) */
export interface TemplateFindings {
  organs: OrganStates;
  numericFields?: Record<string, number | string>;
  compact?: boolean;
  tecnicaOverride?: string | null;
  conclusioniIncluded?: boolean;
}

/**
 * Un pre-referto della libreria. Rispecchia la tabella `templates` di Supabase
 * (in camelCase), così la sincronizzazione della Fase 3 sarà una semplice mappatura.
 */
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
  /** ISO 8601 */
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type NewTemplate = Omit<TemplateRecord, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

/** archivio locale dei modelli: implementato con SQLite (nativo) o localStorage (web) */
export interface TemplateStore {
  list(): Promise<TemplateRecord[]>;
  get(id: string): Promise<TemplateRecord | null>;
  create(t: NewTemplate): Promise<TemplateRecord>;
  update(id: string, patch: Partial<NewTemplate>): Promise<TemplateRecord | null>;
  /** cancellazione "morbida" (deleted_at), necessaria alla sincronizzazione */
  remove(id: string): Promise<void>;
}
