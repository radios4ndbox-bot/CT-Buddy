import { MATCH_STOPWORDS, ORGAN_KEYWORDS } from './data/keywords';
import type { LearnedKeywords, Organ } from './types';

/** minuscolo e senza accenti, per confronti tolleranti */
export function normalizeForMatch(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** parole significative dell'etichetta, usate quando un organo non ha parole chiave dedicate */
export function organFallbackKeywords(organ: Organ): string[] {
  return normalizeForMatch(organ.label)
    .replace(/[()]/g, ' ')
    .split(/[\s,/]+/)
    .filter((w) => w.length >= 4 && !MATCH_STOPWORDS.has(w));
}

export interface OrganCandidate {
  organ: Organ;
  score: number;
}

/**
 * Organi le cui parole chiave compaiono nella frase, con un punteggio di specificità (frasi
 * chiave più lunghe = punteggio più alto), ordinati dal più plausibile.
 */
export function matchOrganCandidates(
  chunk: string,
  organs: readonly Organ[],
  learned: LearnedKeywords = {},
): OrganCandidate[] {
  const norm = normalizeForMatch(chunk);
  const scored: OrganCandidate[] = [];
  for (const o of organs) {
    let score = 0;
    const kws: (string | RegExp)[] = [...(ORGAN_KEYWORDS[o.id] ?? []), ...(learned[o.id] ?? [])];
    for (const kw of kws) {
      if (kw instanceof RegExp) {
        if (kw.test(norm)) score = Math.max(score, 220);
        continue;
      }
      const nk = normalizeForMatch(kw);
      if (norm.includes(nk)) score = Math.max(score, nk.length * 10);
    }
    for (const w of organFallbackKeywords(o)) {
      if (norm.includes(w)) score = Math.max(score, w.length);
    }
    if (score > 0) scored.push({ organ: o, score });
  }
  // sort stabile: a parità di punteggio resta l'ordine degli organi
  scored.sort((a, b) => b.score - a.score);
  return scored;
}

export interface PacsClassification {
  /** organo assegnato con sicurezza, oppure null */
  organId: string | null;
  /** candidati con punteggio vicino, tra cui l'utente deve scegliere */
  ambiguousIds: string[];
}

export function classifyPacsChunk(
  chunk: string,
  organs: readonly Organ[],
  learned: LearnedKeywords = {},
): PacsClassification {
  const candidates = matchOrganCandidates(chunk, organs, learned).filter((c) => c.score >= 4);
  if (!candidates.length) return { organId: null, ambiguousIds: [] };
  if (candidates.length === 1) return { organId: candidates[0]!.organ.id, ambiguousIds: [] };
  const top = candidates[0]!.score;
  const close = candidates.filter((c) => c.score >= top * 0.7);
  if (close.length > 1) return { organId: null, ambiguousIds: close.map((c) => c.organ.id) };
  return { organId: candidates[0]!.organ.id, ambiguousIds: [] };
}

// abbreviazioni con il punto che non devono spezzare la frase (es. "c.a." = circa)
const ABBREV_PATTERNS = [/\bc\.a\./gi];
const DOT_PLACEHOLDER = '\u0001';

function protectAbbreviations(text: string): string {
  let out = text;
  for (const re of ABBREV_PATTERNS) out = out.replace(re, (m) => m.replace(/\./g, DOT_PLACEHOLDER));
  return out;
}

/** divide il testo incollato dal PACS in frasi (una per reperto) */
export function splitPastedText(raw: string): string[] {
  const chunks: string[] = [];
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim().replace(/^-+\s*/, ''))
    .filter(Boolean);
  for (const line of lines) {
    protectAbbreviations(line)
      .split(/\.\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((s) => chunks.push(s.split(DOT_PLACEHOLDER).join('.')));
  }
  return chunks;
}

/** parola chiave riusabile da un testo (prima clausola, max 60 caratteri) */
export function deriveLearnableKeyword(text: string): string {
  return normalizeForMatch(text || '')
    .split(/[,.;]/)[0]!
    .trim()
    .slice(0, 60);
}
