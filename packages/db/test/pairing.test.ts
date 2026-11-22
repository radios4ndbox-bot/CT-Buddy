import { describe, expect, it } from 'vitest';

import { formatPairingCode, isValidPairingCode, pairingUrl, parsePairingPayload } from '../src';

describe('codice di collegamento', () => {
  const code = 'AB23CD45EF67';

  it('formato leggibile e normalizzazione', () => {
    expect(formatPairingCode(code)).toBe('AB23-CD45-EF67');
    expect(isValidPairingCode('ab23-cd45 ef67')).toBe(true);
    expect(isValidPairingCode('AB23')).toBe(false);
  });

  it('legge il QR del sito, un codice digitato o rifiuta altro', () => {
    expect(parsePairingPayload(pairingUrl(code))).toBe(code);
    expect(parsePairingPayload('ctbuddy://libreria/collega?code=ab23cd45ef67&x=1')).toBe(code);
    expect(parsePairingPayload(' ab23-cd45-ef67 ')).toBe(code);
    expect(parsePairingPayload('https://example.com/qualcosa')).toBeNull();
    expect(parsePairingPayload('ciao')).toBeNull();
  });
});
