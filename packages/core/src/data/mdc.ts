// ⚠️ File generato da tools/extract-legacy-data.mjs a partire da legacy/ct-assistant.html.
// Modifiche manuali sono ammesse dopo il porting, ma documentale nel commit.
import type { FaseMdc } from '../types';

export const AGENTI_MDC_CONCENTRAZIONI: Record<string, number[]> = {
  Omnipaque: [140, 180, 240, 300, 350],
  Xenetix: [250, 300, 350],
  Visipaque: [270, 320],
  Ultravist: [150, 240, 300, 370],
  Iopamiro: [200, 300, 370],
};

export const AGENTI_MDC = Object.keys(AGENTI_MDC_CONCENTRAZIONI);

export const FLUSSI_MDC: number[] = [2, 2.5, 3, 3.5, 4];

export const FASI_MDC: FaseMdc[] = [
  {
    id: 'basale',
    label: 'Basale',
  },
  {
    id: 'arteriosa',
    label: 'Arteriosa',
  },
  {
    id: 'portale',
    label: 'Portale/venosa',
  },
  {
    id: 'tardiva',
    label: 'Tardiva',
  },
];
