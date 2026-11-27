# Feature Specification: Griglia esagonale

**Feature Branch**: `006-griglia-esagonale`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Opzione di griglia esagonale (feature 006). Il DM sceglie per la campagna una griglia quadrata o esagonale; token, movimento e misurazione seguono la griglia scelta."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scegliere la griglia esagonale (Priority: P1)

Il DM apre le impostazioni della mappa e sceglie tra griglia quadrata ed esagonale. Tutti i membri vedono la mappa con la griglia scelta.

**Why this priority**: è la scelta stessa; senza di essa la feature non esiste.

**Independent Test**: il DM passa a esagonale; il Player, già connesso, vede la griglia cambiare senza ricaricare.

**Acceptance Scenarios**:

1. **Given** una campagna con mappa a immagine e griglia quadrata, **When** il DM sceglie esagonale, **Then** tutti i membri connessi vedono la griglia a esagoni.
2. **Given** la griglia esagonale, **When** il DM torna a quadrata, **Then** tutti vedono di nuovo la griglia quadrata.
3. **Given** un Player, **When** cerca di cambiare la griglia, **Then** l'azione non è disponibile.
4. **Given** una campagna nuova, **When** si apre la mappa la prima volta, **Then** la griglia è quadrata.

---

### User Story 2 - Muovere i token sugli esagoni (Priority: P1)

Con la griglia esagonale, trascinare un token lo aggancia al centro dell'esagono più vicino. Con la tastiera il token si muove verso gli esagoni vicini.

**Why this priority**: una griglia su cui i token non si agganciano non serve a giocare.

**Independent Test**: il Player trascina il proprio token a metà tra due esagoni e lo vede agganciarsi al più vicino; il DM vede la stessa posizione.

**Acceptance Scenarios**:

1. **Given** la griglia esagonale, **When** un membro rilascia un token, **Then** il token si aggancia al centro dell'esagono più vicino e tutti vedono la stessa posizione.
2. **Given** dei token sulla mappa, **When** il DM cambia tipo di griglia, **Then** ogni token resta nella stessa colonna e nella stessa riga, riportato dentro il bordo se serve.
3. **Given** un token selezionato con la griglia esagonale, **When** il membro usa le frecce, **Then** il token si sposta su un esagono confinante.

---

### User Story 3 - Misurare sugli esagoni (Priority: P2)

Con la griglia esagonale il righello conta gli esagoni attraversati e mostra la distanza in esagoni e in piedi.

**Why this priority**: dipende dalla feature di misurazione; senza, la griglia esagonale è già usabile.

**Independent Test**: il Player misura tra due esagoni distanti 3 passi e legge "3 esagoni · 15 ft".

**Acceptance Scenarios**:

1. **Given** la griglia esagonale e il righello, **When** un membro misura tra due esagoni confinanti, **Then** legge 1 esagono e 5 ft.
2. **Given** due esagoni lontani, **When** un membro misura, **Then** legge il numero minimo di passi tra esagoni confinanti.

---

### Edge Cases

- Mappa a celle attiva: la scelta della griglia esagonale non è disponibile e il DM ne legge il motivo.
- Esagoni tagliati dal bordo dell'immagine: si vedono parziali e un token può stare su di essi, come oggi le celle parziali.
- Cambio di griglia durante un trascinamento di un altro membro: il token finisce sulla posizione valida della nuova griglia.
- Frecce su o giù con gli esagoni: il token va all'esagono confinante sopra o sotto più vicino; se in quella direzione non ce n'è uno, non si muove.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Il DM MUST poter scegliere per la campagna una griglia quadrata o esagonale; la griglia predefinita MUST essere quadrata.
- **FR-002**: Solo il DM MUST poter cambiare il tipo di griglia, anche con richieste dirette.
- **FR-003**: Il cambio di griglia MUST essere visibile a tutti i membri connessi senza ricaricare; chi si connette dopo MUST vedere la griglia attuale.
- **FR-004**: Con la griglia esagonale il trascinamento di un token MUST agganciarsi al centro dell'esagono più vicino.
- **FR-005**: Al cambio di griglia ogni token MUST conservare colonna e riga e restare dentro i bordi della mappa.
- **FR-006**: Con la griglia esagonale le frecce MUST spostare un token selezionato verso un esagono confinante.
- **FR-007**: Con la griglia esagonale la misurazione MUST contare il numero minimo di passi tra esagoni confinanti, con 5 piedi per esagono.
- **FR-008**: La griglia esagonale MUST essere disponibile solo con la mappa a immagine; con la mappa a celle la griglia resta quadrata.
- **FR-009**: Tutte le funzioni esistenti (tiri, turni, evidenziazione del token di turno) MUST funzionare con entrambe le griglie.

### Key Entities

- **Mappa**: si aggiunge il tipo di griglia (quadrata o esagonale).
- **Token**: invariato; la posizione resta espressa in colonna e riga, interpretate secondo la griglia.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Il DM cambia tipo di griglia in meno di 10 secondi, e tutti i membri lo vedono in meno di 1 secondo nel 95% dei casi.
- **SC-002**: Il 100% dei token rilasciati sulla griglia esagonale finisce al centro di un esagono, nella stessa posizione per tutti.
- **SC-003**: La distanza tra esagoni è corretta nel 100% delle prove su percorsi in tutte e sei le direzioni.
- **SC-004**: Il 100% dei tentativi di un Player di cambiare la griglia viene bloccato.
- **SC-005**: Il peso del primo caricamento dell'app, escluse le immagini, resta sotto i 500 KB anche con la griglia esagonale.

## Assumptions

- Esagoni con un vertice in alto (righe orizzontali sfalsate), della stessa larghezza delle celle quadrate attuali; l'orientamento con un lato in alto e la regolazione della dimensione sono rimandati.
- L'editor di mappe a celle (feature 002) resta a celle quadrate: dipingere esagoni è rimandato.
- La scelta della griglia vale per tutta la campagna, non per singola mappa (oggi la campagna ha una sola mappa).
- La conversione delle distanze in piedi segue la feature 005 (5 piedi per passo).
- La geometria degli esagoni (aggancio, vicini, distanza) è logica non banale: secondo la costituzione richiede un piccolo test.
