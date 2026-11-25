---

description: "Task list per la feature 003 Chat del tavolo"
---

# Tasks: Chat del tavolo

**Input**: documenti in `/specs/003-chat-tavolo/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/db-api.md, quickstart.md

**Tests**: nessun test unitario. L'unica logica è unire due elenchi per data (non banale secondo la costituzione:
no). RLS, sussurri e Realtime si verificano con gli scenari di `quickstart.md`, con tre utenti reali e un estraneo.

**Organization**: per storia utente. US1 è P1 e da sola è già una chat utile; US2 (tiri nella chat) e US3
(sussurri) dipendono solo da US1 e tra loro sono indipendenti, ma toccano lo stesso `Chat.tsx`: meglio farle in fila.

## Format: `[ID] [P?] [Story] Descrizione`

- **[P]**: parallelizzabile (file diversi, nessuna dipendenza da task incompleti)
- **[Story]**: storia utente di riferimento
- Le migrazioni già applicate non si modificano: questa feature aggiunge solo `supabase/migrations/0009_chat.sql`.
- Scrivere sul database di produzione (`npx supabase db push --remote --yes`) richiede il via esplicito di Christian.

## Phase 1: Setup

**Purpose**: la migrazione, da cui dipende tutto il resto.

- [X] T001 Creare `supabase/migrations/0009_chat.sql` come in `data-model.md`: tabella `messages` (`id`, `campaign_id` FK `on delete cascade`, `user_id`, `display_name`, `recipient_id` nullable FK su `auth.users`, `body` con `check (char_length(btrim(body)) between 1 and 500)`, `created_at default now()`, `check (recipient_id is null or recipient_id <> user_id)`), indice `(campaign_id, created_at desc)`; RLS abilitata con policy `select` (membro e messaggio pubblico o in cui è mittente/destinatario), `insert` (membro, `user_id = auth.uid()`, destinatario nullo, oppure DM verso un membro, oppure Player verso il DM della campagna, controllato con `exists` su `public.campaign_members`), `delete` (autore o `is_dm`), nessuna policy `update`; trigger `before insert` `set_message_author` (`set search_path = ''`) che imposta `new.user_id := auth.uid()` e copia `display_name` da `campaign_members`, con `raise exception 'not_member'` se manca; `alter publication supabase_realtime add table public.messages`

## Phase 2: Foundational (blocca tutte le storie)

**Purpose**: tabella nel database e hook che legge, ascolta e scrive.

**CRITICAL**: nessuna storia parte prima di questa fase.

- [X] T002 Applicare `0009_chat.sql` (`npx supabase db push --remote --yes`; autorizzato da Christian il 2026-11-25) e verificare con una query in sola lettura che `messages` esista con la RLS attiva e il trigger presente
- [X] T003 Creare `app/src/hooks/useChat.ts`: tipo `Message` (colonne di `data-model.md`); canale `chat:<campaign_id>` con `INSERT` su `messages` filtrato per `campaign_id` (aggiunge se l'`id` non c'è) e `DELETE` senza filtro (toglie per `id`); allo stato `SUBSCRIBED` carica gli ultimi 100 (`order created_at desc limit 100`, poi in ordine crescente); `send(body, recipientId | null)` fa l'`insert` senza `user_id` né `display_name` e restituisce il messaggio d'errore o `null`; `remove(id)` fa `delete().eq('id', id).select('id')` e segnala 0 righe come «Non puoi eliminare questo messaggio.»; `removeChannel` allo smontaggio (stesso schema di `useCellMap.ts`)

**Checkpoint**: dalla console del browser un membro scrive e legge messaggi, un estraneo no.

## Phase 3: User Story 1 - Scriversi durante la partita (Priority: P1) 🎯 MVP

**Goal**: i membri si scrivono in tempo reale e chi entra dopo trova gli ultimi messaggi.

**Independent Test**: DM e Player in due browser; il Player scrive «ciao», il DM lo vede senza ricaricare e lo
ritrova dopo aver ricaricato.

- [X] T004 [US1] Creare `app/src/components/Chat.tsx`: elenco `<ol role="log">` con nome del mittente, ora (`toLocaleTimeString` con ore e minuti) e testo come semplice figlio React (mai `dangerouslySetInnerHTML`); scorrimento automatico in fondo all'arrivo di un messaggio se l'utente era già in fondo; form con `<textarea>` etichettata «Messaggio», Invio invia e Maiusc+Invio va a capo; pulsante «Invia» disattivato se il testo senza spazi è vuoto o supera 500 caratteri, con contatore «N caratteri di troppo» quando li supera (nessun `maxLength`); il campo si svuota solo se `send` riesce, altrimenti il testo resta e l'errore compare con `role="alert"`
- [X] T005 [US1] In `Chat.tsx` aggiungere il pulsante «Elimina» (con `aria-label` che cita il messaggio) sui messaggi propri e, per il DM, su tutti; chiama `remove(id)` dopo `confirm()`
- [X] T006 [US1] In `app/src/pages/Table.tsx` usare `useChat(campaignId)` e aggiungere nella colonna laterale una card «Chat» con `<Chat>` (riceve `userId`, `isDm`, messaggi, `send`, `remove`); in `app/src/index.css` aggiungere gli stili `.chat-log` (altezza massima con scorrimento), `.chat-msg` (`white-space: pre-wrap`, `overflow-wrap: anywhere`) e lo stato di focus visibile, con i token CSS descritti in `DESIGN.md` (radice del repo)
- [ ] T007 [US1] Eseguire gli scenari 1-5 e 11-15 di `quickstart.md`

**Checkpoint**: la chat funziona da sola; si può pubblicare.

## Phase 4: User Story 2 - I tiri di dado nella chat (Priority: P2)

**Goal**: messaggi e tiri nello stesso flusso, nell'ordine in cui sono avvenuti.

**Independent Test**: un Player scrive «attacco!» e tira un d20 con CD; il DM vede il messaggio seguito dal tiro.

- [X] T008 [P] [US2] In `app/src/hooks/useTable.ts` caricare 100 tiri invece di 20, sia nella select iniziale (`limit(100)`) sia nel gestore Realtime (`slice(0, 100)`)
- [X] T009 [P] [US2] In `app/src/components/DiceRoller.tsx` togliere l'elenco `dice-log` dei tiri e la prop `rolls`: resta solo il form; aggiornare la chiamata in `Table.tsx`
- [X] T010 [US2] In `Chat.tsx` ricevere `rolls` (da `useTable`) e costruire il flusso `{ kind: 'msg' | 'roll' }` ordinato per `created_at` e poi per `id`, mostrando gli ultimi 100; il tiro si riconosce a colpo d'occhio (icona `dice` di `Icon.tsx`, stile `.chat-roll` in `index.css`) e mostra nome, etichetta, `dado ± modificatore = totale`, le classi `crit-txt`/`fail-txt` già usate per 20 e 1, e l'esito «riuscito/fallito contro CD N» se `dc` non è nullo; `Table.tsx` passa `rolls` a `<Chat>`
- [ ] T011 [US2] Eseguire lo scenario 6 di `quickstart.md`

**Checkpoint**: un solo posto dove seguire ciò che succede al tavolo; il diario separato dei tiri non c'è più.

## Phase 5: User Story 3 - Sussurrare a un giocatore (Priority: P3)

**Goal**: messaggi privati DM ↔ giocatore, invisibili agli altri anche dalla console.

**Independent Test**: il DM sussurra al Player A; A lo vede come privato, B non lo vede nemmeno ricaricando.

- [X] T012 [US3] In `Chat.tsx` aggiungere un `<select>` etichettato «Destinatario»: «Tutti» più, per il DM, ogni altro membro e, per un Player, solo il DM (i membri arrivano da `useTable` tramite `Table.tsx`); il valore va a `send` come `recipient_id`; dopo l'invio il destinatario resta quello scelto
- [X] T013 [US3] In `Chat.tsx` segnare i sussurri con la classe `.chat-whisper` (stile in `index.css`) e il testo «privato a NOME» per il mittente e «privato da NOME» per il destinatario; il nome del destinatario si legge dai membri, e se non c'è più resta «privato»
- [ ] T014 [US3] Eseguire gli scenari 7-10 di `quickstart.md`

**Checkpoint**: tutte e tre le storie funzionano insieme.

## Phase 6: Polish e requisiti trasversali

- [ ] T015 Controllo di tastiera e lettore di schermo su `Chat.tsx`: ogni controllo ha nome, focus visibile, `role="log"` annuncia i nuovi messaggi senza rubare il focus; eseguire lo scenario 16 di `quickstart.md`
- [ ] T016 Eseguire lo scenario 17 (500 messaggi) e lo scenario 18: `npm run build` da `app/` **con le variabili `VITE_` presenti**, annotare la dimensione gzip reale in `specs/003-chat-tavolo/quickstart.md`; se supera 500 KB, rivedere prima di proseguire
- [X] T017 Emendamento PATCH di `.specify/memory/constitution.md` (versione 1.0.1): la frase dei *Vincoli tecnici* diventa «il tiro dei dadi lo fa il database; il risultato compare in chat via Realtime»; aggiornare il Sync Impact Report e la data, motivo nel commit
- [X] T018 Aggiornare `README.md` con la chat e i sussurri
- [ ] T019 Deploy su Vercel (solo con il via di Christian) e ripetere sul dominio pubblico gli scenari 1, 6 e 7

---

## Dependencies & Execution Order

- Setup (T001) → Foundational (T002-T003) → US1 → US2 → US3 → Polish.
- T002 dopo T001; T003 si può scrivere in parallelo a T002, ma si prova solo dopo.
- US1: T004 → T005 → T006 (stesso componente, poi la pagina); T007 per ultimo.
- US2: T008 e T009 in parallelo (file diversi); T010 dopo entrambi; T011 per ultimo.
- US3: T012 → T013 (stesso file); T014 per ultimo.
- US2 e US3 dipendono solo da US1; sono in fila perché modificano entrambe `Chat.tsx`.
- T017 e T018 sono indipendenti da tutto il resto.

### Esempi di parallelismo

```text
Foundational:  T002 (applicare la migrazione)  ||  T003 (useChat.ts)
US2:           T008 (useTable: 100 tiri)        ||  T009 (DiceRoller senza diario)
Polish:        T017 (costituzione)              ||  T018 (README)
```

## Implementation Strategy

- **MVP**: Setup + Foundational + US1 (T001-T007): una chat con storico ed eliminazione, già pubblicabile.
- **Rilascio incrementale**: US2 sposta i tiri nella chat; US3 aggiunge i sussurri. Ognuna si prova da sola con i
  suoi scenari del quickstart.
- Prima di ogni `db push --remote` si ferma il lavoro e si chiede il via a Christian.
