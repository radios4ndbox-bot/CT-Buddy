/**
 * Bozza del referto in corso. Resta SOLO in memoria sul dispositivo: non viene mai
 * sincronizzata (può contenere dettagli del caso reale). Nella libreria finisce solo ciò
 * che l'utente salva esplicitamente come modello.
 */
import {
  PS_EXAMS,
  PS_FREE_ID,
  buildTecnica,
  createOrganStates,
  defaultExamConfig,
  draftConclusioni,
  emptyOrganState,
  examOrgans,
  type ExamConfig,
  type FaseMdcId,
  type OrganState,
  type OrganStates,
  type RegionKey,
  type ReportInput,
} from '@ct-buddy/core';
import { create } from 'zustand';

import type { TemplateFindings, TemplateRecord } from '@/library/types';

export interface DraftState {
  config: ExamConfig;
  organs: OrganStates;
  numericFields: Record<string, number | string>;
  compact: boolean;
  /** testo della Tecnica modificato a mano (null = generato dalla configurazione) */
  tecnicaOverride: string | null;
  conclusioni: string;
  conclusioniIncluded: boolean;
  /** modello da cui è partita la bozza, se c'è */
  sourceTemplateId: string | null;
}

interface DraftActions {
  /** cambia la configurazione; se cambia la composizione dell'esame i reperti ripartono da zero */
  setConfig(patch: Partial<ExamConfig>): void;
  selectPsExam(id: string): void;
  toggleRegion(key: RegionKey): void;
  toggleFase(id: FaseMdcId): void;
  updateOrgan(id: string, fn: (st: OrganState) => OrganState): void;
  setNumericField(id: string, value: string): void;
  setCompact(v: boolean): void;
  setTecnica(text: string | null): void;
  setConclusioni(text: string): void;
  setConclusioniIncluded(v: boolean): void;
  generateConclusioni(): void;
  reset(): void;
  loadTemplate(t: TemplateRecord): void;
}

const COMPOSITION_KEYS: (keyof ExamConfig)[] = ['sesso', 'modalita', 'regions', 'psExam'];

function initialState(): DraftState {
  const config = defaultExamConfig();
  return {
    config,
    organs: createOrganStates(examOrgans(config)),
    numericFields: {},
    compact: false,
    tecnicaOverride: null,
    conclusioni: '',
    conclusioniIncluded: false,
    sourceTemplateId: null,
  };
}

function toggle<T>(list: readonly T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export const useDraft = create<DraftState & DraftActions>()((set, get) => ({
  ...initialState(),

  setConfig(patch) {
    const prev = get().config;
    const config = { ...prev, ...patch };
    const compositionChanged = COMPOSITION_KEYS.some(
      (k) => k in patch && JSON.stringify(prev[k]) !== JSON.stringify(config[k]),
    );
    if (!compositionChanged) {
      set({ config });
      return;
    }
    set({
      config,
      organs: createOrganStates(examOrgans(config)),
      tecnicaOverride: null,
      conclusioni: '',
    });
  },

  selectPsExam(id) {
    const ps = PS_EXAMS[id];
    get().setConfig(
      id !== PS_FREE_ID && ps ? { psExam: id, mdc: ps.contrastoDefault } : { psExam: id },
    );
  },

  toggleRegion(key) {
    get().setConfig({ regions: toggle(get().config.regions, key) });
  },

  toggleFase(id) {
    get().setConfig({ fasi: toggle(get().config.fasi, id) });
  },

  updateOrgan(id, fn) {
    const organs = get().organs;
    set({ organs: { ...organs, [id]: fn(organs[id] ?? emptyOrganState()) } });
  },

  setNumericField(id, value) {
    set({ numericFields: { ...get().numericFields, [id]: value } });
  },

  setCompact: (compact) => set({ compact }),
  setTecnica: (tecnicaOverride) => set({ tecnicaOverride }),
  setConclusioni: (conclusioni) => set({ conclusioni }),
  setConclusioniIncluded: (conclusioniIncluded) => set({ conclusioniIncluded }),

  generateConclusioni() {
    const { organs, conclusioni } = get();
    set({ conclusioni: draftConclusioni(organs, conclusioni), conclusioniIncluded: true });
  },

  reset: () => set(initialState()),

  loadTemplate(t) {
    const f = t.findings;
    set({
      config: t.examConfig,
      organs: { ...createOrganStates(examOrgans(t.examConfig)), ...f.organs },
      numericFields: f.numericFields ?? {},
      compact: f.compact ?? false,
      tecnicaOverride: f.tecnicaOverride ?? null,
      conclusioni: t.conclusioni,
      conclusioniIncluded: f.conclusioniIncluded ?? !!t.conclusioni,
      sourceTemplateId: t.id,
    });
  },
}));

/** testo della Tecnica effettivo (manuale o generato) */
export function tecnicaText(s: DraftState): string {
  return s.tecnicaOverride ?? buildTecnica(s.config);
}

export function toReportInput(s: DraftState): ReportInput {
  return {
    config: s.config,
    organs: s.organs,
    numericFields: s.numericFields,
    compact: s.compact,
    tecnica: tecnicaText(s),
    conclusioni: s.conclusioniIncluded ? s.conclusioni : null,
  };
}

/** parte della bozza che finisce nel modello salvato */
export function toTemplateFindings(s: DraftState): TemplateFindings {
  return {
    organs: s.organs,
    numericFields: s.numericFields,
    compact: s.compact,
    tecnicaOverride: s.tecnicaOverride,
    conclusioniIncluded: s.conclusioniIncluded,
  };
}
