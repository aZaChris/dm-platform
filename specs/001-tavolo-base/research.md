# Research: Tavolo base

Nota: le funzioni di Supabase qui descritte sono quelle documentate al momento della stesura.
Il comportamento di Realtime e Storage va **confermato con il quickstart** prima di dare il
lavoro per chiuso.

## 1. Sincronizzazione dei token

- **Decisione**: i token stanno in una tabella; ogni client si abbona a Postgres Changes filtrato
  su `campaign_id`. Il client scrive la posizione solo su `dragend`.
- **Perché**: lo stato è già persistito, quindi chi entra in ritardo lo legge con una select
  (FR-011) senza logica in più. Le RLS valgono anche per gli eventi di insert/update.
  La latenza attesa (poche centinaia di ms) rispetta SC-003 (<1 s).
- **Scartato**: Broadcast durante il trascinamento. Dà il "fantasma" che si muove in diretta ma
  richiede stato effimero, throttling e riconciliazione. Si aggiunge in una feature successiva
  solo se il tavolo risulta troppo "a scatti".

## 2. Permessi

- **Decisione**: due funzioni helper `is_member(campaign_id)` e `is_dm(campaign_id)`, marcate
  `security definer`, usate da tutte le policy.
- **Perché**: una policy su `campaign_members` che interroga `campaign_members` va in ricorsione
  infinita; la funzione `security definer` la evita.
- **Scartato**: controlli di ruolo nel client (aggirabili, viola il principio III).
- **Limite noto**: la RLS non limita le colonne. Un Player può cambiare nome o colore del proprio
  token, non assegnarlo a un altro (il `WITH CHECK` impone `owner_id = auth.uid()`). Accettato.

## 3. Inviti

- **Decisione**: tabella `invites` con `token` uuid, scadenza di 7 giorni e uso singolo; il
  riscatto passa da `join_campaign(token)` con un solo `UPDATE ... WHERE used_at IS NULL AND
  expires_at > now() RETURNING`, che rende l'uso monouso atomico anche con due richieste insieme.
- **Link**: `https://<dominio>/#/invito/<token>`. Il token non è indovinabile (uuid v4).
- **Scartato**: invito per email (serve invio posta, fuori ambito) e codice breve (indovinabile).

## 4. Mappa e immagini

- **Decisione**: bucket privato `maps`, percorso `<campaign_id>/<uuid>.<ext>`, limite 5 MB e solo
  jpeg/png/webp impostati sul bucket (FR-012). Il client usa un signed URL (1 h).
- **Perché**: i controlli sul bucket li applica Supabase; il percorso con `campaign_id` permette
  policy di Storage basate su `is_member`/`is_dm`.
- **Scartato**: bucket pubblico (chiunque con l'URL vede la mappa, contro FR-004).

## 5. Posizione dei token in celle

- **Decisione**: i token salvano `col, row` interi, non pixel. Cella fissa da 50 px (costante nel
  client).
- **Perché**: sostituire l'immagine di sfondo non sposta i token (US2 scenario 2) e l'aggancio
  alla griglia (FR-009) è implicito.
- **Scartato**: coordinate in pixel (si rompono al cambio mappa) e `cell_px` configurabile (YAGNI,
  l'assunzione dice "cella fissa").

## 6. Aspetto del token

- **Decisione**: nome + colore; sul disco compare il colore con le iniziali.
- **Perché**: l'immagine sul token richiede upload, bucket e policy in più. È una **semplificazione
  rispetto alla descrizione iniziale** ("immagine o colore"): si riprende in una feature dedicata.

## 7. Routing e stato

- **Decisione**: routing a hash scritto a mano; stato con `useState` e un solo hook `useTable`.
- **Perché**: 4 schermate non giustificano `react-router` (~20 KB) né una libreria di stato.
- **Limite noto**: se le schermate crescono molto, passare a `react-router`.

## 8. Autenticazione

- **Decisione**: email + password con Supabase Auth, **conferma email disattivata** nelle impostazioni
  del progetto. Nome visibile preso dai metadati di registrazione, in alternativa dall'email.
- **Perché**: il mittente di default di Supabase ha un limite basso di email orarie; con amici
  fidati la conferma non serve. Da riattivare con un SMTP proprio se il gruppo si allarga.

## 9. Eliminazione dei token e Realtime

- **Decisione**: `REPLICA IDENTITY FULL` sulla tabella `tokens`, così gli eventi di DELETE portano
  `campaign_id` e il filtro funziona.
- **Rischio residuo**: Realtime non applica la RLS agli eventi DELETE; chi conoscesse l'uuid di una
  campagna potrebbe vedere gli id dei token eliminati. Accettabile per un tavolo tra amici (l'uuid
  non è indovinabile e il payload non contiene dati sensibili).

## 10. Test

- **Decisione**: Vitest solo su `snapToCell` e `clampToMap`; le RLS con il quickstart a due utenti.
- **Perché**: costituzione, principio IV: test dove c'è logica non banale. Un test automatico delle
  RLS richiederebbe Supabase locale con Docker, peso sproporzionato per questa fase.
