# Feature Specification: Editor di mappe a celle

**Feature Branch**: `002-editor-mappe-celle` (la cartella della spec porta questo nome; il lavoro resta sul branch `refactor/react-supabase`)

**Created**: 2026-11-23

**Status**: Draft

**Input**: User description: "Editor di mappe a celle per il DM (feature 002). Il DM disegna la mappa del tavolo con il mouse su una griglia, scegliendo il tipo di cella (pavimento, muro, porta, acqua, vuoto) con pennello, riempimento e gomma, in stile Dungeon Scrawl / editor di Roll20. La mappa è salvata nel database come celle modificabili (non come immagine), si può riaprire e cambiare dopo, ed è condivisa in tempo reale con i giocatori, che la vedono sotto la griglia e i token esistenti. Solo il DM modifica la mappa (permessi nel database, come per i token). Convive con l'upload di un'immagine: una campagna usa o la mappa a celle o l'immagine. I token, i dadi e l'aggancio alla griglia restano come ora. Pensata per desktop e tablet, sotto i limiti già presenti (circa 6 giocatori, poche campagne)."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Disegnare una mappa a celle (Priority: P1)

Il DM apre il tavolo di una campagna, sceglie di creare una mappa a celle e ne indica la dimensione. Disegna con il mouse (o il dito su tablet) scegliendo il tipo di cella (pavimento, muro, porta, acqua, vuoto) e uno strumento: pennello per dipingere cella per cella, riempimento per colorare un'area intera, gomma per svuotare. Il lavoro si salva da solo: se chiude la pagina e la riapre il giorno dopo, ritrova la mappa e può continuare a modificarla.

**Why this priority**: senza la possibilità di disegnare e conservare la mappa la feature non esiste; è anche l'unica parte che il DM può usare da solo, prima ancora che arrivino i giocatori.

**Independent Test**: un DM crea una mappa vuota, disegna una stanza con muri, pavimento e una porta, ricarica la pagina e ritrova esattamente lo stesso disegno, modificabile.

**Acceptance Scenarios**:

1. **Given** una campagna senza mappa, **When** il DM crea una mappa a celle di una dimensione scelta, **Then** compare una griglia vuota pronta da disegnare.
2. **Given** una mappa in modifica, **When** il DM sceglie "muro" e trascina il pennello su più celle, **Then** tutte le celle attraversate diventano muro.
3. **Given** un'area chiusa da muri, **When** il DM usa il riempimento con "pavimento" su una cella al suo interno, **Then** tutte le celle contigue dello stesso tipo diventano pavimento e nessuna cella oltre i muri cambia.
4. **Given** celle già dipinte, **When** il DM usa la gomma, **Then** le celle toccate tornano vuote.
5. **Given** una mappa disegnata, **When** il DM esce e riapre la campagna, **Then** ritrova la mappa com'era e può modificarla.

---

### User Story 2 - I giocatori vedono la mappa in tempo reale (Priority: P1)

I giocatori della campagna vedono la mappa a celle disegnata dal DM, con la griglia e i token sopra di essa. Quando il DM modifica la mappa, i giocatori già connessi vedono il cambiamento senza ricaricare. Chi si connette dopo vede lo stato attuale. I giocatori non possono modificare la mappa.

**Why this priority**: la mappa serve a giocare insieme; un editor che solo il DM vede non cambia l'esperienza del tavolo.

**Independent Test**: con DM e Player connessi, il DM dipinge alcune celle; il Player le vede comparire; il Player prova a modificare una cella e non ci riesce.

**Acceptance Scenarios**:

1. **Given** un Player connesso, **When** il DM completa un tratto di disegno, **Then** il Player vede le celle cambiare entro un secondo.
2. **Given** una mappa a celle con dei token, **When** un Player apre il tavolo, **Then** vede mappa, griglia e token nella stessa posizione di tutti gli altri.
3. **Given** un Player, **When** tenta di modificare una cella (anche con una richiesta diretta), **Then** la modifica è rifiutata e la mappa resta invariata.
4. **Given** un partecipante che si connette in ritardo, **When** apre la campagna, **Then** vede la mappa nello stato attuale.

---

### User Story 3 - Annullare, ripetere e correggere (Priority: P2)

Il DM può annullare e ripetere gli ultimi tratti, svuotare l'intera mappa e cambiarne la dimensione, per correggere gli errori senza ricominciare.

**Why this priority**: disegnare a mano produce errori; senza annulla il DM non si fida dello strumento. Ma la mappa è già utilizzabile senza.

**Independent Test**: il DM dipinge tre tratti, ne annulla due e li ripete; poi ingrandisce la mappa e ritrova il disegno intatto.

**Acceptance Scenarios**:

1. **Given** un tratto appena disegnato, **When** il DM sceglie "annulla", **Then** la mappa torna com'era prima del tratto, anche per i giocatori.
2. **Given** un tratto annullato, **When** il DM sceglie "ripeti", **Then** il tratto torna.
3. **Given** una mappa disegnata, **When** il DM la ingrandisce, **Then** le celle esistenti restano dove sono e le nuove sono vuote.
4. **Given** una mappa con dei token, **When** il DM la rimpicciolisce lasciando dei token fuori dal nuovo bordo, **Then** i token vengono riportati dentro il bordo e il DM ne è avvisato.
5. **Given** una mappa disegnata, **When** il DM la svuota, **Then** gli viene chiesta conferma e, se conferma, tutte le celle tornano vuote.

---

### User Story 4 - Scegliere tra immagine e mappa a celle (Priority: P2)

Una campagna usa una sola mappa alla volta: o l'immagine caricata (come oggi) o la mappa a celle. Il DM sceglie quale mostrare e può passare dall'una all'altra senza perdere il lavoro dell'altra.

**Why this priority**: tiene vivo ciò che già funziona (l'upload) e dà al DM la scelta; non blocca però il disegno.

**Independent Test**: una campagna con un'immagine caricata e una mappa a celle: il DM passa da una all'altra e ogni volta i giocatori vedono quella scelta, con i token intatti.

**Acceptance Scenarios**:

1. **Given** una campagna con solo un'immagine, **When** il DM crea una mappa a celle e la attiva, **Then** i giocatori vedono la mappa a celle e l'immagine non è cancellata.
2. **Given** una campagna con entrambe, **When** il DM attiva l'immagine, **Then** i giocatori vedono l'immagine e la mappa a celle resta salvata.
3. **Given** una mappa a celle non più voluta, **When** il DM la elimina dopo conferma, **Then** non può più essere riattivata.

---

### Edge Cases

- Il DM apre lo stesso tavolo in due schede e disegna in entrambe: per ogni cella vale l'ultima modifica ricevuta e tutti convergono sullo stesso stato.
- La connessione cade durante un tratto: al ritorno online il DM vede lo stato reale condiviso e un messaggio chiaro dice se l'ultimo tratto è stato salvato o va rifatto.
- Un Player viene rimosso dalla campagna: perde subito la vista della mappa.
- Il DM chiede una dimensione fuori dai limiti: la richiesta è rifiutata con un messaggio che indica i limiti.
- Riempimento su un'area molto estesa: l'operazione si completa comunque in un tempo accettabile e conta come un solo tratto da annullare.
- Un token si trova su una cella che il DM trasforma in muro: il token resta dov'è (la mappa non blocca i movimenti).
- Il DM disegna fuori dalla griglia con il mouse: le celle fuori dal bordo sono ignorate.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Il DM MUST poter creare per la propria campagna una mappa a celle, scegliendone la dimensione entro un limite massimo.
- **FR-002**: Ogni cella MUST avere uno tra questi tipi: vuoto, pavimento, muro, porta, acqua; ogni tipo MUST essere riconoscibile a colpo d'occhio.
- **FR-003**: Il DM MUST poter dipingere le celle con un pennello, riempire un'area contigua dello stesso tipo e cancellare con una gomma.
- **FR-004**: Il DM MUST poter scegliere il tipo di cella prima di disegnare e vedere quale è attivo.
- **FR-005**: La mappa a celle MUST essere conservata in modo permanente e MUST poter essere riaperta e modificata in qualsiasi momento.
- **FR-006**: I membri della campagna MUST vedere la mappa a celle sotto la griglia e i token, con la stessa dimensione della cella usata oggi.
- **FR-007**: Ogni modifica del DM MUST essere visibile ai giocatori connessi senza ricaricare la pagina; chi si connette dopo MUST ricevere lo stato attuale.
- **FR-008**: Solo il DM MUST poter creare, modificare, cambiare dimensione, svuotare o eliminare la mappa a celle; un Player MUST NOT poterlo fare nemmeno con richieste dirette.
- **FR-009**: Il DM MUST poter annullare e ripetere i propri ultimi tratti.
- **FR-010**: Il DM MUST poter cambiare la dimensione della mappa conservando le celle esistenti; i token rimasti fuori dal nuovo bordo MUST essere riportati dentro e il DM MUST esserne avvisato.
- **FR-011**: Svuotare o eliminare la mappa MUST richiedere una conferma esplicita.
- **FR-012**: Una campagna MUST mostrare una sola mappa alla volta, scelta dal DM tra immagine e mappa a celle; cambiare scelta MUST NOT cancellare l'altra.
- **FR-013**: I token, i dadi e l'aggancio alla griglia MUST funzionare con la mappa a celle esattamente come con l'immagine.
- **FR-014**: L'editor MUST funzionare con il mouse e con il tocco su tablet, e il disegno MUST poter essere fatto anche solo con la tastiera per le azioni essenziali (scegliere tipo e strumento, annullare, ripetere).
- **FR-015**: La mappa a celle MUST NOT bloccare il movimento dei token né nascondere parti della mappa: muri e porte sono solo aspetto.

### Key Entities

- **Mappa a celle**: la mappa disegnata di una campagna; ha dimensioni (colonne e righe) e può essere attiva oppure no.
- **Cella**: un quadratino della mappa, identificato dalla sua posizione (colonna e riga), con un tipo.
- **Tipo di cella**: vuoto, pavimento, muro, porta, acqua; determina l'aspetto della cella.
- **Mappa attiva**: la scelta del DM tra immagine caricata e mappa a celle; è quella che vedono tutti.
- **Tratto**: un'azione continua di disegno (pennello trascinato, un riempimento, una cancellazione) che si annulla e si ripete come un'unica operazione.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un DM disegna una stanza di circa 10×8 celle con muri, pavimento e una porta in meno di 3 minuti la prima volta che usa l'editor.
- **SC-002**: Una modifica del DM è visibile ai giocatori connessi in meno di 1 secondo nel 95% dei casi.
- **SC-003**: Il 100% dei tentativi di un Player di modificare la mappa a celle viene bloccato.
- **SC-004**: Una mappa del limite massimo con 50 token resta fluida, sia nel disegno del DM sia nella vista dei giocatori, senza ritardi percepibili.
- **SC-005**: Dopo aver chiuso e riaperto la pagina, il 100% delle celle disegnate è ritrovato nello stesso stato.
- **SC-006**: Il peso del primo caricamento dell'app, escluse le immagini, resta sotto i 500 KB anche con l'editor incluso.
- **SC-007**: Il DM annulla un errore di disegno in un solo gesto, senza ricominciare la mappa, nel 100% dei casi di errore su un tratto.

## Assumptions

- La feature estende il perimetro della 001, che escludeva il disegno libero: qui si aggiunge un editor a celle per il DM; resta esclusa la pittura libera a mano e a colori.
- Il pubblico resta un gruppo ristretto di amici (circa 6 persone per campagna, poche campagne); un solo DM per campagna disegna.
- La dimensione massima della mappa è di circa 40 colonne per 30 righe; un valore di partenza ragionevole, da rivedere nel piano.
- Una campagna ha una sola mappa a celle alla volta; più mappe e scene restano rimandate, come nella 001.
- Le porte sono solo aspetto: non si aprono né si chiudono, e muri e porte non bloccano token né visuale. Nebbia di guerra e linea di vista restano fuori ambito.
- Il tipo "vuoto" mostra lo sfondo neutro del tavolo; non esistono altri tipi di cella (erba, lava, trappole) in questa versione.
- Passare da immagine a mappa a celle conserva l'altra finché il DM non la elimina esplicitamente.
- La griglia, la dimensione della cella e i token esistenti sono quelli della 001; la posizione dei token in celle non cambia.
- Desktop e tablet sono il bersaglio; il telefono è utilizzabile per guardare, ma non per disegnare con comodità.
- Stack, permessi sulle tabelle, peso e assenza di server propri derivano dalla costituzione e vanno trattati nel piano.
