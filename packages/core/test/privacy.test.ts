import { describe, expect, it } from 'vitest';
import { buildReport, defaultExamConfig, findPatientDataWarnings } from '../src';

const kinds = (t: string) => findPatientDataWarnings(t).map((w) => w.kind);

describe('controllo dati del paziente', () => {
  it('nessun avviso su un referto standard', () => {
    expect(
      findPatientDataWarnings(buildReport({ config: defaultExamConfig(), organs: {} })),
    ).toEqual([]);
  });

  it('nessun falso positivo su misure e livelli vertebrali', () => {
    expect(kinds('Lesione di 12 x 8 mm al VII segmento. Ernia L4-L5. DCC 10.5 cm.')).toEqual([]);
  });

  it('riconosce codice fiscale, nascita, nominativo, data, email, telefono', () => {
    expect(kinds('CF RSSMRA80A01H501U')).toEqual(['codice_fiscale']);
    expect(kinds('paziente nato il 3 marzo')).toContain('nascita');
    expect(kinds('Sig.ra Bianchi Maria')).toEqual(['nominativo']);
    expect(kinds('Confronto con precedente TC del 03/09/2025.')).toEqual(['data']);
    expect(kinds('scrivere a mario.rossi@example.com')).toEqual(['email']);
    expect(kinds('tel. 333 1234567')).toEqual(['telefono']);
  });
});
