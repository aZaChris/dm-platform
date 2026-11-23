# Research: Editor di mappe a celle

Nessun dubbio aperto dalla spec; qui le scelte tecniche con il loro perché.

## 1. Come salvare le celle

- **Decision**: una riga per campagna in `cell_maps` con `cols`, `rows` e `cells text`, un carattere per cella
  (`.` vuoto, `f` pavimento, `w` muro, `d` porta, `a` acqua), indice = `row * cols + col`.
- **Rationale**: 40×30 = 1200 caratteri. Una lettura = una riga; un evento Realtime = una riga; i vincoli di integrità
  (lunghezza e alfabeto) sono due `check` della tabella.
- **Alternatives**: una riga per cella (1200 righe e fino a 1200 eventi Realtime per un riempimento: lento e a rischio
  limiti); `jsonb` di oggetti (4-5 volte più grande e senza vincoli utili); mappa come immagine PNG generata nel browser
  (non modificabile dopo, contraddice la spec).

## 2. Come unire i tratti

- **Decision**: funzione `paint_cells(p_campaign, p_patch jsonb)` con `p_patch = [[indice, "w"], ...]`: blocca la riga,
  sostituisce solo le celle indicate, aggiorna `updated_at`.
- **Rationale**: vale «per ogni cella l'ultima modifica» (edge case della spec) anche con due schede del DM aperte.
- **Alternatives**: sovrascrivere l'intera stringa con un `update` (l'ultima scheda azzera le modifiche dell'altra).

## 3. Quando si scrive

- **Decision**: una chiamata per tratto, al rilascio del mouse o del dito; durante il trascinamento il disegno è solo locale.
- **Rationale**: un tratto di 200 celle diventa 1 evento, non 200: rispetta il limite «<1 s» senza coda né throttle.
- **Alternatives**: scrivere a ogni cella (carico inutile); Broadcast durante il disegno (i giocatori vedrebbero il tratto
  nascere, ma serve un secondo meccanismo da tenere coerente: rimandato, vedi `ponytail` nel codice).

## 4. Immagine o celle

- **Decision**: flag `active boolean` in `cell_maps`. Se la riga esiste ed è attiva si mostrano le celle, altrimenti
  l'immagine di `maps` (come oggi). Disattivare non cancella nulla.
- **Rationale**: la tabella `maps` e l'upload restano intatti; un solo campo risolve FR-012.
- **Alternatives**: aggiungere una colonna `kind` a `maps` (rompe la regola «una riga = un'immagine», migrazione dei dati);
  una terza tabella «mappa attiva» (un join in più per niente).

## 5. Annulla e ripeti

- **Decision**: pila nel client; ogni tratto salva anche il *patch inverso* (i vecchi valori delle celle toccate).
  Annullare = inviare il patch inverso con `paint_cells`. Si perde al ricaricare la pagina.
- **Rationale**: copre FR-009 e SC-007 senza tabelle di storico.
- **Alternatives**: storico persistente nel database (tabella, politiche, pulizia: sproporzionato per uso personale).
- **Limite noto** (`ponytail:`): se due schede disegnano insieme, l'annulla di una può rimettere valori vecchi su celle
  toccate dall'altra; accettabile con un solo DM.

## 6. Come si disegna

- **Decision**: un solo `Shape` di `react-konva` con `sceneFunc` che riempie i rettangoli delle celle e ne traccia i bordi;
  nessun nodo per cella. Il pennello legge le coordinate dal `Stage` e interpola tra due punti con una linea di Bresenham.
- **Rationale**: 1200 rettangoli in una sola funzione sono istantanei; 1200 nodi Konva no. L'interpolazione evita buchi
  quando il mouse si muove veloce.
- **Alternatives**: 1200 `Rect` (lenti da ridisegnare); canvas HTML a parte (duplica zoom, posizione e griglia già nel Stage).

## 6b. Riempimento

- **Decision**: flood fill a quattro direzioni, iterativo (pila, non ricorsione), su celle dello stesso tipo contigue.
  Restituisce solo gli indici cambiati, così diventa il patch del tratto.
- **Rationale**: nessun rischio di overflow dello stack su 1200 celle; conta come un solo tratto da annullare.

## 7. Modalità modifica e token

- **Decision**: il DM ha un interruttore «Modifica mappa». Acceso, i token non si trascinano (evita di spostarli
  per sbaglio mentre si dipinge) e il pennello è attivo; spento, il tavolo è quello di prima.
- **Rationale**: un solo gesto (trascinare) non può fare due cose. Spegnere l'editor non perde niente.

## 8. Un canale Realtime a parte

- **Decision**: `useCellMap` apre un canale suo (`cells:<campaign_id>`), come fa `useTable` per il resto.
- **Rationale**: `useTable` è già lungo; la mappa a celle ha un ciclo di vita proprio (esiste o no, attiva o no).
  Un canale in più per utente è irrilevante con ~6 giocatori.
- **Alternatives**: aggiungere l'abbonamento a `useTable` (un hook che fa tutto: più difficile da leggere e da provare).

## 9. Dimensioni e token

- **Decision**: da 4×4 a 40×30 celle (vincoli `check`). `resize_cell_map` rimappa riga per riga, conserva le celle
  comuni e fa un `update tokens` che riporta dentro il bordo quelli rimasti fuori, restituendone il numero per l'avviso.
  Chiamarla con le **stesse dimensioni** serve a riallineare i token quando il DM passa da immagine a celle.
- **Rationale**: FR-010 in una sola transazione, senza che il client possa lasciare token orfani.

## 10. Aspetto delle celle

- **Decision**: colori dai token del design system, un colore per tipo, contrasto distinguibile anche per daltonici
  (la porta ha un segno marcato e l'acqua un'onda leggera, non solo il colore): vuoto `#0d1a1f`, pavimento `#6d6248`,
  muro `#1a2226` con bordo chiaro, porta `#a8743a`, acqua `#2f6f8f`.
- **Rationale**: «riconoscibile a colpo d'occhio» (FR-002) non può dipendere dal solo colore.

## 11. Tastiera e tocco

- **Decision**: scorciatoie `B` pennello, `F` riempimento, `E` gomma, `1`-`5` tipo di cella, `Ctrl/Cmd+Z` annulla,
  `Ctrl/Cmd+Y` o `Ctrl/Cmd+Shift+Z` ripeti, tutte attive solo in modalità modifica. Il tocco usa gli stessi eventi
  del puntatore di Konva, con `touch-action: none` sul canvas in modifica.
- **Rationale**: FR-014; il disegno cella per cella da tastiera è escluso dalla spec, le azioni essenziali no.

## 12. Cosa si testa

- **Decision**: test Vitest per `floodFill`, `lineCells` e `invertPatch`; verifica a mano delle RLS e di Realtime con
  due utenti reali ([quickstart.md](quickstart.md)).
- **Rationale**: come nella 001, test solo dove la logica può rompersi in silenzio.
