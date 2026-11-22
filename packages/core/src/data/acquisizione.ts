// ⚠️ File generato da tools/extract-legacy-data.mjs a partire da legacy/ct-assistant.html.
// Modifiche manuali sono ammesse dopo il porting, ma documentale nel commit.
import type { AcqDistrict, AcqFase, ProtocolRule } from '../types';

export const DISTRICTS_ACQ: AcqDistrict[] = [
  {
    id: 'enc',
    label: 'Encefalo',
  },
  {
    id: 'massiccio',
    label: 'Massiccio facciale / rocche petrose',
  },
  {
    id: 'collo',
    label: 'Collo',
  },
  {
    id: 'colonna',
    label: 'Colonna vertebrale',
  },
  {
    id: 'torace_sup',
    label: 'Torace superiore',
  },
  {
    id: 'torace',
    label: 'Torace completo',
  },
  {
    id: 'addome_sup',
    label: 'Addome superiore',
  },
  {
    id: 'addome',
    label: 'Addome completo',
  },
  {
    id: 'scheletro',
    label: 'Scheletro',
  },
];

export const FASI_ACQ: AcqFase[] = [
  {
    id: 'basale',
    label: 'Basale',
  },
  {
    id: 'arteriosa',
    label: 'Arteriosa',
  },
  {
    id: 'venosa',
    label: 'Venosa',
  },
  {
    id: 'tardiva',
    label: 'Tardiva',
    hasMinuti: true,
    minutiDefault: 5,
  },
  {
    id: 'urografica',
    label: 'Urografica/escretoria',
    hasMinuti: true,
    minutiDefault: 10,
  },
];

export const PROTOCOL_LIBRARY: ProtocolRule[] = [
  {
    id: 'trauma_cranico',
    label: 'Trauma cranico acuto',
    keywords: [
      'trauma cranico',
      'trauma capo',
      'caduta',
      'gcs',
      'botta in testa',
      'perdita di coscienza',
      'trauma della testa',
    ],
    matrix: {
      basale: ['enc'],
    },
    mdcNote: 'no',
    note: 'SIRM: encefalo senza mdc, tecnica assiale (spirale se paziente non collaborante), kVp 120 (140 se su barella spinale).',
  },
  {
    id: 'emorragia_ictus',
    label: 'Sospetta emorragia intracranica / ictus / cefalea / deficit neurologico',
    keywords: [
      'emorragia intracranica',
      'ictus',
      'ischemia cerebrale',
      'stroke',
      'deficit neurologico',
      'cefalea',
      'crisi epilettica',
      'idrocefalo',
      'alterazione dello stato mentale',
      'alterazione stato mentale',
      'sospetto ictus',
      'tia',
    ],
    matrix: {
      basale: ['enc'],
    },
    mdcNote: 'no',
    note: 'SIRM: encefalo senza mdc, tecnica assiale (o spirale), kVp 120, spessore ≤2 mm.',
  },
  {
    id: 'lesione_espansiva_enc',
    label: 'Sospetta lesione espansiva / massa cerebrale',
    keywords: [
      'lesione espansiva',
      'massa cerebrale',
      'tumore cerebrale',
      'neoplasia cerebrale',
      'metastasi cerebrali',
      'secondarismi cerebrali',
      'glioma',
      'meningioma',
    ],
    matrix: {
      basale: ['enc'],
      tardiva: ['enc'],
    },
    minuti: {
      tardiva: 4,
    },
    mdcNote: 'si',
    note: 'SIRM: encefalo basale + tardiva post-mdc (ritardo 3-5 min). Flusso 1 mL/s, quantità 1 mL/kg.',
  },
  {
    id: 'osso_temporale_orbite',
    label: 'Osso temporale / orbite / rinosinusale',
    keywords: [
      'ipoacusia',
      'otite cronica',
      'colesteatoma',
      "malattia dell'orecchio",
      'osso temporale',
      'proptosi',
      'orbitopatia tiroidea',
      'sinusite',
      'poliposi nasale',
      'deviazione del setto',
      'ostruzione nasale',
      'rinosinusale',
      'seni paranasali',
    ],
    matrix: {
      basale: ['massiccio'],
    },
    mdcNote: 'no',
    note: 'SIRM: distretto limitato al massiccio facciale/rocche petrose senza mdc, salvo sospetta neoplasia/infiammazione con indicazione al mdc.',
  },
  {
    id: 'colonna_vertebrale',
    label: 'Rachide (trauma, dolore, sospetta metastasi ossea)',
    keywords: [
      'dolore rachideo',
      'trauma vertebrale',
      'cedimento vertebrale',
      'metastasi ossee vertebrali',
      'frattura vertebrale',
      'dorsalgia',
      'lombalgia acuta post-traumatica',
    ],
    matrix: {
      basale: ['colonna'],
    },
    mdcNote: 'no',
    note: 'SIRM: rachide senza mdc; con mdc solo se sospetta neoplasia/flogosi/infezione.',
  },
  {
    id: 'embolia_polmonare',
    label: 'Sospetta embolia polmonare (TEP)',
    keywords: [
      'embolia polmonare',
      'tep',
      'tromboembolia',
      'dispnea acuta',
      'dolore toracico acuto con d-dimero',
      'd-dimero',
    ],
    matrix: {
      arteriosa: ['torace'],
    },
    mdcNote: 'si',
    note: 'SIRM/PS: angioTC torace, fase arteriosa con bolus-tracking (ROI tronco polmonare, soglia 100 HU).',
  },
  {
    id: 'dissezione_aortica',
    label: 'Sospetta dissezione aortica / dolore toracico acuto vascolare',
    keywords: [
      'dissezione aortica',
      'dolore toracico acuto',
      'aneurisma dissecato',
      'sindrome aortica acuta',
    ],
    matrix: {
      basale: ['torace', 'addome'],
      arteriosa: ['torace', 'addome'],
      venosa: ['torace', 'addome'],
    },
    mdcNote: 'si',
    note: 'PS: basale + arteriosa (bolus-tracking, ROI ventricolo sinistro) + venosa, torace-addome-pelvi.',
  },
  {
    id: 'stadiazione_polmone',
    label: 'Nodulo/neoplasia polmonare — stadiazione oncologica',
    keywords: [
      'nodulo polmonare',
      'neoplasia polmonare',
      'carcinoma polmonare',
      'k polmone',
      'stadiazione polmone',
      'tumore al polmone',
      'lung rads',
    ],
    matrix: {
      venosa: ['collo', 'torace', 'addome'],
    },
    mdcNote: 'si',
    note: 'SIRM: fase venosa (70-80s), estensione da collo/base cranio a pelvi; valutare encefalo se sintomatico o istotipo diffuso.',
  },
  {
    id: 'cardio_coronarie',
    label: 'Dolore toracico cronico stabile / calcium score / coronarie',
    keywords: [
      'angina cronica stabile',
      'calcium score',
      'coronarie',
      'dolore toracico cronico',
      'controllo stent',
      'controllo by-pass',
      'bypass coronarico',
    ],
    matrix: {
      arteriosa: ['torace_sup'],
    },
    mdcNote: 'si',
    note: 'SIRM Cardio-TC: acquisizione ECG-sincronizzata limitata al torace superiore (cuore/coronarie).',
  },
  {
    id: 'tavi_planning',
    label: 'Planning TAVI / stenosi aortica severa',
    keywords: ['tavi', 'planning tavi', 'stenosi aortica severa', 'anulus aortico'],
    matrix: {
      arteriosa: ['torace_sup', 'addome'],
    },
    mdcNote: 'si',
    note: 'SIRM: fase arteriosa cardiosincronizzata su anulus/radice aortica + studio degli accessi vascolari fino al bacino/arti.',
  },
  {
    id: 'fegato_cirrotico',
    label: 'Fegato cirrotico / sorveglianza HCC',
    keywords: [
      'cirrosi',
      'hcc',
      'epatocarcinoma',
      'nodulo epatico',
      'sorveglianza epatica',
      'cirrotico',
    ],
    matrix: {
      basale: ['addome_sup'],
      arteriosa: ['addome_sup'],
      venosa: ['addome'],
      tardiva: ['addome_sup'],
    },
    minuti: {
      tardiva: 4,
    },
    mdcNote: 'si',
    note: "SIRM: studio quadrifasico (basale/arteriosa/tardiva limitate all'addome superiore, portale/venosa estesa a tutto l'addome).",
  },
  {
    id: 'ipertensione_nefrovascolare',
    label: 'Ipertensione nefrovascolare / sospetta stenosi arteria renale',
    keywords: [
      'ipertensione nefrovascolare',
      'stenosi arteria renale',
      'ipertensione renovascolare',
    ],
    matrix: {
      arteriosa: ['addome_sup'],
    },
    mdcNote: 'si',
    note: "SIRM AngioTC: fase arteriosa limitata all'addome superiore (arterie renali).",
  },
  {
    id: 'litiasi_renale',
    label: 'Colica renale / sospetta litiasi',
    keywords: [
      'colica renale',
      'litiasi renale',
      'calcolo ureterale',
      'dolore al fianco',
      'dolore lombare acuto',
    ],
    matrix: {
      basale: ['addome'],
    },
    mdcNote: 'no',
    note: 'TC senza mdc (Uro-TC basale): sensibilità massima per calcoli, evita di mascherarli con il mezzo di contrasto.',
  },
  {
    id: 'neoplasia_renale',
    label: 'Massa renale / neoplasia renale',
    keywords: ['massa renale', 'neoplasia renale', 'cisti renale complessa', 'tumore renale'],
    matrix: {
      basale: ['addome_sup'],
      arteriosa: ['addome_sup'],
      venosa: ['addome_sup'],
    },
    mdcNote: 'si',
    note: 'SIRM (UroTC): basale + arteriosa/corticomidollare + portale/nefrografica, per caratterizzare la lesione.',
  },
  {
    id: 'ematuria_urotc',
    label: 'Ematuria / idronefrosi — UroTC oncologica',
    keywords: [
      'ematuria',
      'idronefrosi',
      'neoplasia vescicale',
      'neoplasia urotelio',
      'urotelioma',
    ],
    matrix: {
      basale: ['addome'],
      arteriosa: ['addome_sup'],
      urografica: ['addome'],
    },
    minuti: {
      urografica: 10,
    },
    mdcNote: 'si',
    note: "SIRM UroTC: basale + arteriosa/corticomidollare (addome superiore) + fase urografica/escretoria a 10 min su tutto l'addome.",
  },
  {
    id: 'appendicite',
    label: 'Sospetta appendicite / dolore in fossa iliaca destra',
    keywords: ['appendicite', 'dolore fossa iliaca destra', 'dolore fid', 'fossa iliaca destra'],
    matrix: {
      venosa: ['addome'],
    },
    mdcNote: 'si',
    note: 'Fase venosa (70-80s): valuta parete appendicolare, falda periappendicolare, complicanze.',
  },
  {
    id: 'diverticolite',
    label: 'Sospetta diverticolite / dolore addominale in fossa iliaca sinistra',
    keywords: [
      'diverticolite',
      'dolore fossa iliaca sinistra',
      'dolore fis',
      'diverticolosi complicata',
    ],
    matrix: {
      venosa: ['addome'],
    },
    mdcNote: 'si',
    note: 'Fase venosa (70-80s): valuta parete colica, raccolte pericoliche, aria libera.',
  },
  {
    id: 'occlusione_intestinale',
    label: 'Sospetta occlusione intestinale / addome acuto',
    keywords: [
      'occlusione intestinale',
      'ileo meccanico',
      'addome acuto',
      'dolore addominale acuto diffuso',
    ],
    matrix: {
      venosa: ['addome'],
    },
    mdcNote: 'si',
    note: 'Fase venosa; valutare anche basale se si sospetta solo litiasi o se il mdc è controindicato.',
  },
  {
    id: 'politrauma',
    label: 'Politrauma / trauma maggiore',
    keywords: [
      'politrauma',
      'trauma maggiore',
      'incidente stradale',
      'trauma multiplo',
      'caduta da grande altezza',
    ],
    matrix: {
      basale: ['enc', 'collo', 'torace', 'addome', 'scheletro'],
      arteriosa: ['torace', 'addome'],
      venosa: ['torace', 'addome'],
    },
    mdcNote: 'si',
    note: 'Whole-body: basale + arteriosa + venosa, encefalo-collo-torace-addome-pelvi-scheletro incluso in esame.',
  },
  {
    id: 'claudicatio_arti_inf',
    label: 'Claudicatio / ischemia arto inferiore',
    keywords: [
      'claudicatio',
      'ischemia arto',
      'arteriopatia periferica',
      'dolore claudicante',
      'tof',
    ],
    matrix: {
      arteriosa: ['addome'],
    },
    mdcNote: 'si',
    note: 'PS: angioTC aorta-iliache-arti inferiori, fase arteriosa con bolus-tracking (ROI aorta sopraceliaca, soglia 150 HU); estensione fino ai piedi non modellata come distretto separato qui.',
  },
  {
    id: 'stadiazione_generica',
    label: 'Stadiazione oncologica / follow-up generico torace-addome',
    keywords: [
      'stadiazione',
      'follow-up oncologico',
      'neoplasia',
      'controllo oncologico',
      'estensione di malattia',
    ],
    matrix: {
      venosa: ['torace', 'addome'],
    },
    mdcNote: 'si',
    note: "Fase venosa (70-80s) torace-addome-pelvi: schema di base, da personalizzare sull'istotipo se disponibile un'indicazione più specifica.",
  },
];

export const ACQ_DISTRICT_BUCKET: Record<string, string> = {
  enc: 'testa_collo',
  massiccio: 'testa_collo',
  collo: 'testa_collo',
  colonna: 'testa_collo',
  torace_sup: 'torace',
  torace: 'torace',
  addome_sup: 'addome',
  addome: 'addome',
  scheletro: 'scheletro',
};

export const ACQ_CATEGORY_BUCKETS: { id: string; label: string }[] = [
  {
    id: 'testa_collo',
    label: 'Testa e collo',
  },
  {
    id: 'torace',
    label: 'Torace',
  },
  {
    id: 'addome',
    label: 'Addome',
  },
  {
    id: 'scheletro',
    label: 'Scheletro',
  },
  {
    id: 'multi',
    label: 'Multi-distretto',
  },
];

export const ACQ_VARIANT_LABELS: Record<string, string> = {
  primo: 'Primo esame',
  controllo: 'Controllo',
};
