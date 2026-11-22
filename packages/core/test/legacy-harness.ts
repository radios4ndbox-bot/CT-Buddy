/**
 * Carica il vecchio CT-Assistant (legacy/ct-assistant.html) in jsdom e ne espone le funzioni,
 * così i test possono confrontare il nuovo core con il comportamento originale.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM, VirtualConsole } from 'jsdom';
import type { OrganStates, ReportInput } from '../src';

const LEGACY_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../legacy/ct-assistant.html',
);

export interface Legacy {
  /** esegue codice nello scope globale del vecchio script */
  run<T>(code: string, input?: unknown): T;
  report(input: ReportInput): string;
  draftConclusioni(states: OrganStates): string;
}

export function loadLegacy(): Legacy {
  const html = readFileSync(LEGACY_PATH, 'utf8');
  const errors: string[] = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', (e) => errors.push(String(e.stack ?? e)));
  const dom = new JSDOM(html, {
    url: 'http://localhost/',
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      // API non disponibili in jsdom, usate solo per animazioni/layout
      (window as unknown as Record<string, unknown>).ResizeObserver = class {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    },
  });
  if (errors.length) throw new Error('Errore nel caricare il vecchio tool:\n' + errors.join('\n'));
  const win = dom.window as unknown as { eval(code: string): unknown; __input?: unknown };

  function run<T>(code: string, input?: unknown): T {
    win.__input = JSON.parse(JSON.stringify(input ?? null));
    const out = win.eval(`(function(input){ ${code} })(window.__input)`);
    return JSON.parse(JSON.stringify(out ?? null)) as T;
  }

  const APPLY_STATE = `
    const c = input.config;
    state.sesso = c.sesso; state.modalita = c.modalita; state.mdc = c.mdc;
    state.agente = c.agente; state.concentrazione = c.concentrazione;
    state.quantita = c.quantita; state.flusso = c.flusso;
    state.fasi = new Set(c.fasi);
    state.confronto = c.confronto ? 'si' : 'no';
    if (c.confronto) { state.gg = c.confronto.gg; state.mm = c.confronto.mm; state.aaaa = c.confronto.aaaa; }
    state.selectedRegions = new Set(c.regions);
    state.psExam = c.psExam;
    state.tecnicaModalita = c.tecnicaModalita;
    state.organState = {};
    Object.entries(input.organs || {}).forEach(([id, s]) => {
      state.organState[id] = Object.assign({}, s, { wordPicks: new Set(s.wordPicks) });
    });
  `;

  return {
    run,
    report(input) {
      return run<string>(
        `${APPLY_STATE}
        state.compactMode = !!input.compact;
        state.numericFields = Object.assign({}, input.numericFields || {});
        state.conclusioniIncluded = input.conclusioni != null;
        document.getElementById('conclusioniText').value = input.conclusioni || '';
        document.getElementById('tecnicaText').value =
          input.tecnica != null ? input.tecnica : buildTecnicaText();
        renderOutput();
        return document.getElementById('outputText').value;`,
        input,
      );
    },
    draftConclusioni(states) {
      return run<string>(
        `state.organState = {};
        Object.entries(input).forEach(([id, s]) => {
          state.organState[id] = Object.assign({}, s, { wordPicks: new Set(s.wordPicks) });
        });
        document.getElementById('conclusioniText').value = '';
        generateConclusioniDraft();
        return document.getElementById('conclusioniText').value;`,
        states,
      );
    },
  };
}
