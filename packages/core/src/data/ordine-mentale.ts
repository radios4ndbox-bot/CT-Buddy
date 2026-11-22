// ⚠️ File generato da tools/extract-legacy-data.mjs a partire da legacy/ct-assistant.html.
// Modifiche manuali sono ammesse dopo il porting, ma documentale nel commit.

export const ORDINE_MENTALE_PRINCIPLES: string[] = [
  'Parti dal quesito clinico: il reperto (o la sua assenza) relativo al quesito va descritto per primo nella sua regione, seguito dai reperti anatomicamente o tematicamente correlati (es. quesito renale → reni, poi vie escretrici e vescica; quesito epatico → fegato, poi vie biliari e asse portale).',
  'Poi procedi in ordine sistematico e sempre uguale, cranio-caudale (Encefalo → Collo → Torace → Addome → Scheletro): è la sequenza costante, non la memoria del singolo caso, a evitare di dimenticare un organo.',
  "All'interno di ogni organo valuta prima dimensioni e morfologia, poi margini e struttura, poi eventuali alterazioni focali, infine i rapporti vascolari o linfonodali.",
  'Chiudi ogni regione con i reperti "di sistema" — linfonodi e versamento/liquido libero: si controllano per ultimi perché riassumono lo stato generale della regione.',
  'Le conclusioni non sono obbligatorie: aggiungile solo quando sintetizzano un dato utile (correlazione clinica, follow-up, diagnosi differenziale) — se il referto punto per punto è già chiaro, ometterle rende la lettura più veloce.',
];

export const ORDINE_MENTALE_TIPS: Record<string, string> = {
  parenchima_enc:
    "Guarda prima il sangue (iperdensità acuta), poi l'ischemia (ipodensità recente o cronica): sono le due urgenze più frequenti.",
  ventricoli_mediane:
    'Sistema ventricolare e linea mediana si valutano insieme: uno shift o un effetto massa si riconosce per confronto tra i due.',
  tiroide:
    'Va sempre commentata anche se non è il quesito: è la prima struttura che si incontra scendendo dal collo.',
  laringe:
    'Valutala per ultima nel collo: è centrale e il suo giudizio beneficia del confronto con le strutture già viste.',
  parenchima_polm:
    'Target più frequente in TC torace (noduli, addensamenti): descrivilo per primo, con sede precisa (lobo/segmento).',
  consolidamenti:
    'Distingui addensamento flogistico/tumorale da semplice atelettasia disventilativa: cambia la prognosi e il follow-up.',
  cuore:
    'Le coronarie si commentano solo per calcificazioni evidenti, salvo che lo studio sia dedicato al circolo coronarico.',
  linfonodi_torace:
    "Chiusura della regione, come da principio generale: ultimo controllo prima di passare all'addome.",
  fegato:
    'Target epatico frequente: dimensioni/margini, poi lesioni focali — il comportamento nelle diverse fasi di enhancement fa la diagnosi differenziale (cisti vs angioma vs area sospetta).',
  colecisti:
    'Cerca sempre calcoli e segni di flogosi (pareti, edema pericolecistico) prima di passare alle vie biliari.',
  reni: 'Valuta il parenchima, poi le vie escretrici (dilatazione, calcoli), poi un eventuale ritardo di escrezione in fase tardiva.',
  appendice:
    'Da controllare sempre in caso di dolore in fossa iliaca destra, anche quando non è il quesito primario.',
  prostata:
    'Ultimo organo pieno prima dei vasi: solo le dimensioni, salvo quesito oncologico dedicato.',
  utero_annessi: 'Ultimo organo pieno prima dei vasi: utero e, a seguire, gli annessi.',
  aorto_bisiliaco:
    'Da qui in poi si passa al "sistema": prima i vasi, poi i linfonodi, infine il versamento.',
  versamento_addome: 'Ultimo controllo della regione, sempre.',
  scheletro_incluso:
    'Controllo sistematico di tutti i segmenti ossei inclusi nel volume di scansione, anche se non richiesti dal quesito.',
};

export const ORDINE_MENTALE_PS_NOTES: Record<string, string> = {
  cervicale:
    "Ordine: giunzione cranio-cervicale (l'area più a rischio nei traumi), poi allineamento vertebrale, poi canale rachideo, infine i dischi.",
  encefalo_urgenza:
    "In urgenza il primo controllo è sempre il sangue fresco (iperdensità), poi le lesioni ischemiche recenti, poi l'effetto massa/shift; infine i reperti cronici (atrofia, ischemia cronica) che non spiegano da soli il quadro acuto.",
  tc_tep:
    'Il quesito è vascolare: guarda prima il circolo arterioso polmonare (difetti di riempimento), poi il parenchima (infarti, aree disventilative), infine versamento e linfonodi.',
  dissezione_aortica:
    "Segui sempre il flap di dissezione dall'origine alla periferia: aorta toraco-addominale, poi tronchi sovraortici e vasi splancnici (per capire cosa nasce dal vero e cosa dal falso lume), infine gli organi a valle per le complicanze ischemiche (fegato, milza, pancreas, reni, intestino).",
  massiccio:
    'Scheletro del massiccio e basicranio, poi rinofaringe, poi cavità paranasali, infine parti molli.',
  angio_arti_inf:
    "Segui il vaso dall'origine alla periferia, segmento per segmento: aorta sottorenale e iliache, femorali comuni, femorale superficiale/profonda, poplitea, tronco tibio-peroneale, assi distali di gamba.",
};
