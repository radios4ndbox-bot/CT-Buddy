import type { LocalSyncStore, NewTemplate, TemplateRecord } from '@ct-buddy/db';

export type { NewTemplate, TemplateFindings, TemplateRecord } from '@ct-buddy/db';

/**
 * Archivio locale dei modelli: SQLite (nativo) o localStorage (anteprima web).
 * Implementa anche l'interfaccia usata dalla sincronizzazione.
 */
export interface TemplateStore extends LocalSyncStore {
  list(): Promise<TemplateRecord[]>;
  get(id: string): Promise<TemplateRecord | null>;
  create(t: NewTemplate): Promise<TemplateRecord>;
  update(id: string, patch: Partial<NewTemplate>): Promise<TemplateRecord | null>;
  /** cancellazione "morbida" (deletedAt), così si propaga agli altri dispositivi */
  remove(id: string): Promise<void>;
  /**
   * Dopo il collegamento a un account: tutta la libreria locale va inviata e il download
   * riparte da zero.
   */
  resetSyncState(): Promise<void>;
}
