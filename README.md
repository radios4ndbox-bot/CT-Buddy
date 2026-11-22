# CT Buddy

Assistente per la refertazione TC: **app mobile** (iOS/Android) e **sito web** con la tua libreria di pre-referti.
Evoluzione di [CT-Assistant](https://github.com/radios4ndbox-bot/CT-Assistant).

Il progetto completo (visione, architettura, modello dati, roadmap) è in [docs/PROGETTO.md](docs/PROGETTO.md).

## Struttura

```
apps/            (in arrivo) mobile = Expo, web = Next.js
packages/
  core/          dati clinici + motore del referto, TypeScript puro e testato
  config/        tsconfig condiviso
supabase/
  migrations/    schema Postgres + RLS (un utente vede solo i propri dati)
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
pnpm build
pnpm format
```

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

## Supabase

Lo schema è in `supabase/migrations/`. Per applicarlo serve un progetto Supabase in regione UE:

```powershell
npx supabase link --project-ref <ref>
npx supabase db push
```

> ⚠️ Nessun dato identificativo del paziente deve mai finire nel database: la libreria contiene solo modelli anonimi.
