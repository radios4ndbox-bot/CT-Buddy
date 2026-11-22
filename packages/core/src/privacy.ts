/**
 * Controllo leggero dei dati che potrebbero identificare un paziente, da fare prima di
 * salvare un modello nella libreria (che è pensata per contenere solo testo anonimo).
 * Non è una garanzia: è un promemoria che intercetta i casi più comuni.
 */

export interface PrivacyWarning {
  kind: 'codice_fiscale' | 'data' | 'nascita' | 'nominativo' | 'email' | 'telefono';
  label: string;
  match: string;
}

const RULES: { kind: PrivacyWarning['kind']; label: string; re: RegExp }[] = [
  {
    kind: 'codice_fiscale',
    label: 'Sembra un codice fiscale',
    re: /\b[A-Z]{6}\d{2}[A-EHLMPR-T]\d{2}[A-Z]\d{3}[A-Z]\b/gi,
  },
  {
    kind: 'nascita',
    label: 'Riferimento alla data o al luogo di nascita',
    re: /\bnat[oa]\s+(?:il|a|nel)\b[^.\n]{0,30}/gi,
  },
  {
    kind: 'nominativo',
    label: 'Sembra un nominativo',
    re: /\b(?:[Ss]ig\.?(?:ra|na)?|[Ss]ignor[ae]?|[Pp]aziente)\s+[A-Z][a-zà-ù]+(?:\s+[A-Z][a-zà-ù]+)?/g,
  },
  {
    kind: 'data',
    label: 'Data specifica (es. data di nascita o di un esame precedente)',
    re: /\b\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2})\b/g,
  },
  { kind: 'email', label: 'Indirizzo email', re: /\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g },
  {
    kind: 'telefono',
    label: 'Numero di telefono',
    re: /(?:\+39\s?)?\b3\d{2}[\s.-]?\d{6,7}\b/g,
  },
];

/** avvisi su possibili dati identificativi presenti nel testo (vuoto se non trova nulla) */
export function findPatientDataWarnings(text: string): PrivacyWarning[] {
  const out: PrivacyWarning[] = [];
  const seen = new Set<string>();
  for (const rule of RULES) {
    for (const m of text.matchAll(rule.re)) {
      const key = rule.kind + ':' + m[0];
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ kind: rule.kind, label: rule.label, match: m[0].trim() });
    }
  }
  return out;
}
