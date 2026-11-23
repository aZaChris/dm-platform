---

description: "Task list per la feature 002 Editor di mappe a celle"
---

# Tasks: Editor di mappe a celle

**Input**: documenti in `/specs/002-editor-mappe-celle/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/db-api.md, quickstart.md

**Tests**: solo per la logica non banale (riempimento, linea tra due celle, inversione di un tratto), come da
plan. RLS e Realtime si verificano con gli scenari di `quickstart.md` (costituzione, principio IV).

**Organization**: per storia utente. US1 e US2 sono P1 e US2 dipende da US1 (serve una mappa disegnata per
vederla); US3 e US4 sono P2 e US4 dipende dalla funzione di US3 (`resize_cell_map`).

## Format: `[ID] [P?] [Story] Descrizione`

- **[P]**: parallelizzabile (file diversi, nessuna dipendenza da task incompleti)
- **[Story]**: storia utente di riferimento
- Le migrazioni già applicate non si modificano: ogni fase aggiunge un file nuovo in `supabase/migrations/`
  (`0007_mappa_celle` nelle fondamenta, `0008_ridimensiona_mappa` in US3).
- Scrivere sul database di produzione (`npx supabase db push --remote --yes`) richiede il via esplicito di Christian.

## Phase 1: Setup

**Purpose**: i due file di base da cui dipende tutto il resto, indipendenti tra loro.

- [X] T001 [P] Creare `app/src/lib/cells.ts` con il tipo `CellType` (`'.' | 'f' | 'w' | 'd' | 'a'`), l'elenco dei tipi con nome italiano e colore (vuoto `#0d1a1f`, pavimento `#6d6248`, muro `#1a2226`, porta `#a8743a`, acqua `#2f6f8f`), `cellIndex(col, row, cols)`, `emptyCells(cols, rows)` e i limiti `MAX_COLS = 40`, `MAX_ROWS = 30`, `MIN_SIZE = 4`
- [X] T002 [P] Creare `supabase/migrations/0007_mappa_celle.sql`: tabella `cell_maps` (`campaign_id` PK/FK con `on delete cascade`, `cols` 4-40, `rows` 4-30, `cells text` con `check` su lunghezza `cols*rows` e alfabeto `^[.fwda]*$`, `active boolean default true`, `updated_at`), RLS con `select` per i membri e `insert/update/delete` per il DM, funzione `paint_cells(p_campaign uuid, p_patch jsonb)` `security invoker` (blocca la riga, sostituisce solo le celle indicate, errori `cell_out_of_range`, `cell_type_invalid`, `no_cell_map`), `revoke` da `anon`, `grant` ad `authenticated`, `alter publication supabase_realtime add table public.cell_maps`

## Phase 2: Foundational (blocca tutte le storie)

**Purpose**: la tabella nel database, la lettura con Realtime e il disegno delle celle sul canvas.

**CRITICAL**: nessuna storia parte prima di questa fase.

- [X] T003 Applicare `0007_mappa_celle.sql` (`npx supabase db push --remote --yes`, **solo con il via di Christian**) e verificare con una query in sola lettura che `cell_maps` esista con la RLS attiva
- [X] T004 Creare `app/src/hooks/useCellMap.ts` (parte lettura): `select` iniziale con `maybeSingle()`, stato `{ cols, rows, cells, active } | null`, canale `cells:<campaign_id>` con abbonamento Postgres Changes su `cell_maps` filtrato per `campaign_id` (INSERT e UPDATE sostituiscono lo stato per intero, quindi idempotenti)
- [X] T005 Estendere `app/src/components/MapCanvas.tsx`: nuova prop opzionale `cellMap`; se presente e attiva, la dimensione del contenuto è `cols*CELL_PX` × `rows*CELL_PX` invece di quella dell'immagine; le celle si disegnano con un solo `Shape` (`sceneFunc`: un rettangolo per cella con il colore del tipo, bordo chiaro sui muri, segno sulla porta, onda leggera sull'acqua) sotto griglia e token, con `listening={false}`; la prop `onDims` continua a riportare colonne e righe

**Checkpoint**: se una riga di `cell_maps` esiste, il canvas la disegna sotto griglia e token.

## Phase 3: User Story 1 - Disegnare una mappa a celle (Priority: P1) — MVP

**Goal**: il DM crea una mappa a celle e la disegna con pennello, riempimento e gomma; il lavoro si salva e si riapre.

**Independent Test**: il DM crea una mappa vuota, disegna una stanza con muri, pavimento e una porta, ricarica la pagina e ritrova lo stesso disegno, ancora modificabile.

- [X] T006 [P] [US1] Aggiungere a `app/src/lib/cells.ts` `floodFill(cells, cols, rows, start, type)` (quattro direzioni, iterativo con pila, restituisce gli indici cambiati) e `lineCells(c0, r0, c1, r1)` (Bresenham, nessun buco tra due punti del mouse), con `app/src/lib/cells.test.ts` che copre: riempimento chiuso da muri, riempimento che non esce dal bordo, linea diagonale, linea di un solo punto
- [X] T007 [P] [US1] Estendere `app/src/hooks/useCellMap.ts` con `create(cols, rows)` (insert con `emptyCells`) e `paint(patch)`: aggiorna subito lo stato locale, chiama `rpc('paint_cells', …)` e, se fallisce, rilegge la riga e restituisce un messaggio chiaro («ultimo tratto non salvato, rifallo»)
- [X] T008 [P] [US1] Creare `app/src/components/MapEditor.tsx` (solo DM): interruttore «Modifica mappa», scelta strumento (pennello, riempimento, gomma) con `aria-pressed`, cinque pulsanti per i tipi di cella con il nome in chiaro e il tipo attivo evidenziato, form «Nuova mappa» con colonne e righe nei limiti 4-40 e 4-30, e scorciatoie solo in modifica: `B`, `F`, `E`, `1`-`5` (ignorate se il focus è in un campo di testo)
- [X] T009 [US1] Aggiungere a `app/src/components/MapCanvas.tsx` il disegno in modifica: pennello e gomma raccolgono le celle toccate interpolando con `lineCells`, il riempimento usa `floodFill`; il tratto è mostrato subito in locale e inviato **una volta** al rilascio con `onPaint(patch)`; in modifica i token non si trascinano e il canvas ha `touch-action: none`; le celle fuori dal bordo sono ignorate
- [X] T010 [US1] Collegare tutto in `app/src/pages/Table.tsx`: `useCellMap(campaignId)`, mappa a celle mostrata se esiste ed è attiva (altrimenti l'immagine come oggi), `MapEditor` visibile solo al DM sopra la mappa, stato di strumento/tipo/modifica, messaggio d'errore del tratto fallito in `role="alert"`
- [X] T011 [US1] Eseguire `npm test` e gli scenari 1-4 del quickstart (crea 20×15, pennello sul muro, riempimento di una stanza, gomma), poi ricaricare la pagina e controllare che il disegno si ritrovi (SC-005)

**Checkpoint**: il DM può disegnare, ricaricare e continuare; i giocatori vedono già la mappa grazie alle fondamenta.

## Phase 4: User Story 2 - I giocatori vedono la mappa in tempo reale (Priority: P1)

**Goal**: i Player vedono la mappa a celle sotto griglia e token, aggiornata in tempo reale, e non possono modificarla.

**Independent Test**: con DM e Player connessi il DM dipinge; il Player vede comparire le celle; il Player prova a modificare e non ci riesce.

- [X] T012 [US2] Completare `app/src/hooks/useCellMap.ts`: eventi DELETE senza filtro (gli eventi DELETE non si filtrano lato server: confronto con `old.campaign_id`) che azzerano lo stato; a ogni `SUBSCRIBED` (primo ingresso o riconnessione) rileggere la riga, così chi arriva in ritardo o torna online vede lo stato reale
- [X] T013 [US2] In `app/src/pages/Table.tsx` e `app/src/components/MapCanvas.tsx` garantire la vista del Player: nessun `MapEditor`, nessun gestore del pennello, token trascinabili come oggi solo se suoi
- [X] T014 [US2] Eseguire gli scenari 5-7 del quickstart con due browser: i tratti compaiono a B in meno di 1 secondo, B che ricarica e C che arriva in ritardo vedono lo stato attuale, e la chiamata diretta di B (`update` o `rpc('paint_cells', …)`) torna 0 righe modificate o un errore (SC-003)

**Checkpoint**: DM e Player condividono la stessa mappa in tempo reale, con i permessi decisi dal database.

## Phase 5: User Story 3 - Annullare, ripetere e correggere (Priority: P2)

**Goal**: annulla e ripeti dei tratti, svuota la mappa e cambia la dimensione senza perdere il disegno.

**Independent Test**: il DM dipinge tre tratti, ne annulla due e li ripete; poi ingrandisce la mappa e ritrova il disegno intatto; riducendola con dei token fuori, questi tornano dentro con un avviso.

- [X] T015 [P] [US3] Aggiungere a `app/src/lib/cells.ts` `invertPatch(cells, patch)` (il patch che rimette i vecchi valori delle celle toccate) con i casi in `app/src/lib/cells.test.ts`: inversione di un tratto, doppia inversione che riporta all'originale
- [X] T016 [P] [US3] Creare `supabase/migrations/0008_ridimensiona_mappa.sql` con `resize_cell_map(p_campaign uuid, p_cols int, p_rows int)` `security invoker` che rimappa la stringa riga per riga (celle comuni conservate, nuove `.`), fa l'`update` dei token con `least(col, cols-1)` e `least("row", rows-1)` e restituisce quanti ne ha spostati; poi applicarla con `npx supabase db push --remote --yes` (**solo con il via di Christian**)
- [X] T017 [US3] Estendere `app/src/hooks/useCellMap.ts` con le pile `undo` e `redo` (a ogni tratto si salva il patch inverso), `undo()` e `redo()` che inviano il patch con `paint_cells`, `clear()` (update con tutte le celle `.`) e `resize(cols, rows)` che chiama `rpc('resize_cell_map', …)` e restituisce il numero di token spostati; `// ponytail:` sul limite noto delle due schede aperte
- [X] T018 [US3] Estendere `app/src/components/MapEditor.tsx`: pulsanti Annulla e Ripeti (disattivati se la pila è vuota) e scorciatoie `Ctrl/Cmd+Z`, `Ctrl/Cmd+Y` e `Ctrl/Cmd+Shift+Z`; «Svuota mappa» con `confirm()`; campi di dimensione con pulsante «Cambia dimensione» e, se `resize` restituisce un numero maggiore di zero, un avviso «N token riportati dentro il bordo»
- [X] T019 [US3] Eseguire gli scenari 8-11 del quickstart: tre tratti, due annulla e un ripeti con B che vede gli stessi stati; ingrandire a 30×20; rimpicciolire con un token a colonna 25 e leggere l'avviso; svuotare con conferma

**Checkpoint**: il DM corregge gli errori senza ricominciare la mappa.

## Phase 6: User Story 4 - Scegliere tra immagine e mappa a celle (Priority: P2)

**Goal**: una sola mappa visibile alla volta, scelta dal DM tra immagine e celle, senza perdere l'altra.

**Independent Test**: con un'immagine caricata e una mappa a celle il DM passa da una all'altra e i giocatori vedono ogni volta quella scelta, con i token intatti.

- [X] T020 [US4] Estendere `app/src/hooks/useCellMap.ts` con `setActive(active)` (update del flag) e `remove()` (delete della riga); quando si attiva si chiama `resize(cols, rows)` con le dimensioni attuali per riallineare i token (vedi `contracts/db-api.md`)
- [X] T021 [US4] In `app/src/components/MapEditor.tsx` e `app/src/pages/Table.tsx`: interruttore «Mostra: immagine / mappa a celle» (disattivato se manca l'una o l'altra), pulsante «Elimina mappa a celle» con `confirm()`; senza né immagine né mappa a celle attiva resta il messaggio «Nessuna mappa» di oggi; `DmPanel.tsx` mantiene l'upload dell'immagine invariato
- [X] T022 [US4] Eseguire gli scenari 12-15 del quickstart: disattivare le celle e vedere l'immagine, riattivarle, eliminare la mappa a celle con conferma, muovere token con le frecce e tirare un d20 sulla mappa a celle

**Checkpoint**: immagine e mappa a celle convivono e il DM sceglie quale mostrare.

## Phase 7: Polish e requisiti trasversali

- [ ] T023 Controllo di tastiera e tocco in `app/src/components/MapEditor.tsx` e `MapCanvas.tsx`: ogni controllo ha nome, `aria-pressed` sugli strumenti e sul tipo attivo, focus visibile; eseguire gli scenari 16-17 del quickstart (solo tastiera; dito su tablet senza far scorrere la pagina)
- [X] T024 Eseguire `npm run build` da `app/` **con le variabili `VITE_` presenti** (un `.env.local` incompleto falsa la misura, vedi la knowledge base), annotare la dimensione gzip reale in `specs/002-editor-mappe-celle/quickstart.md` (scenario 18); se supera 500 KB, rivedere prima di proseguire
- [X] T025 Registrare le decisioni (Scelta | Perché | Scartato) nella nota `Decisioni DM Platform.md` del vault Obsidian: mappa come stringa in una riga, `paint_cells` per unire i tratti, annulla solo nel client, flag `active` invece di cambiare `maps`, canale Realtime separato; aggiornare `README.md` con l'editor
- [ ] T026 Deploy su Vercel (solo con il via di Christian) e ripetere sul dominio pubblico gli scenari 1, 5 e 12

---

## Dependencies & Execution Order

- Setup (T001-T002) → Foundational (T003-T005) → US1 → US2 → US3 → US4 → Polish.
- Setup: T001 e T002 in parallelo (file diversi).
- Foundational: T003 dopo T002 (serve la migrazione scritta); T004 dopo T001; T005 dopo T001 e T004.
- US1: T006, T007 e T008 in parallelo (file diversi: `cells.ts`/test, `useCellMap.ts`, `MapEditor.tsx`); T009 dopo T005 e T006; T010 dopo T007-T009; T011 per ultimo.
- US2 dipende da US1 (serve una mappa disegnata); T012 e T013 su file diversi, T014 dopo entrambi.
- US3: T015 e T016 in parallelo; T017 dopo T015 e T016; T018 dopo T017.
- US4 dipende da US3 per `resize_cell_map` (T016): T020 dopo T017, T021 dopo T020.
- Le migrazioni 0007 e 0008 si applicano in ordine di numero.

### Esempi di parallelismo

```text
Setup:  T001 (lib/cells.ts)  ||  T002 (migrazione 0007)
US1:    T006 (floodFill/lineCells + test)  ||  T007 (useCellMap: create/paint)  ||  T008 (MapEditor)
US3:    T015 (invertPatch + test)  ||  T016 (migrazione 0008)
```

## Implementation Strategy

- **MVP**: Setup + Foundational + US1 (T001-T011): il DM disegna, salva e ricarica. Con le fondamenta i giocatori
  la vedono già; US2 aggiunge la verifica dei permessi e la gestione di DELETE e riconnessione.
- **Rilascio incrementale**: ogni storia si prova da sola con i suoi scenari del quickstart; US1+US2 sono il minimo
  da pubblicare, US3 (correzioni) e US4 (convivenza con l'immagine) vengono dopo.
- Prima di ogni `db push --remote` si ferma il lavoro e si chiede il via a Christian.
