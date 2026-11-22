/**
 * Test di non-regressione: il nuovo core deve produrre ESATTAMENTE lo stesso testo del vecchio
 * CT-Assistant (legacy/ct-assistant.html), eseguito in jsdom, su centinaia di scenari casuali
 * riproducibili più alcuni casi scelti a mano.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import {
  ORGAN_KEYWORDS,
  PROTOCOL_LIBRARY,
  PS_EXAMS,
  REGIONS,
  buildAcqBreve,
  matchOrganCandidates,
  buildReport,
  classifyPacsChunk,
  defaultExamConfig,
  draftConclusioni,
  emptyAcqState,
  mergeRuleIntoAcq,
  pacsMatchUniverse,
  searchRules,
  splitPastedText,
  suggestProtocols,
  type ReportInput,
} from '../src';
import { loadLegacy, type Legacy } from './legacy-harness';
import { randomScenario, rng } from './scenarios';

let legacy: Legacy;
beforeAll(() => {
  legacy = loadLegacy();
});

describe('referto: parità con il vecchio tool', () => {
  it('configurazione di default', () => {
    const input: ReportInput = { config: defaultExamConfig(), organs: {} };
    expect(buildReport(input)).toBe(legacy.report(input));
  });

  it('COLLO-TORACE fusi, uomo, senza mdc, confronto', () => {
    const input: ReportInput = {
      config: {
        ...defaultExamConfig(),
        sesso: 'M',
        mdc: 'no',
        regions: ['torace', 'collo', 'addome_pelvi'],
        confronto: { gg: 3, mm: 9, aaaa: 2025 },
      },
      organs: {},
      compact: true,
      conclusioni: 'Quadro stabile',
    };
    expect(buildReport(input)).toBe(legacy.report(input));
  });

  it('500 scenari casuali (esteso e breve, PS e elettiva)', () => {
    for (let seed = 1; seed <= 500; seed++) {
      const input = randomScenario(seed);
      const expected = legacy.report(input);
      const actual = buildReport(input);
      if (actual !== expected) {
        // messaggio leggibile con il seed per riprodurre il caso
        expect({ seed, actual }).toEqual({ seed, actual: expected });
      }
    }
  });

  it('bozza delle conclusioni', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { organs } = randomScenario(seed);
      expect(draftConclusioni(organs), `seed ${seed}`).toBe(legacy.draftConclusioni(organs));
    }
  });
});

describe('import PACS: parità', () => {
  const SAMPLES = [
    'Lesione focale di 15mm sospetta al VII segmento epatico.\nColecisti litiasica con multipli calcoli calcifici endoluminali.',
    '- Nodulo di c.a. 8 mm al lobo superiore destro. Versamento pleurico bilaterale.\n\n- Ernia discale L4-L5',
    'frattura somatica di C5. ateromasia aorto-bisiliaca. linfonodi ilari aumentati. milza aumentata di volume',
    'Ipodensità della sostanza bianca periventricolare. Tiroide con noduli. Diverticolosi del sigma. Prostata ingrandita.',
    'nulla di rilevante',
  ];

  it('divisione in frasi', () => {
    for (const s of SAMPLES) {
      expect(splitPastedText(s)).toEqual(legacy.run('return splitPastedText(input)', s));
    }
  });

  it('riconoscimento organo su tutte le frasi del catalogo, elettiva e protocolli PS', () => {
    // corpus: esempi a mano + tutte le frasi (negative ed esempi) di tutti gli organi +
    // coppie casuali di parole chiave di organi diversi, per esercitare i casi ambigui
    const allOrgans = [
      ...Object.values(REGIONS).flatMap((r) => r.organs),
      ...Object.values(PS_EXAMS).flatMap((e) => e.organs),
    ];
    const catalogText = allOrgans.flatMap((o) =>
      [o.negative, o.negativeNoMdc, o.example, ...(o.examples ?? []).map((e) => e.text)].filter(
        (t): t is string => !!t,
      ),
    );
    const stringKws = Object.values(ORGAN_KEYWORDS).map((l) =>
      l.filter((k): k is string => typeof k === 'string'),
    );
    const r = rng(42);
    const pairs = Array.from(
      { length: 150 },
      () => `${r.pick(r.pick(stringKws))} con ${r.pick(r.pick(stringKws))}`,
    );
    const chunks = [...SAMPLES, ...catalogText].flatMap(splitPastedText).concat(pairs);

    const configs = [
      defaultExamConfig(),
      { ...defaultExamConfig(), sesso: 'M' as const },
      ...Object.keys(PS_EXAMS).map((psExam) => ({
        ...defaultExamConfig(),
        modalita: 'urgenza' as const,
        psExam,
      })),
    ];
    for (const config of configs) {
      const organs = pacsMatchUniverse(config).map((u) => u.organ);
      const expected = legacy.run<unknown[]>(
        `state.sesso = input.config.sesso; state.modalita = input.config.modalita;
         state.psExam = input.config.psExam;
         const organs = pacsMatchUniverse().map(u => u.organ);
         return input.chunks.map(c => ({
           cls: classifyPacsChunk(c, organs),
           cand: matchOrganCandidates(c, organs).map(x => [x.organ.id, x.score]),
         }));`,
        { config, chunks },
      );
      chunks.forEach((c, i) => {
        const actual = {
          cls: classifyPacsChunk(c, organs),
          cand: matchOrganCandidates(c, organs).map((x) => [x.organ.id, x.score]),
        };
        expect(actual, `${config.psExam} · ${c}`).toEqual(expected[i]);
      });
    }
  });

  it('il corpus contiene casi ambigui e casi sicuri', () => {
    const organs = pacsMatchUniverse(defaultExamConfig()).map((u) => u.organ);
    const results = Object.values(REGIONS)
      .flatMap((reg) => reg.organs.map((o) => o.negative))
      .map((t) => classifyPacsChunk(t, organs));
    expect(results.some((x) => x.ambiguousIds.length > 1)).toBe(true);
    expect(results.some((x) => x.organId)).toBe(true);
  });
});

describe('acquisizione: parità', () => {
  const QUESITI = [
    'sospetta embolia polmonare',
    'colica renale con ematuria',
    'trauma cranico dopo caduta, gcs 14',
    'stadiazione oncologica k polmone',
    'dolore addominale acuto',
    'xyz',
    '',
  ];

  it('suggerimenti dal quesito clinico', () => {
    for (const q of QUESITI) {
      const expected = legacy.run<{ id: string; hits: number }[]>(
        'return matchProtocolSuggestions(input).map(s => ({ id: s.rule.id, hits: s.hits }))',
        q,
      );
      expect(
        suggestProtocols(q).map((s) => ({ id: s.rule.id, hits: s.hits })),
        q,
      ).toEqual(expected);
    }
  });

  it('ricerca patologie', () => {
    for (const q of ['litiasi', 'embolia', 'cirrosi', 'trauma', 'k', 'aorta']) {
      const expected = legacy.run<string[]>('return searchPatologie(input).map(r => r.id)', q);
      expect(
        searchRules(q).map((r) => r.id),
        q,
      ).toEqual(expected);
    }
  });

  it('griglia + formato breve con regole sommate e filtro distretti', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const r = rng(seed);
      const ruleIds = r.subset(
        PROTOCOL_LIBRARY.map((p) => p.id),
        0.15,
      );
      const filter = r.chance(0.4) ? r.subset(['enc', 'torace', 'addome', 'collo'], 0.5) : [];

      let acq = { ...emptyAcqState(), selectedDistricts: filter };
      for (const id of ruleIds)
        acq = mergeRuleIntoAcq(
          acq,
          PROTOCOL_LIBRARY.find((p) => p.id === id)!,
        );

      const expected = legacy.run<string>(
        `resetAcq();
         input.filter.forEach(d => state.acq.selectedDistricts.add(d));
         input.ruleIds.forEach(id => applyPatologia(PROTOCOL_LIBRARY.find(p => p.id === id)));
         return buildAcqBreveText();`,
        { ruleIds, filter },
      );
      expect(buildAcqBreve(acq), `seed ${seed}`).toBe(expected);
    }
  });
});
