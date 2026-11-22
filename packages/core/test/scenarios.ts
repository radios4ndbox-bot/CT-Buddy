/** generatore deterministico di scenari casuali per i test differenziali */
import {
  AGENTI_MDC_CONCENTRAZIONI,
  FASI_MDC,
  FLUSSI_MDC,
  PS_EXAMS,
  PS_FREE_ID,
  REGION_ORDER,
  examOrgans,
  toggleOrganTarget,
  type ExamConfig,
  type OrganStates,
  type ReportInput,
} from '../src';

/** mulberry32: PRNG piccolo e riproducibile */
export function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    chance: (p: number) => next() < p,
    pick: <T>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)]!,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    subset: <T>(arr: readonly T[], p = 0.5): T[] => arr.filter(() => next() < p),
  };
}

const FREE_TEXTS = [
  'Lesione focale di 15mm sospetta al VII segmento epatico.',
  'Nodulo solido di 8 mm al lobo superiore destro, da monitorare.',
  'Falda di versamento pleurico a sinistra.',
  '   Reperto con spazi iniziali e finali.   ',
  'Riga uno\nriga due del reperto',
  '',
];

export function randomScenario(seed: number): ReportInput {
  const r = rng(seed);
  const agente = r.pick(Object.keys(AGENTI_MDC_CONCENTRAZIONI));
  const urgenza = r.chance(0.4);
  const psIds = Object.keys(PS_EXAMS);
  const config: ExamConfig = {
    sesso: r.pick(['F', 'M'] as const),
    modalita: urgenza ? 'urgenza' : 'elettiva',
    mdc: r.chance(0.7) ? 'si' : 'no',
    agente,
    concentrazione: r.pick(AGENTI_MDC_CONCENTRAZIONI[agente]!),
    quantita: r.int(0, 30) * 5,
    flusso: r.pick(FLUSSI_MDC),
    fasi: r.subset(FASI_MDC.map((f) => f.id)),
    confronto: r.chance(0.3)
      ? { gg: r.int(1, 31), mm: r.int(1, 12), aaaa: r.int(2015, 2026) }
      : null,
    regions: r.subset(REGION_ORDER, 0.55),
    psExam: urgenza && r.chance(0.7) ? r.pick(psIds) : PS_FREE_ID,
    tecnicaModalita: r.chance(0.5) ? 'generale' : 'specifica',
  };

  const organs: OrganStates = {};
  for (const o of examOrgans(config)) {
    const examples = [...(o.examples?.map((e) => e.text) ?? []), ...(o.example ? [o.example] : [])];
    let st = {
      text: '',
      positive: false,
      flagged: false,
      isTarget: false,
      yeeted: r.chance(0.12),
      wordPicks: [] as number[],
    };
    if (r.chance(0.3)) {
      st.positive = true;
      st.text = examples.length && r.chance(0.6) ? r.pick(examples) : r.pick(FREE_TEXTS);
      if (r.chance(0.3)) st = toggleOrganTarget(st);
      if (r.chance(0.4)) {
        st.flagged = true;
        const n = st.text.trim().split(/\s+/).filter(Boolean).length;
        st.wordPicks = Array.from({ length: n }, (_, i) => i).filter(() => r.chance(0.4));
      }
    }
    organs[o.id] = st;
  }

  const numericFields: Record<string, number | string> = {};
  if (r.chance(0.5)) numericFields.milza = r.pick([8, 10.5, 13, '12']);

  return {
    config,
    organs,
    numericFields,
    compact: r.chance(0.5),
    tecnica: r.chance(0.15) ? '  Tecnica scritta a mano.  ' : undefined,
    conclusioni: r.chance(0.3)
      ? r.pick(['', 'Quadro nei limiti.', 'Prima riga\n-seconda riga\n\n terza '])
      : null,
  };
}
