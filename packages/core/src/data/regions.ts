// ⚠️ File generato da tools/extract-legacy-data.mjs a partire da legacy/ct-assistant.html.
// Modifiche manuali sono ammesse dopo il porting, ma documentale nel commit.
import type { Organ, PsExam, RegionKey } from '../types';

export const REGIONS: Record<RegionKey, { title: string; organs: Organ[] }> = {
  encefalo: {
    title: 'ENCEFALO',
    organs: [
      {
        id: 'parenchima_enc',
        label: 'Parenchima encefalico',
        negative:
          'Non iperdensità di natura ematica e/o alterazioni tomodensitometriche di significato patologico attuale in sede sovra- e sottotentoriale.',
        examples: [
          {
            label: 'ipodensità sostanza bianca periventricolare',
            text: 'Ipodensità della sostanza bianca periventricolare da sofferenza ischemica cronica.',
          },
          {
            label: 'ematoma intraparenchimale',
            text: 'Voluminoso ematoma intraparenchimale a sede parieto-occipitale destra (76 x 35 mm) con valori densitometrici variabili come per sanguinamento in più tempi ed edema periferico che determina compressione del corno posteriore del ventricolo laterale destro e lieve shift delle strutture della linea mediana verso sinistra (5 mm).',
          },
        ],
      },
      {
        id: 'ventricoli_mediane',
        label: 'Sistema ventricolare e strutture mediane',
        negative:
          'Le strutture della linea mediana sono in asse. Il sistema ventricolare è regolare per morfologia e dimensioni.',
      },
    ],
  },
  collo: {
    title: 'COLLO',
    organs: [
      {
        id: 'tiroide',
        label: 'Tiroide',
        negative:
          'Tiroide in sede, di volume e struttura nei limiti, priva di noduli focali sospetti.',
        example:
          'Alcune nodulazioni in ambito tiroideo, da rivalutare con indagine ecografica mirata se non nota.',
      },
      {
        id: 'linfonodi_collo',
        label: 'Linfonodi latero-cervicali',
        negative: 'Non linfoadenomegalie latero-cervicali, bilateralmente.',
      },
      {
        id: 'ghiandole_salivari',
        label: 'Ghiandole salivari',
        negative: 'Ghiandole parotidi e sottomandibolari nella norma per volume e struttura.',
      },
      {
        id: 'laringe',
        label: 'Laringe e ipofaringe',
        negative: 'Regolare morfologia di laringe e ipofaringe, senza lesioni focali sospette.',
      },
    ],
  },
  torace: {
    title: 'TORACE',
    organs: [
      {
        id: 'parenchima_polm',
        label: 'Parenchima polmonare',
        negative:
          'Non alterazioni focali del parenchima polmonare bilateralmente, sospette in senso patologico attuale.',
        examples: [
          {
            label: 'addensamento flogistico',
            text: 'Esteso e compatto addensamento parenchimale polmonare con broncogramma aereo nel contesto alla piramide basale del LIS, con interessamento prevalentemente dei segmenti postero-basale e latero-basale, di aspetto flogistico attuale.',
          },
          {
            label: 'consolidamento tumorale',
            text: 'Consolidamento parenchimale parailare a destra con componenti cavitate interne e dimensioni massime di circa 70x64x48 mm (LLxAPxCC). Alcune sfumate aree parenchimali a vetro smerigliato perilesionali.',
          },
          {
            label: 'contusione polmonare',
            text: 'Plurimi consolidamenti parenchimali polmonari con densità a vetro smerigliato, espressione di contusioni polmonari, a carico del polmone sinistro; analoghe alterazioni anche al lobo superiore destro, di minore entità.',
          },
          {
            label: 'noduli secondari (LUNG-RADS)',
            text: 'Multiple nodulazioni parenchimali polmonari bilaterali sospette in senso eteroformativo-secondario, meritevoli di correlazione con dato clinico e, se non note, di eventuale approfondimento diagnostico in elezione.',
          },
          {
            label: 'sarcoidosi toracica',
            text: 'Numerose linfoadenomegalie prevalentemente confluenti a carico di pressoché tutte le stazioni linfonodali mediastiniche, con prevalente distribuzione simmetrica ilare polmonare bilaterale, non calcifiche; rilievi riconducibili in prima ipotesi a quadro di sarcoidosi toracica (stadio I) da confermare con inquadramento clinico-laboratoristico.',
          },
        ],
      },
      {
        id: 'consolidamenti',
        label: 'Aree consolidative',
        negative: 'Non aree consolidative parenchimali bilaterali.',
        example: 'Alterazioni disventilative ai segmenti lingulari e al lobo medio.',
      },
      {
        id: 'trachea_bronchi',
        label: 'Trachea e bronchi principali',
        negative: 'Trachea e bronchi principali pervi.',
      },
      {
        id: 'versamento_torace',
        label: 'Versamento pleuro-pericardico',
        negative: 'Non versamento pleurico né significativo versamento pericardico.',
        example: 'Falda di versamento pleurico omolaterale (spessore massimo fino a 30 mm).',
      },
      {
        id: 'cuore',
        label: 'Cuore e coronarie',
        negative: 'Dimensioni cardiache nella norma; non significative calcificazioni coronariche.',
        example: 'Dilatazione degli atri cardiaci. Non segni di congestione del piccolo circolo.',
      },
      {
        id: 'linfonodi_torace',
        label: 'Linfonodi ilo-mediastinici e ascellari',
        negative: 'Non linfoadenomegalie ilo-mediastiniche né ascellari, bilateralmente.',
        example:
          'Alcuni linfonodi con asse corto subcentimetrico in sede ilo-mediastinica, i maggiori in sede para-aortica (asse corto fino a 7 mm) e paratracheale inferiore destra (asse corto fino a 8 mm), di aspetto reattivo. Non linfoadenomegalie ascellari bilateralmente.',
      },
    ],
  },
  addome_pelvi: {
    title: 'ADDOME',
    organs: [
      {
        id: 'fegato',
        label: 'Fegato',
        negative:
          'Fegato di dimensioni e margini nella norma, esente da alterazioni focali sospette in senso patologico attuale.',
        compact: {
          group: 'parenchimi_addome',
          shortLabel: 'fegato',
        },
        examples: [
          {
            label: 'angioma epatico',
            text: "Due alterazioni ovalari dotate di enhancement periferico e globulare dopo mdc, da riferire ad angiomi, con dimensioni massime di circa 12 mm al II segmento e 90 mm al VII segmento, quest'ultimo caratterizzato da componente centrale maggiormente ipodensa, di significato ialino-cistico.",
          },
          {
            label: 'cisti epatica',
            text: "Due millimetriche alterazioni ipodense in tutte le fasi di acquisizione al VI e all'VIII segmento, di significato cistico.",
          },
          {
            label: 'area ipervascolare (THAD)',
            text: 'In S5 si documenta sfumata area ipervascolare di circa 19 mm riconoscibile nella sola fase arteriosa, priva di wash-out nelle fasi venosa-tardiva, rilievo compatibile con THAD e meritevole di monitoraggio.',
          },
        ],
      },
      {
        id: 'asse_portale',
        label: 'Asse spleno-mesenterico-portale',
        negative: "Calibro e pervietà dell'asse venoso spleno-mesenterico-portale nella norma.",
        negativeNoMdc: "Calibro dell'asse venoso spleno-mesenterico-portale nella norma.",
      },
      {
        id: 'colecisti',
        label: 'Colecisti',
        negative:
          'Colecisti in sede, normodistesa, con pareti di regolare spessore, priva di calcoli calcifici endoluminali.',
        negativeNoMdc: 'Colecisti in sede, normodistesa, priva di calcoli calcifici endoluminali.',
        example:
          'Colecisti in sede, poco distesa, contenente formazione litiasica calcifica di 22 mm in regione infundibolare. Pareti iperemiche, non francamente ispessite, con discreto edema pericolecistico, da lieve flogosi. Ectasia delle vie biliari (dotto epatico comune di calibro 9 mm; vie biliari intraepatiche sino a 5 mm).',
      },
      {
        id: 'vie_biliari',
        label: 'Vie biliari',
        negative: 'Vie biliari intra- ed extra-epatiche non dilatate.',
      },
      {
        id: 'stomaco',
        label: 'Stomaco',
        negative:
          'Stomaco disteso da succo gastrico, con pareti di spessore regolare, privo di lesioni vegetanti endoluminali sospette.',
      },
      {
        id: 'milza',
        label: 'Milza',
        negative: 'Milza priva di alterazioni focali/parenchimali, di dimensioni nella norma.',
        compact: {
          group: 'parenchimi_addome',
          shortLabel: 'milza',
          detailTemplate: 'dimensioni regolari, DCC {value} {unit}',
          numericField: {
            label: 'DCC (diametro cranio-caudale)',
            unit: 'cm',
            default: 10,
          },
        },
      },
      {
        id: 'pancreas',
        label: 'Pancreas (dotto di Wirsung)',
        negative: 'Pancreas nei limiti; dotto di Wirsung di calibro e decorso regolari.',
        compact: {
          group: 'parenchimi_addome',
          shortLabel: 'pancreas',
          detailStatic: 'non dilatato il Wirsung',
        },
      },
      {
        id: 'surreni',
        label: 'Surreni',
        negative: 'Surreni nella norma, bilateralmente.',
        compact: {
          group: 'parenchimi_addome',
          shortLabel: 'surreni',
        },
      },
      {
        id: 'reni',
        label: 'Reni e vie escretrici',
        negative:
          'Reni privi di alterazioni calicopieliche; corticale conservata; ureteri pervi bilateralmente; non idroureteronefrosi.',
        negativeNoMdc: 'Reni di dimensioni e morfologia nei limiti; non idroureteronefrosi.',
        compact: {
          group: 'parenchimi_addome',
          shortLabel: 'reni',
        },
        examples: [
          {
            label: 'litiasi renale/ureterale',
            text: 'A sinistra si osserva piccolo calcolo radiopaco nel gruppo caliceale medio, puntiforme, di 2 mm. Lieve dilatazione pielo-ureterale con diametro AP della pelvi di 12 mm, causata da calcolo ureterale distale localizzato nella porzione prevescicale di 4 mm. A destra puntiforme tenue iperdensità caliceale, prelitiasica.',
          },
          {
            label: 'pielonefrite',
            text: 'Reni caratterizzati da plurime alterazioni a morfologia triangolariforme ipodense dopo mdc da ambo i lati, la maggiore al polo inferiore di destra, da riferire a focolai di pielonefrite. Minima disomogeneità del tessuto adiposo tra le fasce renali bilateralmente, maggiore a destra.',
          },
          {
            label: 'ritardo escrezione mdc',
            text: "Il reperto determina ritardo dell'escrezione dell'urina iodata a destra.",
          },
          {
            label: 'lacerazione renale (trauma)',
            text: 'Focali lacerazioni del parenchima renale al polo superiore (AAST grado 3) con associato ematoma nella loggia spleno-renale e plurimi focolai di sanguinamento attivo. Non evidenti spandimenti di urina iodata.',
          },
        ],
      },
      {
        id: 'tenue',
        label: 'Anse del tenue',
        negative:
          'Anse del tenue di calibro e spessore parietale nella norma, prive di ispessimenti parietali sospetti.',
      },
      {
        id: 'appendice',
        label: 'Appendice cecale',
        negative:
          'Appendice cecale regolarmente rappresentata, a pareti sottili, priva di segni di flogosi in atto.',
        example:
          'In fossa iliaca destra è riconoscibile appendice cecale a decorso usuale, tumefatta (calibro massimo di circa 12 mm) e dotata di pareti iperemiche, da flogosi. Concomita sottile falda fluida periappendicolare e ispessimento reattivo del peritoneo in emipelvi destra, senza evidenti raccolte conformate. Quadro compatibile con appendicite acuta non complicata. Non segni di occlusione o di ischemia intestinale.',
      },
      {
        id: 'colon',
        label: 'Colon',
        negative:
          'Cornice colica regolarmente distesa e rappresentata, priva di ispessimenti parietali o lesioni vegetanti endoluminali sospette.',
        example:
          'Diverticolosi del sigma con ipodensità parietale ed esile raccolta adiacente di 48 x 41 mm, a pareti non ancora conformate, in ipogastrio. Doppia ansa del tenue a pareti lievemente ispessite ed iperemiche, di probabile significato reattivo. Non anse sovradistese né livelli idroaerei indicativi di occlusione intestinale. Pervie arteria e vena mesenterica superiore. Non aria libera endoaddominale.',
      },
      {
        id: 'retto',
        label: 'Retto',
        negative:
          'Retto di calibro e spessore parietale nella norma, privo di lesioni vegetanti endoluminali sospette.',
      },
      {
        id: 'vescica',
        label: 'Vescica',
        negative:
          'Vescica distesa, pareti di regolare spessore, priva di vegetazioni solide endoluminali.',
        negativeNoMdc: 'Vescica distesa, priva di evidenti vegetazioni solide endoluminali.',
      },
      {
        id: 'utero_annessi',
        label: 'Utero e annessi',
        negative:
          'Utero di dimensioni nei limiti. Non formazioni espansive di tipo solido o cistico in sede annessiale, bilateralmente.',
        sex: 'F',
      },
      {
        id: 'prostata',
        label: 'Prostata',
        negative: 'Prostata di dimensioni nella norma per diametro trasverso.',
        sex: 'M',
      },
      {
        id: 'aorto_bisiliaco',
        label: 'Asse aorto-bisiliaco',
        negative:
          'Asse aorto-bisiliaco di calibro e decorso regolari; ateromasia non significativa.',
      },
      {
        id: 'vasi_splancnici',
        label: 'Tripode celiaco, AMS e arterie renali',
        negative:
          'Tripode celiaco, arteria mesenterica superiore e arterie renali privi di placche ateromasiche emodinamicamente significative e di riduzioni di lume vascolare degne di nota.',
        negativeNoMdc:
          'Tripode celiaco, arteria mesenterica superiore e arterie renali privi di estese calcificazioni ateromasiche parietali.',
      },
      {
        id: 'linfonodi_addome',
        label: 'Linfonodi addomino-pelvici',
        negative: 'Non linfoadenomegalie addomino-pelviche.',
      },
      {
        id: 'versamento_addome',
        label: 'Versamento libero endoaddominale',
        negative: 'Non falde di versamento libero endoaddominale.',
      },
    ],
  },
  scheletro: {
    title: 'SCHELETRO',
    organs: [
      {
        id: 'scheletro_incluso',
        label: 'Segmenti scheletrici inclusi in esame',
        negative:
          'Non lesioni ossee focali sospette in senso patologico attuale ai segmenti scheletrici inclusi in esame.',
      },
    ],
  },
};

export const REGION_ORDER: RegionKey[] = [
  'encefalo',
  'collo',
  'torace',
  'addome_pelvi',
  'scheletro',
];

export const PS_FREE_ID = 'libero';

export const PS_EXAMS: Record<string, PsExam> = {
  cervicale: {
    label: 'TC cervicale',
    title: 'COLONNA CERVICALE',
    contrastoDefault: 'no',
    organs: [
      {
        id: 'giunzione_cc',
        label: 'Giunzione cranio-cervicale',
        negative: 'Normale morfologia della giunzione cranio-cervicale.',
      },
      {
        id: 'allineamento_cervicale',
        label: 'Allineamento vertebre cervicali',
        negative: 'Normale allineamento delle vertebre cervicali.',
      },
      {
        id: 'canale_rachideo',
        label: 'Canale rachideo',
        negative: 'Normale ampiezza del canale rachideo.',
      },
      {
        id: 'dischi_cervicali',
        label: 'Dischi intervertebrali',
        negative: 'Non evidenti ernie discali espulse.',
      },
    ],
  },
  encefalo_urgenza: {
    label: 'TC encefalo (urgenza)',
    title: 'ENCEFALO',
    contrastoDefault: 'no',
    organs: [
      {
        id: 'parenchima_recenti',
        label: 'Parenchima encefalico (lesioni recenti)',
        negative:
          'Non lesioni parenchimali focali recenti a carico degli emisferi cerebrali e cerebellari.',
      },
      {
        id: 'sostanza_bianca',
        label: 'Sostanza bianca periventricolare',
        negative:
          'Diffusa ipodensità della sostanza bianca periventricolare di significato ischemico cronico.',
      },
      {
        id: 'strutture_mediane_ps',
        label: 'Strutture mediane',
        negative: 'Strutture mediane in asse.',
      },
      {
        id: 'solchi_ventricoli',
        label: 'Solchi e ventricoli',
        negative: 'Armonico ampliamento di solchi e ventricoli su base atrofica.',
      },
    ],
  },
  tc_tep: {
    label: 'TC torace per sospetta TEP',
    title: 'TORACE',
    contrastoDefault: 'si',
    organs: [
      {
        id: 'circolo_polmonare',
        label: 'Circolo arterioso polmonare',
        negative:
          'Regolare opacizzazione dei principali rami arteriosi polmonari in assenza di difetti di riempimento endoluminali.',
      },
      {
        id: 'parenchima_tep',
        label: 'Parenchima polmonare',
        negative:
          'Non alterazioni tomodensitometriche parenchimali focali di significato patologico a carico di entrambi i polmoni.',
      },
      {
        id: 'versamento_tep',
        label: 'Versamento pleuro-pericardico',
        negative: 'Non falde di versamento pleurico né pericardico.',
      },
      {
        id: 'linfonodi_tep',
        label: 'Linfonodi ilo-mediastinici',
        negative: 'Non linfoadenomegalie in sede ilo-mediastinica.',
      },
    ],
  },
  dissezione_aortica: {
    label: 'TC per sospetta dissezione aortica',
    title: 'AORTA / TORACE / ADDOME',
    contrastoDefault: 'si',
    organs: [
      {
        id: 'aorta_toracoaddominale',
        label: 'Aorta toraco-addominale',
        negative:
          "Non segni TC di patologia aortica acuta. Regolare calibro e decorso dell'aorta toraco-addominale.",
        example:
          "Dissezione aortica Stanford tipo B fino all'iliaca comune di sinistra. Falso lume scarsamente opacizzato dal terzo distale dell'aorta toracica discendente sino all'aorta addominale. Regolare il calibro e l'opacizzazione dell'aorta toracica ascendente e dell'arco, con regolare opacizzazione dei tronchi sovraortici.",
      },
      {
        id: 'tronchi_splancnici',
        label: 'Tronchi sovraortici e vasi splancnici',
        negative: "Regolare l'emergenza dei tronchi sovraortici e dei principali vasi splancnici.",
        example:
          "La dissezione coinvolge il tripode celiaco con aspetto filiforme dell'arteria epatica comune e calibro ridotto dell'arteria splenica. La dissezione coinvolge anche l'arteria mesenterica superiore, con calibro filiforme nel tratto prossimale e non opacizzata nel tratto medio-distale. Arteria renale di sinistra con origine dal falso lume, non opacizzata, con conseguente ischemia del rene di sinistra. Arteria mesenterica inferiore con origine dal vero lume, di aspetto filiforme. Arteria renale di destra con origine dal vero lume, opacizzata. Regolarmente opacizzati gli assi iliaci bilateralmente.",
      },
      {
        id: 'parenchima_dissezione',
        label: 'Parenchima polmonare',
        negative:
          'Non alterazioni tomodensitometriche parenchimali focali di significato patologico a carico di entrambi i polmoni.',
      },
      {
        id: 'versamento_dissezione',
        label: 'Versamento pleuro-pericardico',
        negative: 'Non falde di versamento pleurico né pericardico.',
      },
      {
        id: 'linfonodi_dissezione',
        label: 'Linfonodi ilo-mediastinici',
        negative: 'Non linfoadenomegalie in sede ilo-mediastinica.',
      },
      {
        id: 'fegato_dissezione',
        label: 'Fegato',
        negative:
          'Fegato ai limiti di norma per dimensioni e morfologia, esente da alterazioni tomodensitometriche focali.',
      },
      {
        id: 'colecisti_vie_biliari',
        label: 'Colecisti e vie biliari',
        negative:
          'Colecisti normodistesa, alitiasica; vie biliari intra- ed extra-epatiche non dilatate.',
      },
      {
        id: 'asse_splenoportale',
        label: 'Asse spleno-portale',
        negative: "Pervio l'asse spleno-portale.",
      },
      {
        id: 'pancreas_milza_surreni',
        label: 'Pancreas, milza e surreni',
        negative: 'Non alterazioni a carico di pancreas, milza e surreni.',
        example:
          'Multipli foci ischemici a carico della milza. Pancreas con ridotto enhancement in quadro di iniziale sofferenza ischemica, con discreta falda fluida periviscerale.',
      },
      {
        id: 'reni_dissezione',
        label: 'Reni e vie escretrici',
        negative:
          'Reni in sede, con regolare differenziazione cortico-midollare, esenti da alterazioni focali; non idroureteronefrosi bilateralmente.',
      },
      {
        id: 'linfonodi_lomboaortici',
        label: 'Linfonodi lomboaortici',
        negative: 'Non linfoadenomegalie in sede lomboaortica.',
      },
      {
        id: 'complicanze_ischemiche',
        label: 'Complicanze ischemiche addominali',
        negative:
          'Non segni di complicanza ischemica a carico dei visceri addominali; non falde di versamento libero endoaddominale.',
        example:
          "Discreta falda ascitica endoaddominale. Ischemia intestinale interessante tutta la cornice colica. Scarsa opacizzazione parietale dell'ultima ansa ileale. Scarso enhancement parietale dello stomaco.",
      },
    ],
  },
  massiccio: {
    label: 'TC massiccio facciale',
    title: 'MASSICCIO FACCIALE',
    contrastoDefault: 'no',
    organs: [
      {
        id: 'scheletro_massiccio',
        label: 'Scheletro del massiccio facciale e basicranio',
        negative: 'Normale morfologia dello scheletro del massiccio facciale e del basicranio.',
      },
      {
        id: 'rinofaringe',
        label: 'Rinofaringe',
        negative: 'Normale profilo del rinofaringe.',
      },
      {
        id: 'cavita_paranasali',
        label: 'Cavità paranasali',
        negative: 'Normale areazione delle cavità paranasali.',
      },
      {
        id: 'parti_molli_massiccio',
        label: 'Parti molli del massiccio facciale',
        negative: 'Non evidenza di processi patologici nelle parti molli del massiccio facciale.',
      },
    ],
  },
  angio_arti_inf: {
    label: 'Angio-TC arti inferiori',
    title: 'ASSE AORTO-ILIACO / ARTI INFERIORI',
    contrastoDefault: 'si',
    organs: [
      {
        id: 'aorta_sottorenale',
        label: 'Aorta addominale sottorenale e assi iliaci',
        negative:
          "Regolare calibro e decorso dell'aorta addominale sottorenale e degli assi iliaci, bilateralmente.",
      },
      {
        id: 'femorali_comuni',
        label: 'Assi arteriosi femorali comuni',
        negative: "Regolare l'opacizzazione degli assi arteriosi femorali comuni.",
      },
      {
        id: 'femorale_sup_prof',
        label: 'Arteria femorale superficiale e profonda',
        negative:
          'Nei limiti di norma per calibro e decorso; indenni da alterazioni parietali emodinamicamente significative, bilateralmente.',
      },
      {
        id: 'poplitea',
        label: 'Arteria poplitea',
        negative:
          'Regolarmente pervia, indenne da alterazioni parietali emodinamicamente significative, bilateralmente.',
      },
      {
        id: 'tibioperoneale',
        label: 'Tronco tibio-peroneale e arteria tibiale anteriore',
        negative:
          "Pervio il tronco tibio-peroneale; regolare l'emergenza dell'arteria tibiale anteriore, bilateralmente.",
      },
      {
        id: 'distali_gamba',
        label: 'Assi arteriosi distali di gamba',
        negative: 'Pervie e regolarmente riconoscibili sino in sede malleolare, bilateralmente.',
      },
    ],
  },
};

export const PS_PROTOCOL_TECNICA: Record<string, string> = {
  cervicale:
    'Acquisizione spirale del rachide cervicale (estensione C0–D1) senza mezzo di contrasto, direzione cranio-caudale. kVp 120 (140 se paziente su barella spinale); mAs a modulazione automatica; spessore di strato <2 mm, passo <1 mm, algoritmo osso.',
  encefalo_urgenza:
    'Acquisizione cranio-encefalica (estensione da C1 al vertice) senza mezzo di contrasto, tecnica assiale (o spirale se paziente non collaborante), direzione caudo-craniale. kVp 120; mAs a modulazione automatica; spessore di strato ≤2 mm.',
  tc_tep:
    'AngioTC del torace per sospetta embolia polmonare: acquisizione basale senza mdc (opzionale) seguita da fase arteriosa con tecnica bolus-tracking (ROI in tronco polmonare/atrio destro, soglia 100 HU, ritardo minimo), estesa a tutto il torace. kVp 80-100; mAs a modulazione automatica; spessore di strato ≤1.5 mm; IDR 1.4-1.6 gI/s.',
  dissezione_aortica:
    'AngioTC per sospetta dissezione aortica: scansione basale senza mdc non cardiosincronizzata, fase arteriosa con tecnica bolus-tracking (ROI in ventricolo sinistro, soglia 150-200 HU) e fase venosa; estensione dagli apici polmonari al diaframma (cardiosincronizzata) e dal diaframma alla radice della coscia (non cardiosincronizzata), direzione cranio-caudale in apnea inspiratoria. kVp 70-120; mAs a modulazione automatica; spessore di strato ≤2 mm; IDR 1.6-2.2 gI/s.',
  massiccio:
    "TC del massiccio facciale senza mezzo di contrasto (con eventuali fasi contrastografiche arteriosa a 40s e venosa a 80s se cliniche indicate), estensione dal vertice all'osso ioide, direzione caudo-craniale. kVp 120; mAs a modulazione automatica (≤200 mA); spessore di strato 0.6-1.25 mm; IDR 1.6 gI/s; quantità 0.42 gI/kg.",
  angio_arti_inf:
    "AngioTC dell'aorta addominale e degli arti inferiori: fase arteriosa con tecnica bolus-tracking (ROI sull'aorta addominale sopraceliaca, soglia 150 HU, ritardo minimo), estensione dal diaframma ai piedi, direzione cranio-caudale. kVp 90-130; mAs a modulazione automatica; spessore di strato ≤1.5 mm; IDR 1.4-1.8 gI/s.",
};

export const RELATED_ORGANS: Record<string, string[]> = {
  parenchima_enc: ['ventricoli_mediane'],
  ventricoli_mediane: ['parenchima_enc'],
  tiroide: ['linfonodi_collo'],
  linfonodi_collo: ['tiroide'],
  ghiandole_salivari: ['linfonodi_collo'],
  laringe: ['linfonodi_collo'],
  parenchima_polm: ['consolidamenti', 'trachea_bronchi', 'versamento_torace'],
  consolidamenti: ['parenchima_polm'],
  trachea_bronchi: ['parenchima_polm'],
  versamento_torace: ['parenchima_polm', 'cuore'],
  cuore: ['versamento_torace'],
  linfonodi_torace: ['parenchima_polm'],
  fegato: ['vie_biliari', 'colecisti'],
  vie_biliari: ['colecisti', 'fegato'],
  colecisti: ['vie_biliari', 'fegato'],
  asse_portale: ['fegato', 'milza'],
  milza: ['asse_portale'],
  pancreas: ['vie_biliari'],
  stomaco: ['tenue'],
  surreni: ['reni'],
  reni: ['vescica'],
  vescica: ['reni', 'prostata', 'utero_annessi'],
  prostata: ['vescica'],
  utero_annessi: ['vescica'],
  tenue: ['colon'],
  colon: ['tenue', 'retto'],
  retto: ['colon'],
  aorto_bisiliaco: ['vasi_splancnici'],
  vasi_splancnici: ['aorto_bisiliaco', 'reni'],
};

export const QUESITO_PREFIX = 'In merito al quesito diagnostico, si documenta: ';
