import { PS_EXAMS, PS_FREE_ID, REGIONS, REGION_ORDER } from './data/regions';
import type { ExamConfig, Organ, Region, RegionKey, Sesso } from './types';

export interface RegionGroup extends Region {
  key: string;
}

/** organi di una regione per il sesso indicato (gli organi senza `sex` valgono per entrambi) */
export function organsForRegion(key: RegionKey, sesso: Sesso): Organ[] {
  return REGIONS[key].organs.filter((o) => !o.sex || o.sex === sesso);
}

export function isFixedPsProtocol(config: Pick<ExamConfig, 'modalita' | 'psExam'>): boolean {
  return config.modalita === 'urgenza' && config.psExam !== PS_FREE_ID && !!PS_EXAMS[config.psExam];
}

/**
 * Regioni selezionate in ordine cranio-caudale. Se ci sono sia Collo sia Torace si fondono in
 * un'unica sezione "COLLO-TORACE".
 */
export function getRegionGroups(config: Pick<ExamConfig, 'regions' | 'sesso'>): RegionGroup[] {
  const selected = new Set(config.regions);
  const both = selected.has('collo') && selected.has('torace');
  const groups: RegionGroup[] = [];
  for (const rk of REGION_ORDER) {
    if (!selected.has(rk)) continue;
    if (both && rk === 'torace') continue;
    if (both && rk === 'collo') {
      groups.push({
        key: 'collo_torace',
        title: 'COLLO-TORACE',
        organs: organsForRegion('collo', config.sesso).concat(
          organsForRegion('torace', config.sesso),
        ),
      });
      continue;
    }
    groups.push({ key: rk, title: REGIONS[rk].title, organs: organsForRegion(rk, config.sesso) });
  }
  return groups;
}

/** sezioni del referto (titolo + organi) per la configurazione corrente */
export function reportRegions(config: ExamConfig): Region[] {
  if (isFixedPsProtocol(config)) {
    const ex = PS_EXAMS[config.psExam]!;
    return [{ title: ex.title, organs: ex.organs }];
  }
  return getRegionGroups(config).map((g) => ({ title: g.title, organs: g.organs }));
}

/** elenco piatto degli organi in esame */
export function examOrgans(config: ExamConfig): Organ[] {
  return reportRegions(config).flatMap((r) => r.organs);
}

/**
 * Universo di organi per l'import da PACS: in elettiva tutti gli organi di tutte le regioni
 * (anche non selezionate), in urgenza con protocollo fisso solo quelli del protocollo.
 */
export function pacsMatchUniverse(
  config: ExamConfig,
): { organ: Organ; regionKey: RegionKey | null }[] {
  if (isFixedPsProtocol(config)) {
    return PS_EXAMS[config.psExam]!.organs.map((organ) => ({ organ, regionKey: null }));
  }
  return REGION_ORDER.flatMap((rk) =>
    organsForRegion(rk, config.sesso).map((organ) => ({ organ, regionKey: rk })),
  );
}

export function titleCaseRegion(title: string): string {
  return title
    .split('-')
    .map((w) => (w ? w[0] + w.slice(1).toLowerCase() : w))
    .join('-');
}

/** es. "TC Encefalo-Torace-Addome" oppure l'etichetta del protocollo PS */
export function examLabel(config: ExamConfig): string {
  if (isFixedPsProtocol(config)) return PS_EXAMS[config.psExam]!.label;
  const names = getRegionGroups(config).map((g) => titleCaseRegion(g.title));
  return names.length ? 'TC ' + names.join('-') : 'TC (seleziona almeno una regione)';
}
