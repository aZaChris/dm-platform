# Research: Chat del tavolo

Nessun «NEEDS CLARIFICATION» nel contesto tecnico: le scelte sotto chiudono i punti aperti della spec.

## 1. Dove vivono i messaggi

- **Decision**: una tabella `messages`, una riga per messaggio.
- **Rationale**: serve lo storico (chi entra dopo vede gli ultimi 100, FR-003), quindi i messaggi vanno salvati.
  Una tabella con RLS è il modo nativo di Supabase per salvare e proteggere dati condivisi.
- **Alternatives considered**: Realtime Broadcast senza tabella (niente storico, e la riservatezza dei sussurri
  andrebbe gestita a mano); un'unica colonna JSON con tutta la chat (ogni messaggio riscriverebbe tutto e due membri
  si cancellerebbero a vicenda).

## 2. Come si scrive un messaggio

- **Decision**: `insert` diretto dal client; un trigger `before insert` imposta `user_id = auth.uid()` e copia
  `display_name` da `campaign_members`.
- **Rationale**: la RLS di insert controlla appartenenza e destinatario; il trigger rende il nome affidabile. È la
  strada con meno codice che lascia i permessi alla RLS.
- **Alternatives considered**: RPC `send_message` `security definer` come `roll_d20`. Per i dadi serviva perché il
  numero casuale non deve venire dal browser; per un testo no: la RPC duplicherebbe in SQL i controlli che la RLS fa già.

## 3. Sussurri

- **Decision**: colonna `recipient_id` nullable. `null` = messaggio a tutti. La policy di select mostra un sussurro
  solo a mittente e destinatario. La policy di insert accetta un destinatario solo se è membro della campagna, e
  per un Player solo se è il DM.
- **Rationale**: un solo controllo, nel database, vale sia per la select iniziale sia per Realtime: Postgres Changes
  applica la RLS di select a ogni abbonato prima di consegnare l'evento. Così il Player B non riceve il sussurro
  nemmeno via socket (FR-008).
- **Alternatives considered**: tabella separata per i sussurri (due tabelle con le stesse colonne); filtro nel
  client (il sussurro arriverebbe comunque al browser di B: non è riservatezza).

## 4. Eliminazione e Realtime

- **Decision**: policy di delete per l'autore e per il DM. Il client si abbona anche a `DELETE` e toglie dall'elenco
  il messaggio con quell'`id`.
- **Rationale**: con la replica identity di default l'evento `DELETE` porta solo la chiave primaria. Realtime non
  filtra i `DELETE` per RLS né per `campaign_id`, ma un `id` casuale non rivela nulla. Lo stesso schema è già usato
  per `campaign_members` in `useTable.ts`.
- **Alternatives considered**: `replica identity full` (manderebbe a tutti il testo dei messaggi eliminati, sussurri
  compresi: peggio); eliminazione "morbida" con una colonna `deleted` (più stati senza bisogno).

## 5. Tiri nella chat

- **Decision**: i tiri restano in `rolls`. `Chat.tsx` riceve i `rolls` già caricati da `useTable` e i messaggi da
  `useChat`, li unisce per `created_at` e mostra gli ultimi 100. `useTable` carica 100 tiri invece di 20. Il diario
  dei tiri esce da `DiceRoller.tsx`, che resta un semplice form.
- **Rationale**: la tabella `rolls` e il suo canale ci sono già; copiarli in `messages` vorrebbe dire due fonti per
  lo stesso tiro. Entrambi gli orari vengono dall'orologio del database, quindi l'ordine è coerente per tutti.
- **Alternatives considered**: una vista SQL che unisce le due tabelle (Realtime non funziona sulle viste); scrivere
  il tiro anche come messaggio dentro `roll_d20` (dato duplicato e migrazione su una funzione che funziona già).

## 6. Ordine e parità di orario

- **Decision**: ordine per `created_at` crescente; a parità, per `id`.
- **Rationale**: `now()` in Postgres è l'inizio della transazione; due messaggi nello stesso istante esatto sono
  rari ma possibili. Un secondo criterio fisso dà lo stesso ordine a tutti (edge case «molti messaggi»).

## 7. Testo semplice

- **Decision**: il testo si mostra come figlio di un elemento React, mai con `dangerouslySetInnerHTML`. Il CSS usa
  `white-space: pre-wrap` per conservare gli a capo e `overflow-wrap: anywhere` per i link lunghi.
- **Rationale**: React fa già l'escape (FR-010); niente libreria di sanitizzazione.

## 8. Limiti di lunghezza

- **Decision**: `check (char_length(btrim(body)) between 1 and 500)` nel database; nel client il pulsante si
  disattiva se il testo è vuoto o troppo lungo e un contatore mostra i caratteri in eccesso.
- **Rationale**: il `check` vale anche per le richieste dirette; il client evita solo di arrivarci.
  Nessun `maxLength` sull'input: troncherebbe in silenzio un testo incollato invece di dire di quanto è troppo lungo.

## 9. Accessibilità

- **Decision**: l'elenco ha `role="log"` (che implica `aria-live="polite"`); campo con etichetta, Invio per inviare,
  Maiusc+Invio per andare a capo; il destinatario è un `<select>` nativo («Tutti» più i membri ammessi).
- **Rationale**: elementi nativi, già usabili da tastiera e lettore di schermo (FR-011).
