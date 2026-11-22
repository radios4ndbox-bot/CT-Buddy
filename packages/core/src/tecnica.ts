import { FASI_MDC } from './data/mdc';
import { PS_PROTOCOL_TECNICA } from './data/regions';
import { isFixedPsProtocol } from './exam';
import { joinItalian, pad2 } from './text';
import type { ExamConfig } from './types';

/** fasi contrastografiche selezionate in ordine canonico, es. "arteriosa e portale/venosa" */
export function faseListText(config: Pick<ExamConfig, 'fasi'>): string {
  const selected = new Set(config.fasi);
  return joinItalian(FASI_MDC.filter((f) => selected.has(f.id)).map((f) => f.label.toLowerCase()));
}

function confrontoText(config: ExamConfig): string {
  if (!config.confronto) return '';
  const { gg, mm, aaaa } = config.confronto;
  return `\n\nConfronto con precedente TC del ${pad2(gg)}/${pad2(mm)}/${aaaa}.`;
}

/** testo della sezione Tecnica generato dalla configurazione dell'esame */
export function buildTecnica(config: ExamConfig): string {
  const regime = config.modalita === 'urgenza' ? " in regime d'urgenza" : '';
  const specific = PS_PROTOCOL_TECNICA[config.psExam];
  if (isFixedPsProtocol(config) && config.tecnicaModalita === 'specifica' && specific) {
    return (
      `Esame eseguito${regime}, secondo protocollo tecnico dedicato. ${specific}` +
      confrontoText(config)
    );
  }
  let base: string;
  if (config.mdc === 'si') {
    const prePost = config.fasi.includes('basale') ? 'prima e dopo' : 'dopo';
    const fasiText = faseListText(config);
    const fasiClause = fasiText ? ` con acquisizioni in fase ${fasiText}` : '';
    base = `Esame eseguito${regime} ${prePost} somministrazione e.v. di mezzo di contrasto organo-iodato (${config.agente} ${config.concentrazione} mgI/mL; ${config.quantita} mL, ${config.flusso} mL/sec)${fasiClause}.`;
  } else {
    base = `Esame eseguito${regime} nelle sole condizioni di base.`;
  }
  return base + confrontoText(config);
}

export const ACQ_TECNICA_MARKER = '\n\nFasi di acquisizione (da Acquisizione):\n';

/**
 * Aggiunge (o sostituisce, se già presente) il blocco "Fasi di acquisizione" generato in
 * Acquisizione in coda al testo della Tecnica ("La accendiamo").
 */
export function appendAcqToTecnica(tecnica: string, acqBreve: string): string {
  if (!acqBreve) return tecnica;
  const idx = tecnica.indexOf(ACQ_TECNICA_MARKER);
  const base = idx !== -1 ? tecnica.slice(0, idx) : tecnica;
  return base + ACQ_TECNICA_MARKER + acqBreve;
}
