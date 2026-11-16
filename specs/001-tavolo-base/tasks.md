---

description: "Task list per la feature 001 Tavolo base"
---

# Tasks: Tavolo base

**Input**: documenti in `/specs/001-tavolo-base/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/db-api.md, quickstart.md

**Tests**: richiesti solo per la logica non banale (aggancio alla griglia). Le RLS si verificano con
gli scenari di `quickstart.md` (costituzione, principio IV).

**Organization**: per storia utente. Le tre storie sono tutte P1 ma dipendono in ordine
US1 → US2 → US3 (serve un membro in una campagna per vedere la mappa, e la mappa per i token).

## Format: `[ID] [P?] [Story] Descrizione`

- **[P]**: parallelizzabile (file diversi, nessuna dipendenza da task incompleti)
- **[Story]**: storia utente di riferimento
- Le migrazioni già applicate non si modificano (la CLI non le riesegue): ogni fase aggiunge un
  file nuovo in `supabase/migrations/` (`0002_inviti`, `0003_mappa`, `0004_token`).

## Phase 1: Setup

**Purpose**: ripartire da zero e avere un'app vuota che parte.

- [X] T001 Eliminare le cartelle e i file v1 `server/`, `mobile/`, `web-client/`, `docker-compose.yml`, `__dummy__.ipynb` con `git rm -r` (restano recuperabili dal tag `legacy-v1`)
- [X] T002 Creare l'app Vite + React + TypeScript in `app/` (`package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`) con solo `react`, `react-dom`, `@supabase/supabase-js`, `konva`, `react-konva`; dev: `vite`, `typescript`, `vitest`, `@vitejs/plugin-react`
- [X] T003 [P] Creare `.gitignore` in radice (`node_modules`, `dist`, `.env.local`) e `app/.env.example` con `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` vuote
- [X] T004 [P] Creare il client in `app/src/lib/supabase.ts` leggendo le due variabili d'ambiente
- [X] T005 Creare `app/src/App.tsx` con il routing a hash scritto a mano (`#/` campagne, `#/login`, `#/invito/:token`, `#/tavolo/:id`) e schermate segnaposto

---

## Phase 2: Foundational (blocca tutte le storie)

**Purpose**: schema di base e progetto Supabase pronto.

- [X] T006 Creare `supabase/migrations/0001_tavolo_base.sql` con: enum `role` (`dm`,`player`), tabelle `campaigns` e `campaign_members` (vincoli di `data-model.md`), funzioni `is_member(uuid)` e `is_dm(uuid)` come `security definer`, RLS attiva con le policy di `campaigns` e `campaign_members` dalla matrice permessi
- [X] T007 **Manuale (Christian)**: nel progetto Supabase disattivare "Confirm email", poi `npx supabase link` e `npx supabase db push`; copiare URL e chiave anon in `app/.env.local`

**Checkpoint**: lo schema base è online e `npm run dev` in `app/` parte.

---

## Phase 3: User Story 1 - Accedere e unirsi a una campagna (P1) 🎯 MVP

**Goal**: registrarsi, creare una campagna da DM, entrare con un invito da Player.

**Independent Test**: scenari 1-3 del quickstart (due account, invito usato una volta sola).

- [X] T008 [US1] Creare `supabase/migrations/0002_inviti.sql` con la tabella `invites` con RLS (solo DM) e le funzioni `create_campaign(p_name)` e `join_campaign(p_token)` come da `contracts/db-api.md` (uso singolo atomico con `UPDATE ... RETURNING`, idempotente se già membro, `display_name` da metadati o email)
- [X] T009 [P] [US1] Creare `app/src/pages/Login.tsx` con registrazione (campo nome visibile + email + password) e accesso, e il reindirizzamento in `App.tsx` se non c'è sessione
- [X] T010 [P] [US1] Creare `app/src/pages/Join.tsx`: chiama `join_campaign` col token dell'URL, poi porta a `#/tavolo/<id>`; messaggio chiaro su `invite_invalid`
- [X] T011 [US1] Creare `app/src/pages/Campaigns.tsx`: elenco delle proprie campagne con ruolo, creazione (`create_campaign`), e per il DM il pulsante "Crea invito" che inserisce in `invites` e mostra il link `#/invito/<token>` da copiare
- [X] T012 [US1] Applicare la migrazione (`npx supabase db push --remote`) ed eseguire gli scenari 1-3 del quickstart

**Checkpoint**: due persone si ritrovano nella stessa campagna con ruoli diversi.

---

## Phase 4: User Story 2 - Vedere la mappa condivisa (P1)

**Goal**: il DM carica l'immagine di sfondo, tutti vedono mappa e griglia in tempo reale.

**Independent Test**: scenari 4, 5 e 11 del quickstart.

- [X] T013 [US2] Creare `supabase/migrations/0003_mappa.sql` con la tabella `maps` con RLS, il bucket privato `maps` (5 MB, solo jpeg/png/webp), le policy di Storage basate su `is_member`/`is_dm` sul primo segmento del percorso, e le tabelle `maps` in `supabase_realtime`
- [X] T014 [P] [US2] Creare `app/src/hooks/useTable.ts` (parte mappa): select di `maps`, `createSignedUrl` e abbonamento Postgres Changes su `maps` filtrato per `campaign_id`
- [X] T015 [P] [US2] Creare `app/src/components/MapCanvas.tsx` con `react-konva`: immagine di sfondo, griglia a celle da 50 px (costante) e pannello adattato alla finestra
- [X] T016 [US2] Creare `app/src/pages/Table.tsx` che compone `useTable` + `MapCanvas` e `app/src/components/DmPanel.tsx` con upload dell'immagine (solo se ruolo DM): carica su Storage, `upsert` su `maps`, errori chiari per formato/peso (FR-012)
- [X] T017 [US2] Applicare la migrazione ed eseguire gli scenari 4, 5 e 11 del quickstart

**Checkpoint**: il DM carica una mappa e un Player già connesso la vede comparire.

---

## Phase 5: User Story 3 - Creare e muovere i token in tempo reale (P1)

**Goal**: token creati dal DM, trascinabili con aggancio alla griglia, sincronizzati; i Player muovono solo i propri.

**Independent Test**: scenari 6-9 del quickstart.

- [X] T018 [US3] Creare `supabase/migrations/0004_token.sql` con la tabella `tokens` (check `col >= 0 and row >= 0`, `REPLICA IDENTITY FULL`, RLS con update per DM o `owner_id = auth.uid()` con `WITH CHECK` identico) e `tokens` in `supabase_realtime`
- [X] T019 [P] [US3] Creare `app/src/lib/grid.ts` con `snapToCell(x, y, cellPx)` e `clampToMap(col, row, mapCols, mapRows)`, e `app/src/lib/grid.test.ts` (Vitest) con casi su bordi, centro cella e fuori mappa
- [X] T020 [P] [US3] Estendere `app/src/hooks/useTable.ts` con select dei `tokens`, abbonamento INSERT/UPDATE/DELETE filtrato per `campaign_id`, aggiornamento per `id` (idempotente) e funzione `moveToken(id, col, row)` che scrive solo su `dragend`
- [X] T021 [US3] Estendere `app/src/components/MapCanvas.tsx` con i token come cerchi colorati con iniziali; `draggable` solo se DM o `owner_id` coincide con l'utente; all'`dragend` usa `snapToCell` + `clampToMap` e chiama `moveToken`
- [X] T022 [US3] Estendere `app/src/components/DmPanel.tsx`: creare token (nome, colore, assegnatario scelto tra i membri o "mio"), rinominare, eliminare
- [ ] T023 [US3] Eseguire `npm test` e gli scenari 6-9 del quickstart (incluso il tentativo diretto in console di spostare un token non proprio)

**Checkpoint**: tavolo funzionante end-to-end.

---

## Phase 6: Polish e requisiti trasversali

- [ ] T024 Gestione membri nel `DmPanel.tsx`: elenco membri e pulsante "Rimuovi" (non su se stesso, FR-013); in `useTable.ts` abbonamento ai DELETE di `campaign_members` così chi viene rimosso torna a `#/` subito
- [ ] T025 Eseguire gli scenari 10 e 12 del quickstart e annotare la dimensione gzip reale del bundle in `specs/001-tavolo-base/quickstart.md`; se supera 500 KB, rivedere le dipendenze prima di proseguire
- [ ] T026 (deploy fatto su https://dm-platform-steel.vercel.app, mancano gli scenari 2 e 7 sul dominio pubblico) Deploy su Vercel: progetto con root `app/`, variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; ripetere gli scenari 2 e 7 sul dominio pubblico
- [ ] T027 Registrare le decisioni (Scelta | Perché | Scartato) nella nota `Decisioni DM Platform.md` del vault Obsidian: token su Postgres Changes, posizione in celle, funzioni SQL per campagna e invito, aspetto token solo colore
- [ ] T028 Aggiornare `README.md` in radice (è ancora quello della v1): cosa è il progetto, stack, come avviarlo, link a `specs/001-tavolo-base/quickstart.md`

---

## Dependencies & Execution Order

- Setup (T001-T005) → Foundational (T006-T007) → US1 → US2 → US3 → Polish.
- Dentro Setup: T003 e T004 in parallelo dopo T002.
- US1: T008 prima di T011/T012; T009 e T010 in parallelo (file diversi).
- US2: T013 prima di T016; T014 e T015 in parallelo.
- US3: T018 prima di tutto; T019 e T020 in parallelo; T021 dopo T019+T020; T022 dopo T020.
- Le migrazioni 0002, 0003, 0004 si applicano in ordine di numero.

### Esempi di parallelismo

```text
Dopo T002:  T003 (.gitignore/.env.example)  ||  T004 (lib/supabase.ts)
US1:        T009 (Login.tsx)  ||  T010 (Join.tsx)
US2:        T014 (useTable)   ||  T015 (MapCanvas)
US3:        T019 (grid.ts+test)  ||  T020 (useTable token)
```

## Implementation Strategy

- **MVP = US1**: due persone nella stessa campagna. Da solo non è ancora un "tavolo", ma convalida
  auth, RLS e inviti, le parti più rischiose.
- **Consegna incrementale**: dopo ogni storia si applica la migrazione e si provano gli scenari del
  quickstart prima di passare alla successiva.
- **Se qualcosa non torna sulla RLS o su Realtime** (le due aree descritte nel research ma non
  ancora provate), fermarsi al checkpoint della storia e correggere lo schema prima di andare avanti.
