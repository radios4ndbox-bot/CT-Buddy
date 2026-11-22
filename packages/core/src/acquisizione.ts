import {
  ACQ_DISTRICT_BUCKET,
  DISTRICTS_ACQ,
  FASI_ACQ,
  PROTOCOL_LIBRARY,
} from './data/acquisizione';
import { joinItalian } from './text';
import type { AcqMatrix, AcqMinuti, FaseAcqId, LearnedKeywords, ProtocolRule } from './types';

export const DEFAULT_ACQ_MINUTI: AcqMinuti = { tardiva: 5, urografica: 10 };

/** stato della vista Acquisizione (serializzabile) */
export interface AcqState {
  matrix: AcqMatrix;
  minuti: AcqMinuti;
  /** "sezioni corporee" selezionate: filtro opzionale quando si somma una regola */
  selectedDistricts: string[];
  /** patologie già applicate (id regola) */
  selectedPatologie: string[];
}

export function emptyAcqState(): AcqState {
  return {
    matrix: {},
    minuti: { ...DEFAULT_ACQ_MINUTI },
    selectedDistricts: [],
    selectedPatologie: [],
  };
}

export function districtLabel(id: string): string {
  return DISTRICTS_ACQ.find((d) => d.id === id)?.label ?? id;
}

export function faseAcqLabel(id: string): string {
  return FASI_ACQ.find((f) => f.id === id)?.label ?? id;
}

// ============================================================
// Regole (libreria built-in + protocolli appresi con "Ricordami")
// ============================================================

/** protocollo salvato dall'utente con "Ricordami" */
export interface LearnedRule {
  id: string;
  label: string;
  keywords?: string[];
  matrix: AcqMatrix;
  minuti?: AcqMinuti;
  mdcNote?: 'si' | 'no';
  /** timestamp ms */
  savedAt: number;
  groupLabel?: string | null;
  variant?: 'primo' | 'controllo' | null;
}

export function learnedRuleToLibraryShape(entry: LearnedRule): ProtocolRule {
  return {
    id: entry.id,
    label: entry.label,
    keywords: entry.keywords ?? [],
    matrix: entry.matrix,
    minuti: entry.minuti,
    mdcNote: entry.mdcNote,
    note:
      'Appreso il ' +
      new Date(entry.savedAt).toLocaleDateString('it-IT') +
      ' da un tuo salvataggio ("Ricordami").',
    learned: true,
    groupLabel: entry.groupLabel ?? null,
    variant: entry.variant ?? null,
  };
}

export function allRules(learned: readonly LearnedRule[] = []): ProtocolRule[] {
  return PROTOCOL_LIBRARY.concat(learned.map(learnedRuleToLibraryShape));
}

export function ruleAllKeywords(
  rule: ProtocolRule,
  learnedKeywords: LearnedKeywords = {},
): string[] {
  return (rule.keywords ?? []).concat(learnedKeywords[rule.id] ?? []);
}

export function ruleDistrictIds(rule: Pick<ProtocolRule, 'matrix'>): string[] {
  const ids = new Set<string>();
  for (const districts of Object.values(rule.matrix ?? {})) districts?.forEach((d) => ids.add(d));
  return Array.from(ids);
}

export function ruleCategory(rule: ProtocolRule): string {
  const buckets = new Set(ruleDistrictIds(rule).map((d) => ACQ_DISTRICT_BUCKET[d] ?? 'multi'));
  return buckets.size === 1 ? Array.from(buckets)[0]! : 'multi';
}

export function ruleDistrettoLabel(rule: ProtocolRule): string {
  const ids = ruleDistrictIds(rule);
  if (ids.length === 1) return districtLabel(ids[0]!);
  return ids.length > 1 ? 'Multi-distretto' : '—';
}

export function ruleTipoEsameLabel(rule: ProtocolRule): string {
  const fasi = Object.entries(rule.matrix ?? {}).filter(([, d]) => d && d.length);
  if (fasi.length === 1 && fasi[0]![0] === 'basale') return 'Senza mezzo di contrasto';
  return 'Con mezzo di contrasto';
}

// ============================================================
// Riconoscimento dal quesito clinico e ricerca
// ============================================================

export interface ProtocolMatch {
  rule: ProtocolRule;
  hits: number;
}

export interface RuleSources {
  learnedRules?: readonly LearnedRule[];
  learnedKeywords?: LearnedKeywords;
}

/** regole con almeno una parola chiave nel quesito, ordinate per numero di corrispondenze (max 4) */
export function suggestProtocols(quesito: string, sources: RuleSources = {}): ProtocolMatch[] {
  const text = (quesito || '').toLowerCase().trim();
  if (!text) return [];
  return allRules(sources.learnedRules)
    .map((rule) => ({
      rule,
      hits: ruleAllKeywords(rule, sources.learnedKeywords).filter((k) => text.includes(k)).length,
    }))
    .filter((s) => s.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 4);
}

/** ricerca testuale tra le patologie (etichetta o parole chiave, max 8) */
export function searchRules(query: string, sources: RuleSources = {}): ProtocolRule[] {
  const text = (query || '').toLowerCase().trim();
  if (!text) return [];
  return allRules(sources.learnedRules)
    .filter(
      (r) =>
        r.label.toLowerCase().includes(text) ||
        ruleAllKeywords(r, sources.learnedKeywords).some(
          (k) => k.includes(text) || text.includes(k),
        ),
    )
    .slice(0, 8);
}

export interface AcqMatchGroup {
  key: string;
  label: string;
  variants: ProtocolMatch[];
}

/** raggruppa le varianti (primo esame / controllo) che condividono lo stesso groupLabel */
export function groupProtocolMatches(matches: readonly ProtocolMatch[]): AcqMatchGroup[] {
  const groups: AcqMatchGroup[] = [];
  const byKey = new Map<string, AcqMatchGroup>();
  for (const m of matches) {
    const key = m.rule.groupLabel || m.rule.id;
    let g = byKey.get(key);
    if (!g) {
      g = { key, label: m.rule.groupLabel || m.rule.label, variants: [] };
      byKey.set(key, g);
      groups.push(g);
    }
    g.variants.push(m);
  }
  groups.forEach((g) => g.variants.sort((a, b) => b.hits - a.hits));
  return groups;
}

/** indice della variante che copre meglio le sezioni corporee già selezionate */
export function pickBestVariant(
  group: AcqMatchGroup,
  selectedDistricts: readonly string[],
): number {
  if (!selectedDistricts.length) return 0;
  const chips = new Set(selectedDistricts);
  let bestIdx = 0;
  let bestScore = -1;
  group.variants.forEach((v, i) => {
    const districts = ruleDistrictIds(v.rule);
    if (!districts.length) return;
    const overlap = districts.filter((d) => chips.has(d)).length;
    const score = overlap - (districts.length - overlap) * 0.5;
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  });
  return bestScore > 0 ? bestIdx : 0;
}

// ============================================================
// Griglia distretto × fase
// ============================================================

/**
 * Somma una regola alla griglia. Se ci sono sezioni corporee selezionate, aggiunge solo quei
 * distretti; i distretti aggiunti diventano a loro volta selezionati.
 */
export function mergeRuleIntoAcq(state: AcqState, rule: ProtocolRule): AcqState {
  const filter = new Set(state.selectedDistricts);
  const useFilter = filter.size > 0;
  const selected = [...state.selectedDistricts];
  const matrix: AcqMatrix = {};
  for (const [k, v] of Object.entries(state.matrix)) matrix[k as FaseAcqId] = [...(v ?? [])];

  for (const [faseId, districts] of Object.entries(rule.matrix) as [FaseAcqId, string[]][]) {
    const cell = (matrix[faseId] ??= []);
    for (const d of districts) {
      if (useFilter && !filter.has(d)) continue;
      if (!cell.includes(d)) cell.push(d);
      if (!selected.includes(d)) selected.push(d);
    }
  }
  return {
    matrix,
    minuti: { ...state.minuti, ...(rule.minuti ?? {}) },
    selectedDistricts: selected,
    selectedPatologie: state.selectedPatologie.includes(rule.id)
      ? state.selectedPatologie
      : [...state.selectedPatologie, rule.id],
  };
}

/** accende/spegne una singola cella della griglia */
export function toggleAcqCell(state: AcqState, faseId: FaseAcqId, districtId: string): AcqState {
  const cell = state.matrix[faseId] ?? [];
  const next = cell.includes(districtId)
    ? cell.filter((d) => d !== districtId)
    : [...cell, districtId];
  return { ...state, matrix: { ...state.matrix, [faseId]: next } };
}

/** formato breve: una riga per fase, distretti in ordine canonico, es. "Venosa in Torace completo e Addome completo." */
export function buildAcqBreve(state: Pick<AcqState, 'matrix' | 'minuti'>): string {
  const lines: string[] = [];
  for (const f of FASI_ACQ) {
    const cell = state.matrix[f.id];
    if (!cell || !cell.length) continue;
    const set = new Set(cell);
    const districts = DISTRICTS_ACQ.filter((d) => set.has(d.id)).map((d) => d.label);
    let line = f.label + ' in ' + joinItalian(districts);
    if (f.hasMinuti) line += ' a ' + (state.minuti[f.id] ?? f.minutiDefault) + ' minuti';
    lines.push(line + '.');
  }
  return lines.join('\n');
}
