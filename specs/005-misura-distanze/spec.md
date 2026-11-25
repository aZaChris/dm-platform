# Feature Specification: Misurazione delle distanze

**Feature Branch**: `005-misura-distanze`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Misurazione distanze (feature 005). Un righello sulla mappa: si trascina da una cella a un'altra e si legge la distanza in celle e in piedi; gli altri al tavolo vedono la misura mentre la si fa."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Misurare una distanza (Priority: P1)

Un membro attiva il righello, preme su una cella e trascina fino a un'altra. Una linea unisce le due celle e un'etichetta mostra la distanza in celle e in piedi (5 piedi per cella). Rilasciando, la misura sparisce.

**Why this priority**: "ci arrivo?" è la domanda più frequente in combattimento; è il valore intero della feature.

**Independent Test**: il Player misura da un token a una cella 6 celle più a destra e 2 più in basso e legge "6 celle · 30 ft".

**Acceptance Scenarios**:

1. **Given** il righello attivo, **When** un membro trascina da una cella a un'altra sulla stessa riga distante 4 celle, **Then** legge 4 celle e 20 ft.
2. **Given** un percorso in diagonale, **When** un membro misura 3 celle in diagonale e 2 in orizzontale, **Then** legge 5 celle e 25 ft (ogni passo in diagonale vale una cella).
3. **Given** una misura in corso, **When** il membro rilascia, **Then** linea ed etichetta spariscono.
4. **Given** il righello attivo, **When** il membro trascina, **Then** nessun token si muove.

---

### User Story 2 - Mostrare la misura agli altri (Priority: P2)

Mentre un membro misura, gli altri connessi vedono la stessa linea con la stessa etichetta e il nome di chi sta misurando. Quando rilascia, sparisce anche per loro.

**Why this priority**: al tavolo si discute insieme della distanza; senza condivisione il righello resta comunque utile.

**Independent Test**: il Player misura; il DM, in un altro browser, vede la linea muoversi e l'etichetta con il nome del Player.

**Acceptance Scenarios**:

1. **Given** un membro che misura, **When** un altro guarda la mappa, **Then** vede linea, distanza e nome di chi misura, aggiornati mentre si muove.
2. **Given** la misura finita, **When** chi misurava rilascia o perde la connessione, **Then** la linea sparisce anche per gli altri entro pochi secondi.

---

### Edge Cases

- Partenza e arrivo nella stessa cella: distanza 0 celle, 0 ft.
- Trascinamento oltre il bordo della mappa: il punto d'arrivo si ferma all'ultima cella sul bordo.
- Due membri misurano nello stesso momento: ognuno vede entrambe le misure, ciascuna con il suo nome.
- Uso da tablet: il righello funziona con il dito senza far scorrere la pagina.
- Uso solo da tastiera: con il righello attivo si sceglie la cella di partenza, ci si sposta con le frecce e si legge la distanza.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ogni membro MUST poter attivare e disattivare il righello sulla mappa.
- **FR-002**: La misura MUST andare dal centro di una cella al centro di un'altra e mostrare la distanza in celle e in piedi, con 5 piedi per cella.
- **FR-003**: Sulla griglia quadrata la distanza MUST contare ogni passo in diagonale come una cella: il numero di celle è il maggiore tra la differenza di colonne e quella di righe.
- **FR-004**: Con il righello attivo il trascinamento MUST NOT spostare token né modificare la mappa.
- **FR-005**: La misura MUST essere mostrata in tempo reale agli altri membri connessi, con il nome di chi misura, e MUST sparire per tutti quando finisce.
- **FR-006**: Le misure MUST NOT essere salvate: non restano dopo la fine né per chi si connette dopo.
- **FR-007**: Il righello MUST funzionare con mouse, dito e tastiera.
- **FR-008**: Il righello MUST funzionare sia sulla mappa a immagine sia sulla mappa a celle.

### Key Entities

- **Misura**: dato temporaneo con autore, cella di partenza e cella d'arrivo; esiste solo mentre si misura.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un membro ottiene la distanza tra due celle in meno di 3 secondi dall'attivazione del righello.
- **SC-002**: La distanza mostrata è corretta nel 100% delle prove su percorsi orizzontali, verticali e diagonali.
- **SC-003**: La misura di un membro compare agli altri in meno di 1 secondo nel 95% dei casi.
- **SC-004**: Il peso del primo caricamento dell'app, escluse le immagini, resta sotto i 500 KB anche con il righello.

## Assumptions

- Regola delle diagonali: quella base di D&D 5e (ogni diagonale vale 5 ft); la regola alternata 5-10-5 è rimandata.
- La misura è in linea retta tra due celle; percorsi a più tappe e aree d'effetto (coni, sfere) sono rimandati.
- Muri e porte della mappa a celle non influenzano la misura.
- 5 piedi per cella è un valore fisso; scale diverse sono rimandate.
- Con la griglia esagonale (feature 006) la distanza è il numero di esagoni attraversati: la regola si definisce lì.
