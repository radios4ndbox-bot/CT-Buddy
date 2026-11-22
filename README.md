# CT Buddy

Assistente per la refertazione TC: **app mobile** (iOS/Android) e **sito web** con la tua libreria di pre-referti.
Evoluzione di [CT-Assistant](https://github.com/radios4ndbox-bot/CT-Assistant).

Il progetto completo (visione, architettura, modello dati, roadmap) è in [docs/PROGETTO.md](docs/PROGETTO.md).

## Struttura

```
apps/
  mobile/        app Expo (iOS, Android; la versione web serve solo come anteprima)
  web/           sito Next.js: accesso via email, libreria, QR per collegare il telefono
packages/
  core/          dati clinici + motore del referto, TypeScript puro e testato
  db/            modello della libreria, sincronizzazione, collegamento dispositivi (Supabase)
  config/        tsconfig condiviso
supabase/
  migrations/    schema Postgres + RLS (un utente vede solo i propri dati)
  functions/     Edge Function claim-pairing (collegamento del telefono tramite QR)
legacy/          il vecchio CT-Assistant (index.html), riferimento per i test di parità
tools/           script di supporto (estrazione dati dal vecchio tool)
```

## Requisiti

- Node.js ≥ 20
- pnpm 9 (`corepack enable` oppure `npm install -g pnpm@9`)

## Comandi

```powershell
pnpm install
pnpm test        # test del core, compresa la parità con il vecchio tool
pnpm typecheck
pnpm lint
pnpm build
pnpm format
```

## L'app mobile

```powershell
cd apps/mobile
npx expo start          # poi scansiona il QR con Expo Go (Android) o con la fotocamera (iOS)
npx expo start --web    # anteprima nel browser
```

Per aggiungere dipendenze all'app usa sempre `npx expo install <pacchetto>` (sceglie versioni
compatibili con l'SDK). Le regole Expo per gli agenti sono in `apps/mobile/AGENTS.md`.

Cosa fa (Fase 2):

- **Referto** in 4 passi: Esame (sesso, elettiva o PS, regioni o protocollo, mdc, fasi, confronto,
  Tecnica modificabile) → Reperti (organi negativi di default, esempi pre-scritti, 🎯 quesito,
  🚩 conclusioni con scelta delle parole, esclusione) → Conclusioni (bozza automatica) →
  Referto (esteso o breve, copia negli appunti, salva come modello).
- **Libreria** locale: ricerca, filtri, preferiti, rinomina, elimina, "Usa come base".
  Su iOS/Android è in SQLite (`src/library/store.ts`), nell'anteprima web in localStorage
  (`store.web.ts`). Lo schema rispecchia la tabella `templates` di Supabase.
- **Controllo privacy** prima di salvare: avvisa se trova nominativi, codici fiscali, date,
  email o telefoni (`findPatientDataWarnings` nel core).
- **Ordine mentale**.

La bozza del referto in corso resta solo in memoria (`src/state/draft.ts`) e non viene mai
salvata né sincronizzata.

## Il core

`@ct-buddy/core` contiene tutto ciò che serve per comporre un referto, senza UI:

```ts
import { buildReport, defaultExamConfig, examOrgans, createOrganStates } from '@ct-buddy/core';

const config = { ...defaultExamConfig(), regions: ['torace', 'addome_pelvi'] };
const organs = createOrganStates(examOrgans(config));
organs.fegato = {
  ...organs.fegato!,
  positive: true,
  text: 'Cisti epatica di 8 mm al VI segmento.',
};

const referto = buildReport({ config, organs, compact: false });
```

Funzioni principali: `buildReport` / `buildReportForms` (esteso e breve), `buildTecnica`,
`draftConclusioni`, `splitPastedText` + `classifyPacsChunk` (import da PACS),
`suggestProtocols` / `searchRules` / `mergeRuleIntoAcq` / `buildAcqBreve` (Acquisizione).

### Dati clinici

I file in `packages/core/src/data/` sono **generati** dal vecchio tool con:

```powershell
pnpm extract:legacy
```

Dopo il porting si possono modificare a mano: in quel caso incrementa `DATA_VERSION` in
`packages/core/src/index.ts`.

### Test di parità

`packages/core/test/legacy-parity.test.ts` carica `legacy/ct-assistant.html` in jsdom e confronta,
su centinaia di scenari casuali riproducibili, il testo del nuovo core con quello del vecchio tool
(referto esteso e breve, conclusioni, import PACS, Acquisizione). Se un cambiamento è **voluto**
(es. una nuova frase), il test va aggiornato in modo esplicito.

## Sincronizzazione e sito

La libreria dell'app e quella del sito sono la stessa, salvata su Supabase:

- **Sito** (`apps/web`): accedi con un link via email, consulti e gestisci i modelli (ricerca,
  anteprima esteso/breve, copia, preferiti, rinomina, elimina) e, da **Collega il telefono**,
  ottieni un QR code monouso.
- **App**: Libreria → **Collega con QR code**, inquadri il QR e il telefono entra nel tuo account
  senza password. Da lì sincronizza da solo (all'avvio, al ritorno in primo piano, dopo ogni
  modifica). Funziona anche offline: le modifiche partono quando torna la rete.
- **Conflitti**: vince la modifica più recente; le cancellazioni si propagano. La logica è in
  `packages/db/src/sync.ts`, con test che simulano più dispositivi, rete assente e orologi
  sbagliati.

```powershell
npm --prefix apps/web run dev    # sito su http://localhost:3000
```

Senza configurazione app e sito funzionano lo stesso: l'app resta solo locale, il sito mostra un
avviso. **Per attivare tutto segui [docs/SUPABASE.md](docs/SUPABASE.md)** (creazione del progetto,
migrazioni, Edge Function, file `.env`).

> ⚠️ Nessun dato identificativo del paziente deve mai finire nel database: la libreria contiene solo modelli anonimi.
