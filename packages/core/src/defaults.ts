import { PS_FREE_ID } from './data/regions';
import type { ExamConfig } from './types';

/** configurazione iniziale, uguale ai default del vecchio CT-Assistant */
export function defaultExamConfig(): ExamConfig {
  return {
    sesso: 'F',
    modalita: 'elettiva',
    mdc: 'si',
    agente: 'Omnipaque',
    concentrazione: 350,
    quantita: 100,
    flusso: 3,
    fasi: ['arteriosa', 'portale'],
    confronto: null,
    regions: ['encefalo', 'torace', 'addome_pelvi'],
    psExam: PS_FREE_ID,
    tecnicaModalita: 'generale',
  };
}
