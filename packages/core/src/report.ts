import { QUESITO_PREFIX, RELATED_ORGANS } from './data/regions';
import { examLabel, reportRegions } from './exam';
import { buildTecnica } from './tecnica';
import { dashifyLines, joinItalian } from './text';
import type { ExamConfig, Organ, OrganState, OrganStates, Region, ReportInput } from './types';

// ============================================================
// Stato degli organi
// ============================================================

export function emptyOrganState(yeeted = false): OrganState {
  return { text: '', positive: false, flagged: false, isTarget: false, yeeted, wordPicks: [] };
}

/** stato iniziale per gli organi in esame; `yeetDefaults` = sezioni escluse di default dal profilo */
export function createOrganStates(
  organs: readonly Organ[],
  yeetDefaults: Iterable<string> = [],
): OrganStates {
  const yeet = new Set(yeetDefaults);
  return Object.fromEntries(organs.map((o) => [o.id, emptyOrganState(yeet.has(o.id))]));
}

/** passa a negativo: azzera testo, flag, quesito e parole scelte (come nel vecchio tool) */
export function setOrganNegative(st: OrganState): OrganState {
  return { ...st, positive: false, text: '', flagged: false, isTarget: false, wordPicks: [] };
}

/** aggiorna il testo del reperto: le parole scelte per le conclusioni ripartono da zero */
export function setOrganText(st: OrganState, text: string): OrganState {
  return { ...st, text, wordPicks: [] };
}

/** 🎯 attiva/disattiva il quesito diagnostico, aggiungendo o togliendo la frase introduttiva */
export function toggleOrganTarget(st: OrganState): OrganState {
  const isTarget = !st.isTarget;
  let text = st.text;
  if (isTarget && !text.startsWith(QUESITO_PREFIX)) text = QUESITO_PREFIX + text;
  else if (!isTarget && text.startsWith(QUESITO_PREFIX)) text = text.slice(QUESITO_PREFIX.length);
  return { ...st, isTarget, text, wordPicks: [] };
}

// ============================================================
// Composizione del testo
// ============================================================

const DEFAULT_STATE = emptyOrganState();

function stateOf(states: OrganStates, id: string): OrganState {
  return states[id] ?? DEFAULT_STATE;
}

function isPositiveWithText(st: OrganState): boolean {
  return st.positive && st.text.trim() !== '';
}

/** testo di un organo: il reperto positivo, oppure la frase negativa di default (variante senza mdc se serve) */
export function organDisplayText(
  organ: Organ,
  st: OrganState,
  config: Pick<ExamConfig, 'mdc'>,
): string {
  if (isPositiveWithText(st)) return st.text.trim();
  return config.mdc === 'no' && organ.negativeNoMdc ? organ.negativeNoMdc : organ.negative;
}

/** organi-quesito in cima alla regione, poi i correlati, poi il resto nell'ordine classico */
export function orderedOrgansForRegion(region: Region, states: OrganStates): Organ[] {
  const targetIds = region.organs.filter((o) => stateOf(states, o.id).isTarget).map((o) => o.id);
  if (!targetIds.length) return region.organs;
  const targetSet = new Set(targetIds);
  const relatedIds = new Set<string>();
  for (const id of targetIds) {
    for (const r of RELATED_ORGANS[id] ?? []) if (!targetSet.has(r)) relatedIds.add(r);
  }
  return [
    ...region.organs.filter((o) => targetSet.has(o.id)),
    ...region.organs.filter((o) => relatedIds.has(o.id)),
    ...region.organs.filter((o) => !targetSet.has(o.id) && !relatedIds.has(o.id)),
  ];
}

function compactItemText(organ: Organ, numericFields: Record<string, number | string>): string {
  const c = organ.compact!;
  if (c.detailStatic) return `${c.shortLabel} (${c.detailStatic})`;
  if (c.numericField && c.detailTemplate) {
    const val = numericFields[organ.id] ?? c.numericField.default;
    const detail = c.detailTemplate
      .replace('{value}', String(val))
      .replace('{unit}', c.numericField.unit);
    return `${c.shortLabel} (${detail})`;
  }
  return c.shortLabel;
}

/** righe (con trattino) di una regione, in forma estesa o breve */
export function buildRegionLines(
  region: Region,
  input: Pick<ReportInput, 'config' | 'organs' | 'numericFields' | 'compact'>,
): string[] {
  const { config, organs: states } = input;
  const numericFields = input.numericFields ?? {};
  const ordered = orderedOrgansForRegion(region, states);

  if (!input.compact) {
    return ordered
      .filter((o) => !stateOf(states, o.id).yeeted)
      .map((o) => '-' + organDisplayText(o, stateOf(states, o.id), config));
  }

  // referto breve: gli organi negativi vengono accorpati in un'unica riga; positivi e quesito
  // restano su righe separate in evidenza.
  const standoutLines: string[] = [];
  const negativeParts: string[] = [];
  const emittedGroups = new Set<string>();
  for (const o of ordered) {
    const st = stateOf(states, o.id);
    if (st.yeeted) continue;
    if (st.isTarget || isPositiveWithText(st)) {
      standoutLines.push('-' + organDisplayText(o, st, config));
      continue;
    }
    const group = o.compact?.group;
    if (group) {
      if (emittedGroups.has(group)) continue;
      const members = region.organs.filter((x) => {
        if (x.compact?.group !== group) return false;
        const s = stateOf(states, x.id);
        return !s.yeeted && !s.isTarget && !isPositiveWithText(s);
      });
      if (!members.length) continue;
      const items = members.map((m) => compactItemText(m, numericFields));
      negativeParts.push(
        `Non lesioni focali di significato patologico attuale a carico di: ${joinItalian(items)}.`,
      );
      emittedGroups.add(group);
      continue;
    }
    negativeParts.push(organDisplayText(o, st, config));
  }
  const lines: string[] = [];
  if (negativeParts.length) lines.push('-' + negativeParts.join(' '));
  lines.push(...standoutLines);
  return lines;
}

/** referto completo: intestazione, tecnica, sezioni per regione ed eventuali conclusioni */
export function buildReport(input: ReportInput): string {
  const parts: string[] = [];
  parts.push(examLabel(input.config).toUpperCase());
  parts.push((input.tecnica ?? buildTecnica(input.config)).trim());
  for (const region of reportRegions(input.config)) {
    const lines = buildRegionLines(region, input);
    if (!lines.length) continue; // tutti gli organi esclusi: niente intestazione vuota
    parts.push(region.title + '\n' + lines.join('\n'));
  }
  if (input.conclusioni != null) {
    const c = input.conclusioni.trim();
    parts.push('CONCLUSIONI:\n' + (c ? dashifyLines(c) : '—'));
  }
  return parts.join('\n\n');
}

/** forma estesa e breve in un colpo solo */
export function buildReportForms(input: Omit<ReportInput, 'compact'>): {
  esteso: string;
  breve: string;
} {
  return {
    esteso: buildReport({ ...input, compact: false }),
    breve: buildReport({ ...input, compact: true }),
  };
}

/**
 * Bozza delle conclusioni: una riga per ogni organo positivo con "flag it", composta solo dalle
 * parole scelte. Restituisce '' se non c'è nulla da aggiungere.
 */
export function draftConclusioni(states: OrganStates, existing = ''): string {
  const lines: string[] = [];
  for (const s of Object.values(states)) {
    if (!(s.positive && s.flagged && s.text.trim())) continue;
    if (!s.wordPicks.length) continue;
    const picks = new Set(s.wordPicks);
    const picked = s.text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .filter((_, i) => picks.has(i));
    if (picked.length) lines.push('-' + picked.join(' '));
  }
  if (!lines.length) return existing.trim();
  const draft = lines.join('\n');
  const prev = existing.trim();
  return prev ? prev + '\n' + draft : draft;
}
