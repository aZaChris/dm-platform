# Research: Turni e iniziativa

Nessun «NEEDS CLARIFICATION» nel contesto tecnico: le scelte sotto chiudono i punti aperti della spec.

## 1. Due tabelle, non una colonna JSON

- **Decision**: `encounters` (una riga per campagna, chiave `campaign_id`) e `encounter_participants` (una riga per
  token in combattimento).
- **Rationale**: un Player deve poter scrivere l'iniziativa **solo del proprio token**; con una riga per
  partecipante la RLS lo esprime in una policy. Aggiungere o togliere un partecipante è un `insert` o un `delete`,
  e i due membri che scrivono iniziative diverse nello stesso momento non si sovrascrivono.
- **Alternatives considered**: un array JSON in `encounters` (ogni scrittura riscrive tutto, e la RLS non può
  limitare il Player a un elemento); colonna `initiative` sulla tabella `tokens` (mescola il combattimento con la
  mappa e resta sporca a combattimento finito).

## 2. Il turno è un token, non una posizione

- **Decision**: `encounters.turn_token_id` indica il token di turno; nessuna chiave esterna.
- **Rationale**: aggiungere un partecipante o cambiare un'iniziativa sposta le posizioni ma non deve cambiare di
  chi è il turno (FR-008). Un indice numerico si sposterebbe; l'`id` del token no.
- **Alternatives considered**: `turn_index` (va ricalcolato a ogni inserimento); chiave esterna con
  `on delete set null` (quando il token sparisce si perde il punto da cui ripartire).

## 3. Ordine e spareggi

- **Decision**: funzione pura `sortParticipants`: iniziativa decrescente, poi modificatore decrescente, poi
  `tiebreak` decrescente, poi `token_id` (solo per avere lo stesso ordine su tutti i browser). Chi non ha ancora
  l'iniziativa va in fondo. Lo «scambio» del DM tra due pari incrementa il `tiebreak` di quello che deve salire.
- **Rationale**: regola di D&D 5e più la scelta del DM a parità totale (FR-004). Una colonna numerica basta per
  rappresentare la scelta del DM.
- **Alternatives considered**: colonna `position` gestita a mano (andrebbe rinumerata a ogni nuova iniziativa).

## 4. Turno successivo e precedente

- **Decision**: funzioni pure `nextTurn(ordine, turno, round)` e `prevTurn(...)`; il DM scrive il risultato in
  `encounters` con un `update`. Dopo l'ultimo si torna al primo e il round sale; indietro dal primo si va
  all'ultimo del round prima; dal primo del round 1 non si torna indietro.
- **Rationale**: logica piccola e testabile nel client; la RLS impedisce ai Player l'`update` (FR-005).
- **Alternatives considered**: RPC `next_turn` in SQL (stessa logica in un linguaggio meno comodo da testare).

## 5. Togliere chi è di turno

- **Decision**: il client del DM, quando riceve il `DELETE` del partecipante che era di turno, calcola il prossimo
  con `turnAfterRemoval` sull'ordine di prima e aggiorna `encounters`. Vale sia per la rimozione dal pannello sia
  per il token eliminato dalla mappa (il partecipante sparisce con `on delete cascade` e Realtime manda il `DELETE`).
- **Rationale**: solo il DM può togliere partecipanti o eliminare token, quindi il suo client è connesso proprio
  in quel momento e ha l'ordine di prima.
- **Alternatives considered**: trigger SQL (duplica la regola di ordinamento in SQL).
- **Limite noto** (`ponytail:`): con due schede del DM aperte entrambe fanno lo stesso `update`: risultato uguale,
  una scrittura in più.

## 6. Tiro d'iniziativa

- **Decision**: RPC `roll_initiative(p_token uuid, p_modifier int)` `security invoker`: chiama `roll_d20` con
  etichetta «Iniziativa · NOME DEL TOKEN», poi aggiorna il partecipante con totale e modificatore; se l'`update`
  tocca 0 righe (RLS: token non tuo) solleva `not_allowed` e la transazione annulla anche il tiro.
- **Rationale**: il numero lo genera il database come per ogni tiro (non truccabile), compare nella chat (FR-010) e
  la scrittura è atomica.
- **Alternatives considered**: `Math.random()` nel client (barabile); chiamata a `roll_d20` e poi `update` dal
  client (il Player potrebbe scrivere un numero diverso dal tiro).

## 7. Iniziativa scritta a mano

- **Decision**: `update` diretto di `initiative` e `modifier` sul partecipante. La RLS di update ammette il DM per
  tutti e il Player per i token di cui è `owner_id`.
- **Limite noto** (`ponytail:`): il Player può cambiare anche il `tiebreak` del proprio token. Tra amici è
  accettabile; se diventa un problema, privilegi di colonna.

## 8. Partenza e fine

- **Decision**: `encounters.started` (`false` in preparazione). «Inizia» è attivo solo se ogni partecipante ha
  l'iniziativa e mostra chi manca; imposta `started = true`, `round = 1`, turno al primo. «Termina» chiede
  `confirm()` e cancella la riga di `encounters`: i partecipanti spariscono con `on delete cascade`.
- **Rationale**: un solo stato in più; niente storico (fuori ambito nella spec).

## 9. Realtime

- **Decision**: canale `combat:<campagna>` con `postgres_changes` su entrambe le tabelle filtrate per
  `campaign_id`, più i `DELETE` senza filtro (portano solo la chiave primaria) da riconoscere nel client.
  Caricamento iniziale allo stato `SUBSCRIBED`, come in `useChat`.
- **Rationale**: stesso schema già usato e verificato nelle feature 002 e 003.

## 10. Token di turno sulla mappa

- **Decision**: `MapCanvas` riceve `turnTokenId` e disegna un anello tratteggiato color menta (`--mint`) attorno a
  quel token, distinto dall'anello oro della selezione.
- **Rationale**: un solo elemento Konva in più; il colore menta è quello che `DESIGN.md` riserva agli stati.
