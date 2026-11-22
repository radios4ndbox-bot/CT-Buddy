/** test unitari sul comportamento del core che il confronto con il vecchio tool non copre */
import { describe, expect, it } from 'vitest';
import {
  QUESITO_PREFIX,
  appendAcqToTecnica,
  buildReportForms,
  createOrganStates,
  defaultExamConfig,
  emptyOrganState,
  examOrgans,
  organsForRegion,
  setOrganNegative,
  toggleOrganTarget,
} from '../src';

describe('stato organo', () => {
  it('🎯 quesito: aggiunge e poi toglie la frase introduttiva', () => {
    const st = { ...emptyOrganState(), positive: true, text: 'Calcolo di 4 mm.' };
    const on = toggleOrganTarget(st);
    expect(on.isTarget).toBe(true);
    expect(on.text).toBe(QUESITO_PREFIX + 'Calcolo di 4 mm.');
    const off = toggleOrganTarget(on);
    expect(off).toEqual({ ...st, wordPicks: [] });
  });

  it('passare a negativo azzera tutto tranne lo yeet', () => {
    const st = {
      text: 'x',
      positive: true,
      flagged: true,
      isTarget: true,
      yeeted: true,
      wordPicks: [0],
    };
    expect(setOrganNegative(st)).toEqual({ ...emptyOrganState(true) });
  });

  it('yeet di default dal profilo', () => {
    const organs = examOrgans(defaultExamConfig());
    const states = createOrganStates(organs, ['tiroide', 'fegato']);
    expect(states.fegato?.yeeted).toBe(true);
    expect(states.milza?.yeeted).toBe(false);
  });
});

describe('catalogo', () => {
  it('organi pelvici dipendenti dal sesso', () => {
    const f = organsForRegion('addome_pelvi', 'F').map((o) => o.id);
    const m = organsForRegion('addome_pelvi', 'M').map((o) => o.id);
    expect(f).toContain('utero_annessi');
    expect(f).not.toContain('prostata');
    expect(m).toContain('prostata');
    expect(m).not.toContain('utero_annessi');
    expect(f.indexOf('utero_annessi')).toBe(m.indexOf('prostata'));
  });
});

describe('tecnica', () => {
  it('"La accendiamo" sostituisce il blocco precedente invece di duplicarlo', () => {
    const once = appendAcqToTecnica('Esame eseguito.', 'Venosa in Addome completo.');
    const twice = appendAcqToTecnica(once, 'Arteriosa in Torace completo.');
    expect(twice).toBe(
      'Esame eseguito.\n\nFasi di acquisizione (da Acquisizione):\nArteriosa in Torace completo.',
    );
  });
});

describe('referto', () => {
  it('forma breve più corta della estesa', () => {
    const { esteso, breve } = buildReportForms({ config: defaultExamConfig(), organs: {} });
    expect(breve.length).toBeLessThan(esteso.length);
    expect(esteso.startsWith('TC ENCEFALO-TORACE-ADDOME')).toBe(true);
  });
});
