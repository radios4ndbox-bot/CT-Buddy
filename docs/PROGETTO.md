# CT Buddy — Documento di progetto

> Stato: **v0.3** · 22/11/2026 · Fasi 0 ✅ (tranne la creazione del progetto Supabase), 1 ✅, 2 ✅
> Origine: evoluzione di [CT-Assistant](https://github.com/radios4ndbox-bot/CT-Assistant) (`index.html` monolitico).

---

## 1. Visione

**CT Buddy** è l'assistente tascabile del radiologo per la refertazione TC.

- **App mobile prima di tutto** (iOS + Android): configuri l'esame, scrivi solo i reperti positivi e ottieni un referto strutturato pronto da copiare. Funziona **anche offline**.
- **Sito web dedicato** con lo stesso account: da lì apri la tua **libreria di pre-referti** (modelli), la consulti, la modifichi e copi il testo al PC di refertazione.
- **Mai dati del paziente nel cloud.** La libreria contiene solo modelli anonimi.

### Cosa NON è (per ora)

- Non è un RIS/PACS e non ci si integra (niente DICOM/HL7 nella v1).
- Non archivia referti di pazienti reali.
- Non è un dispositivo medico che fa diagnosi: è uno strumento per scrivere il testo (vedi §9).

---

## 2. Cosa c'è oggi in CT-Assistant (da conservare)

Un unico `index.html` (~313 KB, ~4.200 righe: HTML + CSS + JS insieme, salvataggio in `localStorage`).

| Area               | Funzionalità                                                                                                                                                                                                                                                        | Dati / logica principali                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acquisizione**   | Dal quesito clinico ricava una griglia distretto × fase; selezione manuale per distretti e patologie; "Ricordami" e cronologia; formato breve; "La accendiamo" lo passa nella Tecnica                                                                               | `PROTOCOL_LIBRARY` (~21 indicazioni da SIRM 2022), `DISTRICTS_ACQ` (9), `FASI_ACQ` (5), `matchProtocolSuggestions`, apprendimento delle parole chiave                             |
| **Refertazione**   | Sesso, elettiva o PS, mdc (agente/concentrazione/quantità/flusso), fasi, confronto con TC precedente; regioni d'esame o protocollo PS; Tecnica; import da PACS; reperti per organo negativi di default; "flag it" per le conclusioni; referto esteso o breve; copia | `REGIONS` (5 regioni, ~33 organi con frase negativa ed esempi), `PS_EXAMS` (6 protocolli), `PS_PROTOCOL_TECNICA`, `ORGAN_KEYWORDS`, `RELATED_ORGANS`, `AGENTI_MDC_CONCENTRAZIONI` |
| **Import PACS**    | Incolli le frasi positive e il tool le smista per organo, imparando dalle tue correzioni                                                                                                                                                                            | `splitPastedText`, `classifyPacsChunk`, `normalizeForMatch`, archivio delle parole chiave apprese                                                                                 |
| **Ordine mentale** | Promemoria didattico sull'ordine di lettura per regione e per protocollo PS                                                                                                                                                                                         | `ORDINE_MENTALE_PRINCIPLES/TIPS/PS_NOTES`                                                                                                                                         |
| **Profili**        | Sezioni escluse di default ("yeet"), modalità apprendimento                                                                                                                                                                                                         | `tc_assistant_profili` in localStorage                                                                                                                                            |

**Problemi da risolvere:** tutto in un file solo, nessun test, dati legati al singolo browser, nessuna sincronizzazione, poco utilizzabile su telefono, logica e interfaccia mescolate.

---

## 3. Architettura

```
ct-buddy/                         monorepo · pnpm workspaces + Turborepo · TypeScript
├─ apps/
│  ├─ mobile/                     Expo (React Native) + Expo Router — l'app principale
│  └─ web/                        Next.js (App Router) — libreria e area personale
├─ packages/
│  ├─ core/                       ⭐ dati clinici + motore del referto (TS puro, zero UI)
│  ├─ db/                         tipi generati da Supabase, query condivise, schemi Zod
│  └─ config/                     tsconfig, eslint, prettier condivisi
├─ supabase/
│  ├─ migrations/                 schema SQL + regole RLS
│  └─ seed.sql
└─ docs/
```

### Principio guida: `packages/core` è il cuore

Tutta la conoscenza clinica e la logica di composizione stanno in **funzioni pure e testabili**, senza DOM e senza React:

```ts
// esempi di API di packages/core
buildReport(config: ExamConfig, findings: Findings, opts): { esteso: string; breve: string }
buildTecnica(config: ExamConfig): string
suggestProtocols(quesito: string, learned?: LearnedKeywords): ProtocolMatch[]
classifyPacsText(text: string, organs: Organ[], learned?): ClassifiedChunk[]
draftConclusioni(flagged: Finding[]): string
```

App e sito importano lo stesso `core`, così il referto è **identico ovunque**. I dati clinici (`REGIONS`, `PS_EXAMS`, `PROTOCOL_LIBRARY`…) diventano moduli TS **versionati** (`dataVersion`), così un modello salvato sa con quale versione del catalogo è stato creato.

### Stack

| Livello                  | Scelta                                                                          | Perché                                                                         |
| ------------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Mobile                   | **Expo SDK 58 + Expo Router**, StyleSheet con tema proprio                      | Un solo codice per iOS e Android, build sugli store con EAS, aggiornamenti OTA |
| Archivio locale (mobile) | **expo-sqlite** (oppure WatermelonDB, se la sincronizzazione diventa complessa) | Offline-first                                                                  |
| Web                      | **Next.js** su Vercel (oppure Netlify), Tailwind + shadcn/ui                    | Login, libreria, editor dei modelli                                            |
| Backend                  | **Supabase**, progetto in **regione UE** (Francoforte)                          | Auth + Postgres + RLS: ognuno vede solo i propri dati                          |
| Auth                     | Email magic link + Sign in with Apple/Google                                    | Niente password da gestire; Apple è obbligatorio se c'è Google su iOS          |
| Validazione              | Zod (schemi condivisi in `packages/db`)                                         | Stesso controllo dei dati su client e server                                   |
| Test                     | Vitest (core), Playwright (web), Maestro (mobile, più avanti)                   |                                                                                |
| CI                       | GitHub Actions: typecheck, lint, test e build                                   |                                                                                |

---

## 4. Modello dati (Supabase)

> Regola d'oro: **nessun campo che possa identificare un paziente.** Niente nome, codice fiscale, data di nascita, numero di accesso. Il confronto con la TC precedente nei modelli è un segnaposto (`{{data_confronto}}`), non una data reale.

```sql
profiles            -- 1:1 con auth.users
  id uuid pk (= auth.uid)
  display_name text
  default_settings jsonb       -- es. agente mdc preferito, flusso, forma esteso/breve
  yeet_sections text[]         -- sezioni escluse di default (ex "profili")
  created_at, updated_at

templates           -- ⭐ i "pre-referti" della libreria
  id uuid pk
  owner_id uuid fk → profiles
  title text                   -- "TC addome colica renale – primo esame"
  modality text default 'TC'   -- pronto per RM/eco in futuro
  setting text                 -- 'elettiva' | 'urgenza'
  exam_config jsonb            -- regioni/protocollo PS, mdc, fasi, acquisizione
  findings jsonb               -- reperti positivi predefiniti per organo
  conclusioni text
  rendered_esteso text         -- testo generato e salvato (per lettura veloce sul web)
  rendered_breve text
  tags text[]
  is_favorite bool
  data_version int             -- versione del catalogo core usata
  updated_at timestamptz       -- per la sincronizzazione (vince l'ultima modifica)
  deleted_at timestamptz null  -- cancellazione "morbida", serve alla sincronizzazione

acq_presets         -- griglie di Acquisizione salvate con "Ricordami"
  id, owner_id, name, matrix jsonb, keywords text[], updated_at, deleted_at

learned_keywords    -- ciò che il tool impara (PACS, protocolli, organi)
  id, owner_id, scope text ('pacs'|'protocol'|'organ'), target_id text, keyword text, updated_at
```

**RLS** su tutte le tabelle: `owner_id = auth.uid()` per select/insert/update/delete.

**Sincronizzazione (v1):** ogni tabella ha `updated_at` e `deleted_at`. L'app tiene una copia in SQLite e sincronizza scaricando i record modificati dall'ultimo `updated_at` e caricando le modifiche fatte in locale. In caso di conflitto vince l'ultima modifica, che per un solo utente su pochi dispositivi basta e avanza.

---

## 5. Funzionalità per piattaforma

| Funzionalità                                                                   |    Mobile    |             Web             |
| ------------------------------------------------------------------------------ | :----------: | :-------------------------: |
| Refertazione guidata completa (impostazioni → reperti → conclusioni → referto) |      ✅      |           ✅ (v2)           |
| Acquisizione: dal quesito alla griglia delle fasi                              |      ✅      |           ✅ (v2)           |
| Import di testo da PACS e smistamento per organo                               | ✅ (incolla) |             ✅              |
| Libreria pre-referti: elenco, ricerca, tag, preferiti                          |      ✅      |             ✅              |
| Modifica di un modello                                                         |      ✅      | ✅ editor comodo da desktop |
| Copia del referto negli appunti                                                |      ✅      |         ✅ un clic          |
| Ordine mentale (didattica)                                                     |      ✅      |             ✅              |
| Profilo e impostazioni predefinite ("yeet")                                    |      ✅      |             ✅              |
| Funzionamento offline                                                          |      ✅      |             ❌              |
| Esportazione e importazione della libreria (JSON)                              |      ✅      |             ✅              |

**Flusso tipico:** in reparto, o la sera prima, preparo sul telefono un modello ("TC torace-addome stadiazione, controllo"). Al PC di refertazione apro `ctbuddy.app`, cerco "stadiazione", copio il testo e lo incollo nel RIS.

---

## 6. Schermate dell'app (bozza)

1. **Home**: modelli recenti e preferiti, pulsante grande "Nuovo referto", ricerca.
2. **Nuovo referto (wizard)**: ① Esame (elettiva o PS, regioni o protocollo, mdc e fasi) → ② Reperti (un organo per scheda, negativo di default, scorri per segnare un positivo, gli esempi si inseriscono con un tocco) → ③ Conclusioni → ④ Anteprima esteso/breve, poi **Copia** o **Salva come modello**.
3. **Acquisizione**: campo per il quesito, suggerimenti, griglia distretto × fase (anche orizzontale su telefono), "Usa nella Tecnica".
4. **Libreria**: elenco con filtri (regione, elettiva/PS, tag), scorri per fare un duplicato o eliminare.
5. **Ordine mentale**: schede consultabili.
6. **Profilo**: account, impostazioni predefinite, sezioni escluse, esportazione, info e avvertenze.

Sito web: **Accedi → Libreria** (tabella e anteprima affiancate), **Editor del modello** su due colonne (configurazione a sinistra, testo a destra), **Impostazioni**.

---

## 7. Roadmap

| Fase                              | Contenuto                                                                                                                                                                   | Cosa ottengo alla fine                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| **0. Fondamenta** ✅              | Monorepo, CI, progetto Supabase UE, schema e RLS, `packages/config`                                                                                                         | Repo pronta, pipeline verde                  |
| **1. Porting del core** ✅        | Estrarre da `index.html` i dati e le funzioni di composizione in `packages/core`, con **test di non-regressione** (stessi input producono lo stesso testo del vecchio tool) | Motore del referto testato al 100%           |
| **2. App mobile locale (MVP)** ✅ | Wizard di refertazione, libreria **solo in locale** (SQLite), copia                                                                                                         | App usabile ogni giorno, anche senza account |
| **3. Account e sincronizzazione** | Login, sincronizzazione della libreria, profilo e parole chiave apprese                                                                                                     | Stessi dati su più dispositivi               |
| **4. Sito web: libreria**         | Login, elenco e ricerca, anteprima, copia, editor dei modelli                                                                                                               | Pre-referti accessibili dal PC               |
| **5. Acquisizione e import PACS** | Porting completo sul mobile e sul web                                                                                                                                       | Parità di funzioni con CT-Assistant          |
| **6. Rifinitura e store**         | Icona e brand, onboarding, TestFlight / Play beta interna, privacy policy                                                                                                   | Prima beta                                   |
| **Dopo**                          | Condivisione di modelli tra colleghi o reparto, RM ed eco, dettatura vocale dei reperti, assistente AI per riformulare                                                      | —                                            |

---

## 8. Strategia di porting da `index.html`

1. **Dati, prima di tutto:** `REGIONS`, `PS_EXAMS`, `PS_PROTOCOL_TECNICA`, `PROTOCOL_LIBRARY`, `DISTRICTS_ACQ`, `FASI_ACQ`, `FASI_MDC`, `AGENTI_MDC_CONCENTRAZIONI`, `ORGAN_KEYWORDS`, `RELATED_ORGANS`, `ORDINE_MENTALE_*` diventano file TS tipizzati in `packages/core/src/data/`.
2. **Funzioni pure:** `buildTecnicaText`, `buildRegionLines`, `renderOutput` (solo la parte che compone il testo), `generateConclusioniDraft`, `buildAcqBreveText`, `matchProtocolSuggestions`, `classifyPacsChunk`, `splitPastedText`, `normalizeForMatch` e `joinItalian` vengono separate dal DOM e da `state`.
3. **Test "golden":** si fa girare il vecchio `index.html` in un browser senza interfaccia (Playwright) con N configurazioni, si salvano i testi che produce come riferimento, e il nuovo `core` deve dare lo stesso risultato.
4. **Migrazione dei dati utente:** un pulsante "Importa da CT-Assistant" legge le chiavi `tc_assistant_*` esportate in JSON (profili, cronologia, griglie salvate, parole chiave apprese) e le carica nel nuovo account.
5. Le animazioni "liquid toggle" e l'interfaccia si **riprogettano da zero**, non si portano.

---

## 9. Privacy, sicurezza e aspetti regolatori

- **Niente dati del paziente** (GDPR art. 9): i modelli sono anonimi per come sono fatti. Sul mobile, il testo del referto in corso resta **solo sul dispositivo** e non viene sincronizzato. Un avviso nell'editor ricorda di non inserire dati identificativi, e un controllo leggero segnala testo che sembra un codice fiscale o una data di nascita.
- Supabase **in regione UE**, RLS ovunque, nessuna chiave di servizio nei client.
- Servono una privacy policy e i termini d'uso (obbligatori per gli store).
- **MDR (regolamento UE sui dispositivi medici):** finché CT Buddy compone testo deciso dal medico e non fa diagnosi, resta fuori dal perimetro dei dispositivi medici. Va scritto chiaramente nell'app ("strumento di supporto alla redazione, la responsabilità clinica resta del medico"). Funzioni future di suggerimento diagnostico o AI vanno rivalutate prima.
- Le parti tratte da SIRM 2022: citare la fonte. Se si arriva a una distribuzione pubblica, verificare che il riuso sia consentito.

---

## 10. Decisioni aperte

1. **Nome del dominio** (`ctbuddy.app`, `ctbuddy.it`…) e bundle id (`app.ctbuddy`).
2. **Sito web in v1: solo libreria (consultazione e modifica) o anche la refertazione completa?** Proposta: solo libreria in v1, refertazione completa in v2.
3. **Account obbligatorio?** Proposta: no. L'app funziona in locale senza account, e il login serve solo per sincronizzare e usare il web.
4. **Condivisione dei modelli tra colleghi** dalla v1 o più avanti? Proposta: più avanti (cambia RLS e modello dati: `team_id`).
5. **Lingua:** solo italiano in v1? Le stringhe passano comunque da i18n fin da subito.
6. **Distribuzione:** beta privata (TestFlight / Play test interno) o pubblicazione aperta?
7. **Monetizzazione:** gratis, freemium (sincronizzazione a pagamento) o licenze per reparto? Conviene deciderlo prima della fase 3.
