---

description: "Task list per la feature 005 Misurazione delle distanze"
---

# Tasks: Misurazione delle distanze

**Input**: documenti in `/specs/005-misura-distanze/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/realtime.md, quickstart.md

**Tests**: solo la regola della distanza (`ruler.test.ts`), come chiede la costituzione. Tempo reale e permessi con
gli scenari di `quickstart.md`.

**Organization**: US1 (P1) misurare, US2 (P2) mostrare la misura agli altri. US2 dipende da US1 (serve una misura da
mandare).

## Format: `[ID] [P?] [Story] Descrizione`

- Applicare la migrazione è autorizzato da Christian; il deploy parte dal merge su `master`.

## Phase 1: Setup

- [X] T001 [P] Creare `app/src/lib/ruler.ts`: tipo `Cell = [number, number]`; `distance(from, to)` → `{ cells, ft, m }` con celle = max(|Δcol|, |Δriga|), piedi = celle × 5, metri = celle × 1,5; `formatDistance(d)` → «6 celle · 30 ft · 9 m» (1 cella al singolare, metri con la virgola: «7,5 m»)
- [X] T002 [P] Creare `app/src/lib/ruler.test.ts`: 4 in orizzontale → 4/20/6; 3 in diagonale + 2 in orizzontale → 5/25/7,5; verticale; stessa cella → 0; ordine inverso uguale; testo di `formatDistance` al singolare e con la virgola
- [X] T003 [P] Creare `supabase/migrations/0012_righello.sql` con le policy `ruler_select` e `ruler_insert` di `contracts/realtime.md`

## Phase 2: Foundational

- [X] T004 `npm test` (T002 verde), poi applicare `0012_righello.sql` (`--dry-run`, poi `--yes`) e verificare con `npx supabase db query --remote --read-only` che le due policy esistano su `realtime.messages`

## Phase 3: User Story 1 - Misurare una distanza (Priority: P1) 🎯 MVP

**Goal**: con il righello attivo si trascina e si legge la distanza; i token non si muovono.

**Independent Test**: il Player misura 6 celle a destra e 2 in basso e legge «6 celle · 30 ft · 9 m».

- [X] T005 [US1] In `app/src/components/MapCanvas.tsx` aggiungere le prop `ruler: boolean`, `measures: { id, name, from, to, mine }[]` e `onMeasure(from, to | null)`: con `ruler` attivo i token non si trascinano e le celle non si dipingono, il puntatore premuto fissa `from`, il movimento aggiorna `to` (riportato dentro la mappa) chiamando `onMeasure` solo quando cambia la cella, il rilascio chiama `onMeasure(null)`; disegnare per ogni misura una `Line` tra i centri delle celle (oro per la propria, menta per le altre) e un'etichetta con `formatDistance` e, per quelle degli altri, il nome; `touchAction: none` e cursore a croce con il righello attivo
- [X] T006 [US1] In `app/src/pages/Table.tsx` aggiungere il pulsante «Righello» (icona nuova `ruler` in `Icon.tsx`, `aria-pressed`) nella barra della mappa e la scorciatoia R (non mentre si scrive in un campo); da tastiera, con il righello attivo e un token scelto in «Scena», le frecce spostano la fine della misura a partire dal token, Esc la chiude
- [ ] T007 [US1] (provati 1, 3 e 4 nel browser; gli altri da Christian) Eseguire gli scenari 1-5, 10-14 di `quickstart.md`

## Phase 4: User Story 2 - Mostrare la misura agli altri (Priority: P2)

**Goal**: gli altri vedono la misura in corso con il nome di chi misura.

**Independent Test**: il Player misura; il DM, in un altro browser, vede la linea muoversi con il nome del Player.

- [X] T008 [US2] Creare `app/src/hooks/useRuler.ts`: canale `ruler:<campagna>` con `private: true` e `broadcast.self: false`; `send(from, to | null)` manda `move` o `end`; mentre la propria misura è aperta la rimanda ogni secondo; riceve `move` ed `end` degli altri in una mappa per `user_id`; toglie le misure senza aggiornamenti da 3 s; allo smontaggio manda `end` e rimuove il canale
- [X] T009 [US2] In `Table.tsx` collegare `useRuler` a `MapCanvas` (`measures` = propria + altrui, `onMeasure` → stato locale e `send`); spegnere il righello manda `end`
- [ ] T010 [US2] (provati 6, 7 e 15 con due browser e un estraneo: «Unauthorized»; 8 e 9 da Christian) Eseguire gli scenari 6-9 e 15 di `quickstart.md`

## Phase 5: Polish

- [X] T011 `npm run build`: annotare la dimensione gzip in `quickstart.md` (scenario 16)
- [X] T012 Aggiornare `README.md` (righello) e `DESIGN.md` (colori della linea: oro la propria, menta le altre) e la nota `Decisioni DM Platform.md` del vault (Broadcast su canale privato)

## Dependencies & Execution Order

- T001, T002, T003 in parallelo; T004 dopo T002 e T003.
- US1: T005 → T006 → T007. US2: T008 → T009 → T010, dopo US1.

## Implementation Strategy

- **MVP**: T001-T007, il righello locale. US2 lo rende condiviso.
