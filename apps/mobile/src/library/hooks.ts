import {
  DATA_VERSION,
  buildReportForms,
  findPatientDataWarnings,
  type PrivacyWarning,
} from '@ct-buddy/core';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { toReportInput, toTemplateFindings, type DraftState } from '@/state/draft';

import { templateStore } from './store';
import type { NewTemplate, TemplateRecord } from './types';

// ---------- notifica delle modifiche, per aggiornare le liste aperte ----------

let revision = 0;
const listeners = new Set<() => void>();

function bump() {
  revision++;
  listeners.forEach((l) => l());
}

function useRevision() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => revision,
  );
}

// ---------- letture ----------

export function useTemplates(): { templates: TemplateRecord[]; loading: boolean } {
  const rev = useRevision();
  const [state, setState] = useState<{ templates: TemplateRecord[]; loading: boolean }>({
    templates: [],
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    templateStore.list().then((templates) => alive && setState({ templates, loading: false }));
    return () => {
      alive = false;
    };
  }, [rev]);
  return state;
}

export function useTemplate(id: string | undefined): {
  template: TemplateRecord | null;
  loading: boolean;
} {
  const rev = useRevision();
  const [state, setState] = useState<{ template: TemplateRecord | null; loading: boolean }>({
    template: null,
    loading: true,
  });
  useEffect(() => {
    let alive = true;
    (id ? templateStore.get(id) : Promise.resolve(null)).then(
      (template) => alive && setState({ template, loading: false }),
    );
    return () => {
      alive = false;
    };
  }, [id, rev]);
  return state;
}

// ---------- scritture ----------

/** modello costruito dalla bozza corrente */
export function templateFromDraft(
  draft: DraftState,
  meta: { title: string; tags: string[] },
): NewTemplate {
  const { esteso, breve } = buildReportForms(toReportInput(draft));
  return {
    title: meta.title.trim(),
    modality: 'TC',
    setting: draft.config.modalita,
    examConfig: draft.config,
    findings: toTemplateFindings(draft),
    conclusioni: draft.conclusioni,
    renderedEsteso: esteso,
    renderedBreve: breve,
    tags: meta.tags,
    isFavorite: false,
    dataVersion: DATA_VERSION,
  };
}

/** avvisi su possibili dati del paziente nel modello (titolo, tag e testo generato) */
export function templateWarnings(t: NewTemplate): PrivacyWarning[] {
  return findPatientDataWarnings(
    [t.title, t.tags.join(' '), t.renderedEsteso, t.conclusioni].join('\n'),
  );
}

export function useTemplateActions() {
  const create = useCallback(async (t: NewTemplate) => {
    const rec = await templateStore.create(t);
    bump();
    return rec;
  }, []);
  const update = useCallback(async (id: string, patch: Partial<NewTemplate>) => {
    const rec = await templateStore.update(id, patch);
    bump();
    return rec;
  }, []);
  const remove = useCallback(async (id: string) => {
    await templateStore.remove(id);
    bump();
  }, []);
  return { create, update, remove };
}

/** "torace, addome , ,k colon" → ["torace", "addome", "k colon"] */
export function parseTags(text: string): string[] {
  return Array.from(
    new Set(
      text
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}
