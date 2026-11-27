# Research: Griglia esagonale (006)

## 1. Dove salvare il tipo di griglia
- **Decisione**: colonna `maps.grid`.
- **Perché**: una riga per campagna, scrivibile solo dal DM (policy esistente), già in Realtime. La griglia
  esagonale esiste solo con un'immagine, quindi la riga c'è sempre quando serve.
- **Scartato**: colonna su `campaigns` (non è in Realtime); tabella nuova (policy da riscrivere).

## 2. Coordinate
- **Decisione**: esagoni con il vertice in alto, righe dispari spostate a destra di mezzo esagono («odd-r»), con le
  stesse `col` e `row` di oggi. Confermato da Christian il 2026-11-26 (la spec diceva «lato in alto»).
- **Perché**: `col`/`row` restano valide (FR-005), nessuna migrazione dei token.
- **Scartato**: salvare coordinate assiali o cubiche; si usano solo per calcolare la distanza.

## 3. Aggancio
- **Decisione**: il centro più vicino tra le due righe candidate. In una griglia regolare coincide con l'esagono che
  contiene il punto.
- **Scartato**: arrotondamento in coordinate cubiche, più difficile da leggere.

## 4. Frecce
- **Decisione**: invariate. `col±1` e `row±1` sono sempre esagoni confinanti. Su/giù vanno a zig-zag.
- **Limite noto**: dei sei vicini, due si raggiungono con due pressioni.

## 5. Bordi
- **Decisione**: sono valide le celle che si vedono almeno in parte; le righe dispari possono avere una colonna in
  meno (`oddCols`).
- **Al cambio di griglia**: il browser del DM sposta e salva solo i token che cadono fuori.

## 6. Righello
- **Decisione**: passi in coordinate assiali, `max(|dq|, |dr|, |dq+dr|)`; stesso testo della 005 con «esagoni»,
  metri compresi. Il messaggio Broadcast non cambia.
