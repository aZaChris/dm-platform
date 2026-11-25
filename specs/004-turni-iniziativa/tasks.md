---

description: "Task list per la feature 004 Turni e iniziativa"
---

# Tasks: Turni e iniziativa

**Input**: documenti in `/specs/004-turni-iniziativa/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/db-api.md, quickstart.md

**Tests**: solo per la logica non banale, come chiede la costituzione (che cita proprio «ordine di iniziativa»):
ordinamento con spareggi, turno successivo e precedente, turno dopo una rimozione. RLS e Realtime si verificano con
gli scenari di `quickstart.md`.

**Organization**: per storia utente. US1 e US2 sono P1 e US2 dipende da US1 (serve un ordine da percorrere);
US3 è P2 e dipende da US2 (corregge un combattimento in corso). Tutte e tre toccano `Initiative.tsx` e
`useEncounter.ts`: vanno in fila.

## Format: `[ID] [P?] [Story] Descrizione`

- **[P]**: parallelizzabile (file diversi, nessuna dipendenza da task incompleti)
- **[Story]**: storia utente di riferimento
- Le migrazioni già applicate non si modificano: questa feature aggiunge solo `supabase/migrations/0010_iniziativa.sql`.
- Applicare la migrazione (`npx supabase db push --remote --yes`) è autorizzato da Christian; il deploy su Vercel lo
  lancia lui.

## Phase 1: Setup

**Purpose**: logica pura, il suo test e la migrazione: tre file indipendenti.

- [X] T001 [P] Creare `app/src/lib/initiative.ts`: tipo `Participant` (`token_id`, `campaign_id`, `initiative: number | null`, `modifier`, `tiebreak`); `sortParticipants(ps)` (iniziativa ↓ con i `null` in fondo, poi `modifier` ↓, `tiebreak` ↓, `token_id` ↑; restituisce un array nuovo); `nextTurn(ordine: string[], turno: string, round)` → `{ turn, round }`; `prevTurn(...)` → `{ turn, round } | null` (null al primo turno del round 1); `turnAfterRemoval(ordinePrima: string[], tolto: string, round)` → `{ turn, round } | null` (il successivo di `tolto` saltandolo, round + 1 se riparte dal primo, `null` se non resta nessuno); `tied(a, b)` vero se iniziativa e modificatore coincidono
- [X] T002 [P] Creare `app/src/lib/initiative.test.ts` (Vitest, piccolo): ordine 18/15/12; parità di iniziativa risolta dal modificatore; parità totale risolta dal `tiebreak`; `null` in fondo; `nextTurn` dall'ultimo torna al primo con round + 1; un solo partecipante fa salire il round; `prevTurn` dal primo del round 2 va all'ultimo del round 1 e dal primo del round 1 dà `null`; `turnAfterRemoval` sul primo, su quello in mezzo, sull'ultimo (round + 1) e sull'unico (`null`)
- [X] T003 [P] Creare `supabase/migrations/0010_iniziativa.sql` come in `data-model.md`: tabelle `encounters` (PK `campaign_id` FK `campaigns` cascade, `started`, `round >= 1`, `turn_token_id` senza FK, `updated_at`) ed `encounter_participants` (PK `token_id` FK `tokens` cascade, `campaign_id` FK `encounters(campaign_id)` cascade, `initiative` -20..60 nullable, `modifier` -20..20, `tiebreak`); indice su `encounter_participants(campaign_id)`; RLS: select ai membri, scritture su `encounters` al DM, insert/delete dei partecipanti al DM con `exists` che il token sia della stessa campagna, update al DM o al proprietario del token (`exists` su `public.tokens` con `owner_id = auth.uid()`); funzione `roll_initiative(p_token uuid, p_modifier int) returns int` `security invoker set search_path = ''` (legge nome e campagna del token unendo `encounter_participants` e `tokens`, `raise 'not_participant'` se non trova, chiama `public.roll_d20(campagna, 'Iniziativa · ' || nome, p_modifier, null)`, aggiorna `initiative` e `modifier`, `raise 'not_allowed'` se 0 righe), `revoke` da `public, anon`, `grant` ad `authenticated`; `alter publication supabase_realtime add table` per entrambe le tabelle

## Phase 2: Foundational (blocca tutte le storie)

**Purpose**: tabelle nel database e hook che legge e ascolta.

**CRITICAL**: nessuna storia parte prima di questa fase.

- [X] T004 Eseguire `npm test` da `app/` (T002 verde), poi applicare `0010_iniziativa.sql` (`npx supabase db push --remote --dry-run`, poi `--yes`) e verificare con `npx supabase db query --remote --read-only` che le due tabelle abbiano la RLS attiva, le policy, la funzione e la pubblicazione Realtime
- [X] T005 Creare `app/src/hooks/useEncounter.ts` (parte lettura): stato `encounter` (`{ started, round, turn_token_id } | null`) e `participants: Participant[]`; canale `combat:<campaign_id>` con `postgres_changes` su `encounters` (`*` filtrato per `campaign_id`; `DELETE` senza filtro, riconosciuto da `old.campaign_id`) ed `encounter_participants` (`INSERT`/`UPDATE` filtrati, sostituzione per `token_id`; `DELETE` senza filtro, rimozione per `token_id`); caricamento delle due tabelle allo stato `SUBSCRIBED`; `ordine = sortParticipants(participants)` calcolato con `useMemo`; `errore` per i messaggi; `removeChannel` allo smontaggio (stesso schema di `useChat.ts`)

**Checkpoint**: dalla console il DM crea un combattimento e il Player ne riceve lo stato.

## Phase 3: User Story 1 - Avviare un combattimento e stabilire l'ordine (Priority: P1) 🎯 MVP

**Goal**: il DM sceglie i partecipanti, tutti stabiliscono le iniziative, l'elenco ordinato è uguale per tutti.

**Independent Test**: il DM avvia con tre token, tira per un mostro, scrive 15 per un altro; il Player tira per il
proprio; tutti vedono lo stesso elenco ordinato.

- [X] T006 [US1] In `useEncounter.ts` aggiungere le azioni: `start(tokenIds)` (insert in `encounters`, poi insert dei partecipanti); `setInitiative(tokenId, initiative, modifier)` (update con `.select('token_id')`, 0 righe = «Non puoi cambiare l'iniziativa di questo token.»); `rollInitiative(tokenId, modifier)` (`rpc('roll_initiative')`, errori `not_allowed` e `not_participant` tradotti in italiano); `moveUp(tokenId)` (il partecipante sale sopra il precedente in pari: `tiebreak = precedente.tiebreak + 1`)
- [X] T007 [US1] Creare `app/src/components/Initiative.tsx` con titolo «Iniziativa»: senza combattimento il DM vede un `<fieldset>` con una casella per ogni token della mappa e «Avvia combattimento» (disattivato senza scelte), il Player vede «Nessun combattimento in corso»; in preparazione e durante il combattimento un `<ol>` nell'ordine di `ordine` con nome del token (pallino del suo colore), iniziativa o «—»; per chi può modificarla (DM, o Player proprietario) un campo numerico «Iniziativa di NOME», un campo «Modificatore» e i pulsanti «Salva» e «Tira d20»; per il DM il pulsante «Sposta su» solo quando il partecipante è in pari (`tied`) con il precedente
- [X] T008 [US1] In `app/src/pages/Table.tsx` usare `useEncounter(campaignId, role === 'dm')` e aggiungere nella colonna laterale una card con `<Initiative>` (riceve `tokens`, `userId`, `isDm`, stato e azioni dell'hook); stili `.init-list`, `.init-row`, `.init-dot` in `app/src/index.css` con i token di `DESIGN.md`
- [ ] T009 [US1] Eseguire gli scenari 1-9 di `quickstart.md`

**Checkpoint**: l'ordine dell'iniziativa è condiviso e corretto.

## Phase 4: User Story 2 - Far avanzare turni e round (Priority: P1)

**Goal**: il DM percorre l'ordine; tutti vedono turno e round, con il token di turno evidenziato sulla mappa.

**Independent Test**: con tre partecipanti il DM preme «Turno successivo» tre volte; il turno passa a ognuno e al
ritorno al primo il round è 2.

- [X] T010 [US2] In `useEncounter.ts` aggiungere `begin()` (update `started = true, round = 1, turn_token_id = ordine[0]`), `next()` e `prev()` (calcolano con `nextTurn`/`prevTurn` e scrivono `round`, `turn_token_id`, `updated_at`; `prev` non fa nulla se il risultato è `null`)
- [X] T011 [US2] In `Initiative.tsx`: in preparazione, per il DM, «Inizia» disattivato finché qualcuno non ha l'iniziativa, con l'elenco di chi manca («Manca l'iniziativa di: …»); a combattimento partito «Round N» e la riga di turno evidenziata con `aria-current="true"` e la classe `.init-turn`; per il DM i pulsanti «Turno precedente» (disattivato al primo turno del round 1) e «Turno successivo»; un riepilogo `aria-live="polite"` «Turno di NOME, round N»
- [X] T012 [P] [US2] In `app/src/components/MapCanvas.tsx` aggiungere la prop `turnTokenId: string | null` e disegnare per quel token un anello tratteggiato color menta (`#8fd3b8`, come `--mint`) più largo dell'anello di selezione, con `listening={false}`; in `Table.tsx` passare `encounter?.started ? encounter.turn_token_id : null`
- [ ] T013 [US2] Eseguire gli scenari 10-13 e 17-19 di `quickstart.md`

**Checkpoint**: un combattimento completo si gioca dall'inizio alla fine (senza correzioni).

## Phase 5: User Story 3 - Correggere il combattimento in corso (Priority: P2)

**Goal**: aggiungere, togliere, cambiare valori e terminare, senza perdere il turno.

**Independent Test**: a metà del round 2 il DM aggiunge un mostro con iniziativa 12, ne toglie un altro e cambia un
valore; l'ordine si aggiorna e il turno resta a chi lo aveva.

- [X] T014 [US3] In `useEncounter.ts` aggiungere `add(tokenId)`, `remove(tokenId)` ed `end()` (delete di `encounters`); nel gestore del `DELETE` dei partecipanti, se l'utente è DM, il combattimento è partito e il token tolto era `turn_token_id`, calcolare `turnAfterRemoval` sull'ordine di prima (tenuto in un `useRef`) e scriverlo in `encounters` (se `null`, `turn_token_id = null`); commento `ponytail:` sul limite delle due schede del DM
- [X] T015 [US3] In `Initiative.tsx` per il DM: un `<select>` «Aggiungi al combattimento» con i token non ancora partecipanti e il pulsante «Aggiungi»; su ogni riga «Togli» (con `aria-label` che cita il nome); «Termina combattimento» con `confirm()`
- [ ] T016 [US3] Eseguire gli scenari 14-16 e 20 di `quickstart.md`

**Checkpoint**: tutte e tre le storie funzionano insieme.

## Phase 6: Polish e requisiti trasversali

- [ ] T017 Controllo di tastiera e lettore di schermo su `Initiative.tsx`: ogni campo e pulsante ha un nome che cita il token, focus visibile, `aria-current` sulla riga di turno; eseguire lo scenario 21 di `quickstart.md`
- [X] T018 Eseguire lo scenario 22: `npm run build` da `app/` **con le variabili `VITE_` presenti**, annotare la dimensione gzip reale in `specs/004-turni-iniziativa/quickstart.md`; se supera 500 KB, rivedere prima di proseguire
- [X] T019 Aggiornare `README.md` con turni e iniziativa (comandi `npm test` compresi) e aggiungere le scelte nuove alla nota `Decisioni DM Platform.md` del vault, se ne sono emerse durante l'implementazione
- [ ] T020 Deploy su Vercel (lo lancia Christian con `! cd app && vercel --prod --yes`) e ripetere sul dominio pubblico gli scenari 1, 10 e 11

---

## Dependencies & Execution Order

- Setup (T001-T003) → Foundational (T004-T005) → US1 → US2 → US3 → Polish.
- Setup: T001, T002 e T003 in parallelo (file diversi); T002 passa solo dopo T001.
- Foundational: T004 dopo T002 e T003; T005 dopo T001.
- US1: T006 → T007 → T008; T009 per ultimo.
- US2: T010 → T011; T012 in parallelo a T010-T011 (file diverso); T013 per ultimo.
- US3: T014 → T015; T016 per ultimo.
- US2 dipende da US1, US3 da US2: stessi file e stesso combattimento.

### Esempi di parallelismo

```text
Setup:  T001 (initiative.ts)  ||  T002 (initiative.test.ts)  ||  T003 (migrazione 0010)
US2:    T010-T011 (hook e componente)  ||  T012 (anello su MapCanvas)
```

## Implementation Strategy

- **MVP**: Setup + Foundational + US1 + US2 (T001-T013). Le due storie P1 insieme formano il minimo utile: un ordine
  e il modo di percorrerlo. US1 da sola mostra già l'ordine al tavolo.
- **Rilascio incrementale**: US3 aggiunge le correzioni a combattimento in corso; si prova da sola con i suoi scenari.
- La migrazione si applica senza chiedere (autorizzazione di Christian del 2026-11-25); il deploy no.
