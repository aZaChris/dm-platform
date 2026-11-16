# Feature Specification: Tavolo base

**Feature Branch**: `001-tavolo-base`

**Created**: 2026-11-16

**Status**: Draft

**Input**: User description: "Tavolo base: un giocatore accede, crea o entra in una campagna con ruolo DM o Player, e tutti i partecipanti vedono in tempo reale una mappa con griglia su cui il DM carica un'immagine di sfondo e sposta/crea token; i Player muovono solo i propri token."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Accedere e unirsi a una campagna (Priority: P1)

Una persona crea un account con la propria email, accede, crea una campagna (diventandone DM) oppure entra in una campagna esistente tramite un link di invito (diventando Player).

**Why this priority**: senza identità e campagna non esiste un tavolo condiviso; è la base di tutto il resto.

**Independent Test**: due persone diverse si registrano; la prima crea una campagna e genera un invito, la seconda lo usa e vede la stessa campagna con il ruolo Player.

**Acceptance Scenarios**:

1. **Given** una persona senza account, **When** si registra con email e password, **Then** può accedere e vede l'elenco delle proprie campagne (vuoto).
2. **Given** una persona autenticata, **When** crea una campagna, **Then** ne risulta DM.
3. **Given** un link di invito valido, **When** una persona autenticata lo apre, **Then** entra nella campagna come Player.
4. **Given** una persona non invitata, **When** prova ad aprire una campagna, **Then** l'accesso le è negato.

---

### User Story 2 - Vedere la mappa condivisa (Priority: P1)

Il DM carica un'immagine di sfondo per la mappa della campagna; su di essa è mostrata una griglia. Tutti i partecipanti vedono la stessa mappa con la stessa griglia.

**Why this priority**: la mappa è il cuore dell'esperienza "tavolo virtuale".

**Independent Test**: il DM carica un'immagine; un Player già connesso la vede comparire senza ricaricare la pagina.

**Acceptance Scenarios**:

1. **Given** una campagna senza mappa, **When** il DM carica un'immagine, **Then** tutti i partecipanti connessi la vedono con la griglia sovrapposta.
2. **Given** una mappa visibile, **When** il DM sostituisce l'immagine, **Then** i token restano alle stesse posizioni sulla griglia.
3. **Given** un Player, **When** tenta di caricare o cambiare l'immagine, **Then** l'azione non è disponibile.

---

### User Story 3 - Creare e muovere i token in tempo reale (Priority: P1)

Il DM crea token (con nome e immagine o colore) e li assegna a un giocatore o li tiene propri (es. mostri). I token si trascinano sulla mappa e agganciano la griglia. Ogni movimento è visibile a tutti subito. Un Player può muovere solo i token a lui assegnati; il DM può muoverli tutti.

**Why this priority**: muovere token è l'azione principale di gioco e giustifica l'intera feature.

**Independent Test**: con DM e Player connessi, il Player trascina il proprio token e il DM lo vede spostarsi; il Player prova a trascinare un token del DM e non ci riesce.

**Acceptance Scenarios**:

1. **Given** un token assegnato a un Player, **When** il Player lo trascina, **Then** si aggancia alla cella più vicina e tutti vedono la nuova posizione entro un secondo.
2. **Given** un token non assegnato al Player, **When** il Player prova a spostarlo, **Then** il token non si muove.
3. **Given** un DM, **When** crea, rinomina, sposta o elimina un token, **Then** tutti i partecipanti vedono la modifica.
4. **Given** un partecipante che si connette in ritardo, **When** apre la campagna, **Then** vede mappa e token nello stato attuale.

---

### Edge Cases

- Due persone muovono lo stesso token nello stesso istante: vince l'ultima posizione ricevuta e tutti convergono sullo stesso stato.
- Perdita di connessione durante un trascinamento: al ritorno online il token mostra la posizione reale condivisa.
- Un Player viene rimosso dalla campagna: perde subito accesso a mappa e token; i suoi token restano al DM.
- Immagine di sfondo troppo grande o di formato non supportato: l'upload è rifiutato con un messaggio chiaro.
- Invito già usato o scaduto: l'ingresso è rifiutato con un messaggio chiaro.
- Token trascinato fuori dalla mappa: viene riportato dentro il bordo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Il sistema MUST permettere registrazione e accesso con email e password.
- **FR-002**: Un utente autenticato MUST poter creare una campagna ed esserne DM.
- **FR-003**: Il DM MUST poter generare un link di invito; chi lo usa MUST entrare come Player.
- **FR-004**: Solo i membri di una campagna MUST poterne vedere mappa e token.
- **FR-005**: Il DM MUST poter caricare e sostituire l'immagine di sfondo; i Player MUST NOT poterlo fare.
- **FR-006**: La mappa MUST mostrare una griglia a celle quadrate uguale per tutti.
- **FR-007**: Il DM MUST poter creare, rinominare, assegnare, spostare ed eliminare token.
- **FR-008**: Un Player MUST poter spostare solo i token assegnati a lui; il DM MUST poterli spostare tutti.
- **FR-009**: Il trascinamento di un token MUST agganciarsi alla cella più vicina.
- **FR-010**: Ogni modifica a mappa e token MUST essere visibile a tutti i partecipanti connessi senza ricaricare la pagina.
- **FR-011**: Alla connessione un partecipante MUST ricevere lo stato corrente di mappa e token.
- **FR-012**: Il sistema MUST rifiutare immagini non supportate o oltre il limite di dimensione, con un messaggio comprensibile.
- **FR-013**: Il DM MUST poter rimuovere un Player dalla campagna, con perdita immediata di accesso.

### Key Entities

- **Utente**: persona con email e password, può partecipare a più campagne.
- **Campagna**: contenitore del gioco; ha un DM e zero o più Player.
- **Appartenenza**: lega un utente a una campagna con ruolo DM o Player.
- **Invito**: link per entrare in una campagna come Player; può essere scaduto o già usato.
- **Mappa**: immagine di sfondo e parametri della griglia di una campagna.
- **Token**: pedina sulla mappa con nome, aspetto, posizione in cella ed eventuale giocatore assegnato.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una nuova persona completa registrazione e creazione della prima campagna in meno di 2 minuti.
- **SC-002**: Un invitato entra in una campagna in meno di 1 minuto dall'apertura del link.
- **SC-003**: Il movimento di un token è visibile agli altri partecipanti in meno di 1 secondo nel 95% dei casi.
- **SC-004**: Un tavolo con 1 DM, 5 Player e 50 token resta fluido senza ritardi percepibili.
- **SC-005**: Il 100% dei tentativi di un Player di modificare token non assegnati o la mappa viene bloccato.
- **SC-006**: Il peso totale scaricato al primo caricamento dell'app, escluse le immagini di mappa, resta sotto i 500 KB.

## Assumptions

- Il pubblico è un gruppo ristretto di amici (uso personale), non un servizio aperto: niente moderazione né pagamenti.
- Accesso con email e password; il recupero password è fuori ambito per questa feature.
- Una campagna ha una sola mappa attiva alla volta; più mappe e scene sono rimandate.
- La griglia è quadrata con dimensione cella fissa; griglia esagonale e regolazione fine sono rimandate.
- Nebbia di guerra, misurazione distanze e disegno libero sono fuori ambito.
- Chat, dadi, video, turni e scheda 5e sono feature successive.
- L'uso è da browser desktop e tablet; il telefono è utilizzabile ma non ottimizzato.
- I limiti tecnici (stack, permessi, peso) derivano dalla costituzione del progetto e sono trattati nel plan.
