#!/usr/bin/env node
/**
 * Estrae i dati clinici dal vecchio CT-Assistant (legacy/ct-assistant.html) e li scrive come
 * moduli TypeScript in packages/core/src/data/. Così il porting dei dati è riproducibile e
 * non c'è il rischio di errori di ricopiatura a mano.
 *
 * Uso: node tools/extract-legacy-data.mjs
 *
 * Il blocco di dati del vecchio script (da `const REGIONS` fino a "STATO APPLICAZIONE")
 * viene eseguito in una sandbox `vm` con un localStorage finto, poi le costanti vengono
 * serializzate. Le regioni che dipendono dal sesso (organs(sesso)) vengono appiattite in
 * una lista unica dove gli organi specifici hanno `sex: 'F' | 'M'`.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'legacy/ct-assistant.html'), 'utf8').replace(/\r\n/g, '\n');
const outDir = join(root, 'packages/core/src/data');
mkdirSync(outDir, { recursive: true });

const start = html.indexOf('const REGIONS = {');
const end = html.indexOf('// STATO APPLICAZIONE');
if (start < 0 || end < 0) throw new Error('Marcatori non trovati in legacy/ct-assistant.html');
const block = html.slice(start, end);

const names = [
  'REGIONS',
  'REGION_ORDER',
  'PS_FREE_ID',
  'PS_EXAMS',
  'PS_PROTOCOL_TECNICA',
  'DISTRICTS_ACQ',
  'FASI_ACQ',
  'PROTOCOL_LIBRARY',
  'ACQ_DISTRICT_BUCKET',
  'ACQ_CATEGORY_BUCKETS',
  'ACQ_VARIANT_LABELS',
  'ORDINE_MENTALE_PRINCIPLES',
  'ORDINE_MENTALE_TIPS',
  'ORDINE_MENTALE_PS_NOTES',
  'ORGAN_KEYWORDS',
  'MATCH_STOPWORDS',
  'AGENTI_MDC_CONCENTRAZIONI',
  'FLUSSI_MDC',
  'FASI_MDC',
];

const fakeStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const sandbox = { localStorage: fakeStorage, console };
vm.createContext(sandbox);
const data = vm.runInContext(`${block}\n;({ ${names.join(', ')} })`, sandbox);

// RELATED_ORGANS e QUESITO_PREFIX stanno fuori dal blocco principale
function extractConst(name) {
  const re = new RegExp(`const ${name} = ([\\s\\S]*?);\\n`, 'm');
  const m = html.match(re);
  if (!m) throw new Error(`Costante ${name} non trovata`);
  return vm.runInNewContext(`(${m[1]})`);
}
data.RELATED_ORGANS = extractConst('RELATED_ORGANS');
data.QUESITO_PREFIX = extractConst('QUESITO_PREFIX');

// ---------- serializzatore in letterale TS (gestisce RegExp e Set) ----------
const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
function ser(v, ind = '') {
  const next = ind + '  ';
  if (v instanceof RegExp || Object.prototype.toString.call(v) === '[object RegExp]')
    return String(v);
  if (v instanceof Set || Object.prototype.toString.call(v) === '[object Set]')
    return ser(Array.from(v), ind);
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    const flat = v.every((x) => typeof x !== 'object' || x === null);
    if (flat) {
      const one = `[${v.map((x) => ser(x)).join(', ')}]`;
      if (one.length + ind.length < 100) return one;
    }
    return `[\n${v.map((x) => next + ser(x, next)).join(',\n')},\n${ind}]`;
  }
  if (v && typeof v === 'object') {
    const keys = Object.keys(v);
    if (!keys.length) return '{}';
    return `{\n${keys
      .map((k) => `${next}${IDENT.test(k) ? k : JSON.stringify(k)}: ${ser(v[k], next)}`)
      .join(',\n')},\n${ind}}`;
  }
  if (typeof v === 'string')
    return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
  return JSON.stringify(v);
}

// ---------- appiattimento delle regioni (organs(sesso) → lista con `sex`) ----------
function flattenRegion(region) {
  const f = region.organs('F');
  const m = region.organs('M');
  const fIds = new Set(f.map((o) => o.id));
  const mIds = new Set(m.map((o) => o.id));
  const out = [];
  // unione che preserva l'ordine: gli organi esclusivi di un sesso stanno nella stessa posizione
  let i = 0;
  let j = 0;
  while (i < f.length || j < m.length) {
    const a = f[i];
    const b = m[j];
    if (a && b && a.id === b.id) {
      out.push(a);
      i++;
      j++;
    } else if (a && !mIds.has(a.id)) {
      out.push({ ...a, sex: 'F' });
      i++;
    } else if (b && !fIds.has(b.id)) {
      out.push({ ...b, sex: 'M' });
      j++;
    } else {
      throw new Error(`Ordine organi incoerente tra F e M nella regione ${region.title}`);
    }
  }
  return out;
}
const regions = {};
for (const [key, r] of Object.entries(data.REGIONS)) {
  regions[key] = { title: r.title, organs: flattenRegion(r) };
}

const HEADER =
  '// ⚠️ File generato da tools/extract-legacy-data.mjs a partire da legacy/ct-assistant.html.\n' +
  '// Modifiche manuali sono ammesse dopo il porting, ma documentale nel commit.\n';

function write(file, imports, body) {
  writeFileSync(join(outDir, file), `${HEADER}${imports ? imports + '\n' : ''}\n${body}\n`);
  console.log('scritto', file);
}

write(
  'regions.ts',
  "import type { Organ, PsExam, RegionKey } from '../types';",
  [
    `export const REGIONS: Record<RegionKey, { title: string; organs: Organ[] }> = ${ser(regions)};`,
    `export const REGION_ORDER: RegionKey[] = ${ser(data.REGION_ORDER)};`,
    `export const PS_FREE_ID = ${ser(data.PS_FREE_ID)};`,
    `export const PS_EXAMS: Record<string, PsExam> = ${ser(data.PS_EXAMS)};`,
    `export const PS_PROTOCOL_TECNICA: Record<string, string> = ${ser(data.PS_PROTOCOL_TECNICA)};`,
    `export const RELATED_ORGANS: Record<string, string[]> = ${ser(data.RELATED_ORGANS)};`,
    `export const QUESITO_PREFIX = ${ser(data.QUESITO_PREFIX)};`,
  ].join('\n\n'),
);

write(
  'mdc.ts',
  "import type { FaseMdc } from '../types';",
  [
    `export const AGENTI_MDC_CONCENTRAZIONI: Record<string, number[]> = ${ser(data.AGENTI_MDC_CONCENTRAZIONI)};`,
    `export const AGENTI_MDC = Object.keys(AGENTI_MDC_CONCENTRAZIONI);`,
    `export const FLUSSI_MDC: number[] = ${ser(data.FLUSSI_MDC)};`,
    `export const FASI_MDC: FaseMdc[] = ${ser(data.FASI_MDC)};`,
  ].join('\n\n'),
);

write(
  'acquisizione.ts',
  "import type { AcqDistrict, AcqFase, ProtocolRule } from '../types';",
  [
    `export const DISTRICTS_ACQ: AcqDistrict[] = ${ser(data.DISTRICTS_ACQ)};`,
    `export const FASI_ACQ: AcqFase[] = ${ser(data.FASI_ACQ)};`,
    `export const PROTOCOL_LIBRARY: ProtocolRule[] = ${ser(data.PROTOCOL_LIBRARY)};`,
    `export const ACQ_DISTRICT_BUCKET: Record<string, string> = ${ser(data.ACQ_DISTRICT_BUCKET)};`,
    `export const ACQ_CATEGORY_BUCKETS: { id: string; label: string }[] = ${ser(data.ACQ_CATEGORY_BUCKETS)};`,
    `export const ACQ_VARIANT_LABELS: Record<string, string> = ${ser(data.ACQ_VARIANT_LABELS)};`,
  ].join('\n\n'),
);

write(
  'keywords.ts',
  '',
  [
    `export const ORGAN_KEYWORDS: Record<string, (string | RegExp)[]> = ${ser(data.ORGAN_KEYWORDS)};`,
    `export const MATCH_STOPWORDS = new Set<string>(${ser(data.MATCH_STOPWORDS)});`,
  ].join('\n\n'),
);

write(
  'ordine-mentale.ts',
  '',
  [
    `export const ORDINE_MENTALE_PRINCIPLES: string[] = ${ser(data.ORDINE_MENTALE_PRINCIPLES)};`,
    `export const ORDINE_MENTALE_TIPS: Record<string, string> = ${ser(data.ORDINE_MENTALE_TIPS)};`,
    `export const ORDINE_MENTALE_PS_NOTES: Record<string, string> = ${ser(data.ORDINE_MENTALE_PS_NOTES)};`,
  ].join('\n\n'),
);
