// ============================================================
// Tipi del dominio CT Buddy
// ============================================================

export type Sesso = 'F' | 'M';
export type Modalita = 'elettiva' | 'urgenza';
export type RegionKey = 'encefalo' | 'collo' | 'torace' | 'addome_pelvi' | 'scheletro';
export type FaseMdcId = 'basale' | 'arteriosa' | 'portale' | 'tardiva';
export type FaseAcqId = 'basale' | 'arteriosa' | 'venosa' | 'tardiva' | 'urografica';

// ---------- catalogo organi ----------

export interface OrganExample {
  label: string;
  text: string;
}

export interface OrganCompact {
  /** organi dello stesso gruppo vengono accorpati in un'unica frase nel referto breve */
  group: string;
  shortLabel: string;
  detailStatic?: string;
  /** es. "dimensioni regolari, DCC {value} {unit}" */
  detailTemplate?: string;
  numericField?: { label: string; unit: string; default: number };
}

export interface Organ {
  id: string;
  label: string;
  /** frase negativa di default */
  negative: string;
  /** variante della frase negativa quando l'esame è senza mdc */
  negativeNoMdc?: string;
  /** presente solo per gli organi specifici di un sesso (es. prostata, utero e annessi) */
  sex?: Sesso;
  example?: string;
  examples?: OrganExample[];
  compact?: OrganCompact;
}

export interface Region {
  title: string;
  organs: Organ[];
}

export interface PsExam {
  label: string;
  title: string;
  contrastoDefault: 'si' | 'no';
  organs: Organ[];
}

export interface FaseMdc {
  id: FaseMdcId;
  label: string;
}

// ---------- acquisizione ----------

export interface AcqDistrict {
  id: string;
  label: string;
}

export interface AcqFase {
  id: FaseAcqId;
  label: string;
  hasMinuti?: boolean;
  minutiDefault?: number;
}

/** griglia fase → distretti (serializzabile in JSON, al posto dei Set del vecchio tool) */
export type AcqMatrix = Partial<Record<FaseAcqId, string[]>>;
export type AcqMinuti = Partial<Record<FaseAcqId, number>>;

export interface ProtocolRule {
  id: string;
  label: string;
  keywords: string[];
  matrix: AcqMatrix;
  minuti?: AcqMinuti;
  mdcNote?: 'si' | 'no';
  note?: string;
  learned?: boolean;
  groupLabel?: string | null;
  variant?: 'primo' | 'controllo' | null;
}

// ---------- configurazione esame e stato del referto ----------

export interface ConfrontoDate {
  gg: number;
  mm: number;
  aaaa: number;
}

export interface ExamConfig {
  sesso: Sesso;
  modalita: Modalita;
  mdc: 'si' | 'no';
  agente: string;
  /** mgI/mL */
  concentrazione: number;
  /** mL */
  quantita: number;
  /** mL/sec */
  flusso: number;
  fasi: FaseMdcId[];
  /** null = nessun confronto con TC precedente */
  confronto: ConfrontoDate | null;
  /** regioni selezionate (TC elettiva, oppure urgenza senza protocollo fisso) */
  regions: RegionKey[];
  /** id di PS_EXAMS, oppure PS_FREE_ID ("libero") per la composizione per regioni */
  psExam: string;
  /** solo urgenza con protocollo fisso: tecnica dalle impostazioni generali o dal protocollo SIRM */
  tecnicaModalita: 'generale' | 'specifica';
}

export interface OrganState {
  text: string;
  positive: boolean;
  /** "flag it": reperto da riportare nelle conclusioni */
  flagged: boolean;
  /** 🎯 organo oggetto del quesito diagnostico */
  isTarget: boolean;
  /** "yeet": organo escluso dal referto finale */
  yeeted: boolean;
  /** indici delle parole del testo scelte per la bozza delle conclusioni */
  wordPicks: number[];
}

export type OrganStates = Record<string, OrganState>;

export interface ReportInput {
  config: ExamConfig;
  organs: OrganStates;
  /** valori dei campi numerici del referto breve (es. DCC milza) per id organo */
  numericFields?: Record<string, number | string>;
  /** true = referto breve (accorpa gli organi negativi) */
  compact?: boolean;
  /** testo della Tecnica modificato a mano; se assente viene generato da buildTecnica */
  tecnica?: string;
  /** null/undefined = conclusioni non incluse nel referto */
  conclusioni?: string | null;
}

/** parole chiave apprese dall'utente, per id (organo o regola) */
export type LearnedKeywords = Record<string, string[]>;
