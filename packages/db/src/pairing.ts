/**
 * Codice di collegamento tra sito e telefono. Il sito lo ottiene da `create_pairing()` e lo
 * mostra come QR (URL `ctbuddy://libreria/collega?code=…`) e in chiaro (XXXX-XXXX-XXXX) per chi
 * preferisce digitarlo. Il telefono lo invia alla Edge Function `claim-pairing`.
 */

export const PAIRING_CODE_LENGTH = 12;
/** apre direttamente la schermata di collegamento dell'app (route /libreria/collega) */
export const PAIRING_URL_PREFIX = 'ctbuddy://libreria/collega?code=';

/** maiuscolo, senza spazi né trattini */
export function normalizePairingCode(code: string): string {
  return code.toUpperCase().replace(/[^0-9A-Z]/g, '');
}

export function isValidPairingCode(code: string): boolean {
  return normalizePairingCode(code).length === PAIRING_CODE_LENGTH;
}

/** "ABCDEFGHJKMN" → "ABCD-EFGH-JKMN" */
export function formatPairingCode(code: string): string {
  return (
    normalizePairingCode(code)
      .match(/.{1,4}/g)
      ?.join('-') ?? ''
  );
}

export function pairingUrl(code: string): string {
  return PAIRING_URL_PREFIX + normalizePairingCode(code);
}

/** estrae il codice dal contenuto di un QR (URL ctbuddy:// o codice nudo); null se non valido */
export function parsePairingPayload(data: string): string | null {
  const text = data.trim();
  let candidate = text;
  const m = text.match(/[?&]code=([^&#\s]+)/i);
  if (m) candidate = decodeURIComponent(m[1]!);
  else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) return null; // URL di altro tipo
  const code = normalizePairingCode(candidate);
  return code.length === PAIRING_CODE_LENGTH ? code : null;
}

export type ClaimError = 'invalid_code' | 'expired_or_used' | 'network' | 'server_error';

export function claimErrorMessage(e: ClaimError): string {
  switch (e) {
    case 'invalid_code':
      return 'Il codice non è valido. Controlla di averlo letto o digitato per intero.';
    case 'expired_or_used':
      return 'Il codice è scaduto o è già stato usato. Generane uno nuovo dal sito.';
    case 'network':
      return 'Impossibile contattare il server. Controlla la connessione e riprova.';
    default:
      return 'Errore del server durante il collegamento. Riprova tra poco.';
  }
}
