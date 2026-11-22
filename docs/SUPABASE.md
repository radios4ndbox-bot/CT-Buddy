# Collegare CT Buddy a Supabase

Guida passo passo per attivare la sincronizzazione della libreria tra app e sito e il
collegamento del telefono tramite QR code. Serve una volta sola, circa 15 minuti.

## Come funziona

```
 Sito (browser)                       Supabase (UE)                         App (telefono)
 ─────────────                        ─────────────                         ──────────────
 1. accedi con link email   ───────►  Auth
 2. «Collega il telefono»   ───────►  create_pairing()  → codice monouso (3 min)
    mostra QR + codice                                                  ◄── 3. inquadri il QR
                                      Edge Function claim-pairing  ◄─────── 4. invia il codice
                                      (verifica, segna come usato,
                                       genera token monouso)  ─────────────► 5. apre la sessione
 6. la libreria è la stessa  ◄──────  tabella templates (RLS)  ◄──────────► 6. sincronizzazione
```

- Ognuno vede **solo i propri modelli** (Row Level Security).
- Il codice del QR vale 3 minuti e si può usare una volta; nel database c'è solo il suo hash.
- Sul telefono la sessione è cifrata; il referto in corso non viene mai inviato, solo i modelli
  salvati nella libreria.

## 1. Crea il progetto

1. Vai su [supabase.com](https://supabase.com) e crea un account (piano gratuito).
2. **New project** → nome `ct-buddy`, regione **Central EU (Frankfurt)**, scegli una password
   del database e conservala (serve al punto 3).
3. Da **Project Settings → API Keys** copia:
   - **Project URL** (es. `https://abcdefgh.supabase.co`)
   - **Publishable key** (`sb_publishable_…`)

   La _secret key_ (`sb_secret_…`) **non** va mai copiata nei file dell'app o del sito, né
   incollata in chat: la usa solo la Edge Function, che la riceve in automatico.

## 2. Configura l'accesso via email

**Authentication → URL Configuration**:

- **Site URL**: `http://localhost:3000` (quando pubblicheremo il sito diventerà il suo indirizzo)
- **Redirect URLs**: aggiungi `http://localhost:3000/auth/callback`

> Il servizio email incluso in Supabase ha un limite basso di invii orari: va bene per le prove.
> Per l'uso reale si configura un provider SMTP (Authentication → Emails).

## 3. Crea le tabelle

Dalla cartella del progetto (`C:\dev\CT-Buddy`), in PowerShell:

```powershell
npx supabase login
```

```powershell
npx supabase link --project-ref abcdefgh
```

(`abcdefgh` è la parte iniziale del Project URL; ti chiederà la password del database)

```powershell
npx supabase db push
```

Applica le migrazioni in `supabase/migrations/`: tabelle, regole di accesso e funzioni per
sincronizzazione e collegamento.

## 4. Pubblica la Edge Function

```powershell
npx supabase functions deploy claim-pairing --no-verify-jwt
```

`--no-verify-jwt` è necessario: il telefono la chiama prima di avere una sessione. La sicurezza è
data dal codice monouso.

## 5. Inserisci i dati nei file di configurazione

Crea **`apps/web/.env.local`**:

```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Crea **`apps/mobile/.env`**:

```
EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Entrambi i file sono esclusi da git.

## 6. Prova

1. Avvia il sito:

   ```powershell
   npm --prefix apps/web run dev
   ```

   Apri <http://localhost:3000>, inserisci la tua email e apri il link ricevuto **nello stesso
   browser**.

2. Riavvia l'app (le variabili `EXPO_PUBLIC_*` vengono lette all'avvio del bundler):

   ```powershell
   cd apps/mobile; npx expo start -c
   ```

3. Sul sito vai su **Collega il telefono**. Nell'app: **Libreria → Collega con QR code** e
   inquadra il QR (oppure digita il codice).
4. Salva un modello nell'app: dopo pochi secondi compare nella Libreria del sito (che si aggiorna
   quando torni sulla scheda). Rinominalo o mettilo tra i preferiti dal sito: l'app lo riceve alla
   sincronizzazione successiva (all'apertura, al ritorno in primo piano o con «Sincronizza ora»).

## Da verificare alla prima prova reale

Due dettagli dell'API Supabase non sono descritti esplicitamente nella documentazione e vanno
confermati con il primo collegamento vero:

- la Edge Function legge il token da `generateLink(...).properties.hashed_token`;
- l'app apre la sessione con `verifyOtp({ token_hash, type: 'email' })` e, se fallisce, riprova
  con `type: 'magiclink'`.

Se il collegamento non riesce, i log della funzione sono in **Edge Functions → claim-pairing →
Logs**.
