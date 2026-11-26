---

description: "Task list per la feature 007 Schede personaggio"
---

# Tasks: Schede personaggio

**Input**: documenti in `/specs/007-schede-personaggio/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/db-api.md, contracts/roll20-import.md,
quickstart.md

**Tests**: solo per la logica non banale, come chiede la costituzione: i valori calcolati della scheda e i PF
(`character.test.ts`), il convertitore Roll20 (`roll20.test.ts`). RLS, trigger e Realtime si verificano con gli
scenari di `quickstart.md`.

**Organization**: per storia utente. US1 (P1) è l'MVP: creare una scheda e giocarci dalla vista pratica. US2 (P2)
aggiunge la vista classica e l'interruttore. US3 e US4 (P3) sono indipendenti tra loro: l'import usa solo
l'insert, il collegamento al token usa solo `token_id`.

## Format: `[ID] [P?] [Story] Descrizione`

- **[P]**: parallelizzabile (file diversi, nessuna dipendenza da task incompleti)
- **[Story]**: storia utente di riferimento
- Le migrazioni già applicate non si modificano: questa feature aggiunge solo `supabase/migrations/0011_schede.sql`.
- Applicare la migrazione (`npx supabase db push --remote --yes`) è autorizzato da Christian; il deploy parte da
  solo al push su `master` (Root Directory di Vercel su `app`).
- I JSON reali di Roll20 stanno in `import/roll20/` (esclusa da git) e non si copiano mai nel repo così come sono.

## Phase 1: Setup

**Purpose**: logica pura con i test e la migrazione: file indipendenti.

- [X] T001 [P] Creare `app/src/lib/character.ts`: tipi `Ability`, `Skill`, `CharacterData` come in `data-model.md`; tabella `SKILLS` (18 abilità con la loro caratteristica e il nome italiano: Acrobazia, Addestrare animali, Arcano, Atletica, Inganno, Storia, Intuizione, Intimidire, Indagare, Medicina, Natura, Percezione, Intrattenere, Persuasione, Religione, Rapidità di mano, Furtività, Sopravvivenza) e `ABILITIES` (nomi italiani Forza…Carisma); `withDefaults(data)` che riempie i campi assenti (punteggi 10, PF 1/1/0, liste vuote); funzioni `mod(score)`, `totalLevel(d)` (somma dei livelli, minimo 1), `profBonus(level)`, `saveBonus(d, ab)`, `skillBonus(d, sk)`, `initiative(d)`, `passivePerception(d)`, `attackBonus(d, atk)`, `spellDc(d)`, `spellAttack(d)`; `applyHp(hp, delta)` e `setTempHp(hp, n)` come in «Transizioni dei PF» di `data-model.md`; `newId()` (stringa breve casuale per gli elementi delle liste); `formatMod(n)` (`+3`, `−1`)
- [X] T002 [P] Creare `app/src/lib/character.test.ts` (Vitest, piccolo): `mod` per 1, 10, 11, 16, 30; `profBonus` per 1, 4, 5, 11, 17, 20; ladra di 3° livello con Destrezza 16 e competenza in Furtività → +5, con maestria → +7; tiro salvezza con competenza e bonus manuale; iniziativa con `initiative_bonus`; percezione passiva; CD incantesimi di un mago di 5° con Intelligenza 18 → 15; `applyHp`: danno che consuma i temporanei, danno oltre i PF che si ferma a 0, cura che si ferma al massimo; `setTempHp` tiene il valore più alto; multiclasse 3+2 → competenza +3
- [X] T003 [P] Creare `supabase/migrations/0011_schede.sql` come in `data-model.md` e `contracts/db-api.md`: tabella `characters` (`id`, `campaign_id` FK cascade, `owner_id` FK `auth.users` set null, `token_id` FK `tokens` set null e `unique`, `name` 1-60, `data jsonb not null default '{}'` con `check (jsonb_typeof(data) = 'object')` e `check (pg_column_size(data) < 262144)`, `created_at`, `updated_at`); indice su `campaign_id`; RLS: select `is_member`, insert `is_dm(campaign_id) or (owner_id = auth.uid() and token_id is null and is_member(campaign_id))` con il proprietario membro della campagna, update e delete `is_dm(campaign_id) or owner_id = auth.uid()`; trigger `before update` `security definer` che, se `not is_dm(old.campaign_id)`, rifiuta (`raise 'not_allowed'`) cambi di `owner_id`, `token_id`, `campaign_id`, e per tutti verifica che `token_id` sia un token della stessa campagna e `owner_id` un membro; funzione `patch_character(p_id uuid, p_path text[], p_value jsonb) returns public.characters` `security invoker set search_path = ''` (rifiuta percorso vuoto, `update … set data = jsonb_set(data, p_path, p_value, true), updated_at = now() where id = p_id returning *`, `raise 'not_allowed'` se nessuna riga); funzione `roll_character(p_character uuid, p_label text, p_modifier int) returns public.rolls` `security invoker` (legge nome, campagna e proprietario della scheda, `raise 'not_allowed'` se `owner_id <> auth.uid()` e non `is_dm`, poi `public.roll_d20(campagna, left(nome || ' · ' || p_label, 60), p_modifier, null)`); `revoke` da `public, anon` e `grant` ad `authenticated` per le due funzioni; `alter publication supabase_realtime add table public.characters`

## Phase 2: Foundational (blocca tutte le storie)

**Purpose**: tabella nel database e hook che legge, ascolta e scrive.

**CRITICAL**: nessuna storia parte prima di questa fase.

- [X] T004 Eseguire `npm test` da `app/` (T002 verde), poi applicare `0011_schede.sql` (`npx supabase db push --remote --dry-run`, poi `--yes`) e verificare con `npx supabase db query --remote --read-only` RLS attiva, policy, trigger, le due funzioni e la pubblicazione Realtime
- [X] T005 Creare `app/src/hooks/useCharacters.ts`: stato `schede` (righe con `data` passato da `withDefaults`); canale `characters:<campaign_id>` con `INSERT`/`UPDATE` filtrati per `campaign_id` (sostituzione per `id`) e `DELETE` senza filtro (rimozione per `id`); caricamento allo stato `SUBSCRIBED`; azioni `patch(id, path, value)` (aggiorna subito lo stato locale, poi `rpc('patch_character')`; in errore rilegge e mostra «Modifica non salvata, riprova.»), `roll(id, label, modifier)` (`rpc('roll_character')`, `not_allowed` → «Puoi tirare solo per i tuoi personaggi.»), `create(name, ownerId)` (insert con `data: {}`), `remove(id)`; `removeChannel` allo smontaggio (stesso schema di `useChat.ts`)
- [X] T006 Creare `app/src/components/SheetField.tsx`: campo modificabile (testo, numero o area di testo) con etichetta visibile o `aria-label`, valore locale mentre ha il focus, salvataggio all'uscita o con Invio, limiti `min`/`max` con messaggio sotto il campo se fuori scala (edge case: punteggi 1-30, livelli 1-20); in sola lettura mostra solo il valore

**Checkpoint**: dalla console il DM crea una scheda e il Player la riceve in tempo reale.

## Phase 3: User Story 1 - Giocare con la propria scheda (Priority: P1) 🎯 MVP

**Goal**: creare una scheda e usarla in gioco dalla vista pratica: PF, slot e tiri.

**Independent Test**: il giocatore crea a mano una ladra di 3° livello con Destrezza 16 e competenza in Furtività,
clicca Furtività e vede in chat un tiro con +5.

- [X] T007 [US1] Creare `app/src/components/SheetPractical.tsx`: in alto nome, classi e livello, PF attuali/massimi/temporanei, CA, iniziativa, velocità, percezione passiva; un campo «Danni o cure» con i pulsanti «Danno», «Cura» e «Temporanei» (`applyHp`, `setTempHp`, poi `patch` di `{hp}`); a PF 0 i tiri salvezza contro la morte (tre caselle successi, tre fallimenti); poi i sei punteggi con modificatore e tiro salvezza, le 18 abilità e gli attacchi (nome, bonus, danno e tipo come testo); slot incantesimo per livello come caselle da spuntare e incantesimi preparati; ogni tiro salvezza, abilità, prova di caratteristica, iniziativa e attacco è un `<button>` con nome e modificatore (es. «Furtività +5») che chiama `roll`; in modifica i valori base (punteggi, livello, PF massimi, CA, velocità, competenze) si cambiano con `SheetField`; senza permessi tutto è in sola lettura e i pulsanti di tiro non compaiono
- [X] T008 [US1] Creare `app/src/pages/Characters.tsx` (`#/schede/<campagna>`): a sinistra l'elenco delle schede (nome, classe e livello, PF) con «Nuova scheda» (nome, proprietario: sé stessi, o un membro a scelta per il DM); a destra la scheda scelta in `SheetPractical`; `isMine = owner_id === userId`, `canEdit = isMine || role === 'dm'`; titolo della pagina e briciole come le altre pagine
- [X] T009 [US1] In `app/src/App.tsx` aggiungere la rotta `#/schede/<id>`; in `app/src/components/Shell.tsx` la voce «Schede» (icona nuova `sheet` in `app/src/components/Icon.tsx`) tra «Tavolo di gioco» e «Membri», spenta finché non c'è un'ultima campagna come le altre due
- [X] T010 [US1] In `app/src/pages/Table.tsx` aggiungere la scheda «Scheda» al pannello (dopo «Combattimento»): mostra in `SheetPractical` la scheda collegata al token selezionato, altrimenti la prima scheda dell'utente, altrimenti un collegamento a «Crea la tua scheda» verso `#/schede/<campagna>`; il tavolo usa `useCharacters(campaignId)`
- [X] T011 [US1] Stili della vista pratica in `app/src/index.css` con i token di `DESIGN.md`: riga in alto a riquadri (PF in evidenza, barra PF che cambia colore sotto metà e a zero), griglia dei punteggi 3×2, abilità in due colonne che diventano una sotto i 640px, pulsanti di tiro con hover e pressione come gli altri, caselle degli slot; il pannello del tavolo a 23rem MUST restare leggibile (una colonna)
- [ ] T012 [US1] Eseguire gli scenari 1-6 e 11-14 di `quickstart.md`

**Checkpoint**: si gioca una sessione con le schede create a mano.

## Phase 4: User Story 2 - Scheda classica completa e modificabile (Priority: P2)

**Goal**: la scheda intera, disposta come quella su carta, tutta modificabile, con l'interruttore delle viste.

**Independent Test**: il giocatore passa alla vista classica, porta Forza da 14 a 16 e vede aggiornarsi
modificatore, tiro salvezza e Atletica, anche tornando alla vista pratica.

- [ ] T013 [US2] Creare `app/src/components/SheetClassic.tsx` con `SheetField` per ogni campo di FR-002, nella disposizione della scheda su carta: intestazione (nome, classi e livelli con «Aggiungi classe», razza, background, allineamento, PE); colonna sinistra caratteristiche (punteggio grande, modificatore), bonus di competenza, tiri salvezza e abilità con caselle competenza/maestria e bonus manuale, percezione passiva, competenze e lingue; colonna centrale CA, iniziativa, velocità, PF, dadi vita, tiri contro la morte, attacchi (tabella con aggiungi/elimina), equipaggiamento e monete; colonna destra tratti, ideali, legami, difetti, privilegi (elenco con aggiungi/elimina); in fondo incantesimi (caratteristica da incantatore, CD, bonus d'attacco, slot e incantesimi per livello con aggiungi/elimina), aspetto, storia e note; le liste si scrivono con `patch` del percorso della lista intera, i campi semplici con il loro percorso
- [ ] T014 [US2] In `app/src/pages/Characters.tsx` aggiungere l'interruttore «Pratica / Classica» (`role="switch"` o due pulsanti con `aria-pressed`); la scelta si legge da `session.user.user_metadata.vista_scheda` e si salva con `supabase.auth.updateUser({ data: { vista_scheda } })`; default «pratica»
- [ ] T015 [US2] Stili della vista classica in `app/src/index.css`: griglia a tre colonne che diventa una sotto i 900px, riquadri con bordo `--line` e titoli piccoli in `--gold` come le etichette di `DESIGN.md`, punteggi grandi in Cinzel; nessuna immagine o cornice della scheda ufficiale (research, punto 9); nessuno scorrimento laterale a 390px
- [ ] T016 [US2] Eseguire gli scenari 7-10 di `quickstart.md`

**Checkpoint**: una scheda si crea e si aggiorna per intero senza lasciare l'app.

## Phase 5: User Story 3 - Importare i personaggi da Roll20 (Priority: P3)

**Goal**: dai JSON di VTT Enhancement Suite alle schede, senza perdere dati.

**Independent Test**: il DM carica il JSON di un personaggio di 5° livello e ritrova caratteristiche, PF, CA,
competenze, attacchi e incantesimi uguali a Roll20.

- [X] T017 [US3] (il file reale è un export strutturato, non VTT Enhancement Suite: contratto riscritto su quello) Con il primo JSON reale in `import/roll20/`: confrontare i nomi degli attributi con la tabella di `specs/007-schede-personaggio/contracts/roll20-import.md` e correggerla dove differisce; creare la copia anonimizzata `app/src/lib/__fixtures__/roll20-esempio.json` (nome, testi del background, note e nomi propri sostituiti; numeri e struttura intatti)
- [X] T018 [P] [US3] Creare `app/src/lib/roll20.test.ts` (Vitest): la fixture produce nome, classi e livello, punteggi, competenze nei tiri salvezza e nelle abilità (con una maestria), PF, CA, almeno un attacco, slot e incantesimi attesi; un attributo inventato finisce in `notes_import`; un array di due personaggi dà due schede; `{}`, una stringa e un oggetto senza `attribs` lanciano l'errore «File non riconosciuto: serve un export di VTT Enhancement Suite.»
- [X] T019 [US3] Creare `app/src/lib/roll20.ts` con `fromRoll20(json)` come in `contracts/roll20-import.md`: raggruppa i campi `repeating_<sezione>_<id>_<campo>` per sezione e id, converte le stringhe in numeri, scarta i valori calcolati da Roll20 (salvo quelli che non coincidono con `character.ts`, che vanno in `notes_import`), genera `id` nuovi per le liste; T018 verde
- [X] T020 [US3] Creare `app/src/components/Roll20Import.tsx`: `<input type="file" accept="application/json" multiple>` con etichetta visibile; legge i file con `File.text()` e `fromRoll20`; mostra il riepilogo (nome, classi e livello, PF) di ogni personaggio con una casella per sceglierlo e, per il DM, il proprietario da un `<select>` dei membri; se una scheda ha lo stesso nome chiede «Nuova scheda» o «Sostituisci»; «Importa» crea tutto con un solo `insert` (o l'`update` delle sostituite) e mostra quante schede sono state create; in errore nessuna scheda creata e il messaggio sotto il campo (FR-013)
- [ ] T021 [US3] (fatto il pulsante «Importa da Roll20»; manca la sezione «Note importate», che arriva con la vista classica di T013) In `app/src/pages/Characters.tsx` aggiungere il pulsante «Importa da Roll20» che apre `Roll20Import`; il giocatore importa solo per sé (FR-012); in `SheetClassic.tsx` la sezione «Note importate» elenca `notes_import` (nome, valore, massimo), solo in lettura, con «Svuota» per il proprietario
- [ ] T022 [US3] Eseguire gli scenari 15-19 di `quickstart.md`

**Checkpoint**: le schede di Roll20 del gruppo sono nel tavolo.

## Phase 6: User Story 4 - Schede della campagna e token (Priority: P3)

**Goal**: tutte le schede visibili a tutti, collegate ai token, apribili dalla mappa.

**Independent Test**: il DM collega la scheda di Aria al suo token; un altro giocatore apre il token dalla mappa e
legge la scheda senza poterla modificare.

- [ ] T023 [US4] In `app/src/pages/Characters.tsx` per il DM: `<select>` «Token» con i token della campagna senza scheda (più «Nessuno») e `<select>` «Proprietario» con i membri, con `update` diretto (`contracts/db-api.md`); per tutti «Elimina scheda» solo al proprietario e al DM, con conferma (FR-015)
- [ ] T024 [US4] Aprire la scheda dal token: in `app/src/components/TokenList.tsx` e con un doppio clic sul token in `app/src/components/MapCanvas.tsx`, se il token ha una scheda la scheda «Scheda» del pannello del tavolo si apre su quella (`Table.tsx` riceve l'id); in `TokenList` un'icona indica i token con scheda
- [ ] T025 [US4] Eseguire gli scenari 20-22 di `quickstart.md`

**Checkpoint**: tutte e quattro le storie funzionano insieme.

## Phase 7: Polish e requisiti trasversali

- [ ] T026 Controllo di tastiera e lettore di schermo sulle due viste e sull'import: ogni campo ha un nome, i pulsanti di tiro dicono abilità e modificatore, focus visibile, l'interruttore dice lo stato; eseguire lo scenario 23 di `quickstart.md`
- [ ] T027 Eseguire lo scenario 24: `npm run build` da `app/` con le variabili `VITE_` presenti, annotare la dimensione gzip reale in `specs/007-schede-personaggio/quickstart.md`; se la crescita supera 10 KB, caricare `Characters.tsx` con `import()` dinamico (plan, Constitution Check I)
- [ ] T028 Aggiornare `README.md` con le schede e l'import da Roll20 (come esportare con VTT Enhancement Suite, dove mettere i file); aggiungere le scelte nuove emerse durante l'implementazione alla nota `Decisioni DM Platform.md` del vault; aggiornare `DESIGN.md` con le due viste della scheda

---

## Dependencies & Execution Order

- Setup (T001-T003) → Foundational (T004-T006) → US1 → US2 → US3 e US4 → Polish.
- Setup: T001, T002, T003 in parallelo (file diversi); T002 passa solo dopo T001.
- Foundational: T004 dopo T002 e T003; T005 dopo T001 e T004; T006 indipendente.
- US1: T007 → T008 → T009 → T010; T011 accanto a T007-T010; T012 per ultimo.
- US2 dipende da US1 (pagina Schede e hook): T013 → T014; T015 accanto; T016 per ultimo.
- US3 dipende da US2 solo per la sezione «Note importate» di T021; T017 → T018 → T019 → T020 → T021 → T022.
  **T017 richiede il primo JSON reale**: fino ad allora US3 aspetta, le altre storie no.
- US4 dipende da US1; è indipendente da US2 e US3. T023 → T024 → T025.

### Esempi di parallelismo

```text
Setup:  T001 (character.ts)  ||  T002 (character.test.ts)  ||  T003 (migrazione 0011)
US1:    T007-T010 (componenti e pagine)  ||  T011 (stili)
US3:    T018 (test del convertitore)  ||  T020 (componente di import), poi T019 li unisce
Dopo US1: US4 (T023-T025)  ||  US2 (T013-T016)
```

## Implementation Strategy

- **MVP**: Setup + Foundational + US1 (T001-T012): una scheda creata a mano da cui si gioca, nella pagina Schede e
  nel pannello del tavolo.
- **Rilascio incrementale**: US2 rende la scheda completa; US4 la collega alla mappa; US3 arriva appena c'è il primo
  JSON reale, e il convertitore si costruisce su quello.
- La migrazione si applica senza chiedere (autorizzazione di Christian); il deploy parte dal merge su `master`.
