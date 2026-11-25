# Feature Specification: Chat del tavolo

**Feature Branch**: `003-chat-tavolo`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Chat del tavolo (feature 003). I membri di una campagna si scrivono durante la partita; i tiri di dado compaiono nello stesso flusso; il DM può sussurrare a un singolo giocatore."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Scriversi durante la partita (Priority: P1)

Un membro della campagna scrive un messaggio nel riquadro della chat accanto alla mappa e lo invia. Tutti i membri connessi lo vedono comparire subito, con il nome di chi l'ha scritto e l'ora. Chi entra più tardi trova gli ultimi messaggi già scritti.

**Why this priority**: è il cuore della feature; senza messaggi condivisi non c'è chat.

**Independent Test**: DM e Player aperti in due browser; il Player scrive "ciao" e il DM lo vede senza ricaricare; il DM ricarica la pagina e ritrova il messaggio.

**Acceptance Scenarios**:

1. **Given** due membri connessi allo stesso tavolo, **When** uno invia un messaggio, **Then** l'altro lo vede entro un secondo con nome e ora.
2. **Given** una chat con messaggi già scritti, **When** un membro apre il tavolo, **Then** vede gli ultimi messaggi in ordine cronologico, il più recente in basso.
3. **Given** un messaggio vuoto o fatto solo di spazi, **When** il membro prova a inviarlo, **Then** non viene inviato.
4. **Given** una persona che non è membro della campagna, **When** prova a leggere o scrivere nella chat, **Then** l'accesso le è negato.

---

### User Story 2 - I tiri di dado nella chat (Priority: P2)

Quando un membro tira un dado, il risultato compare nella chat nello stesso flusso dei messaggi, nel punto giusto dell'ordine temporale e distinguibile a colpo d'occhio da un messaggio scritto.

**Why this priority**: oggi i tiri hanno un registro a parte; unirli alla chat dà un solo posto in cui seguire cosa succede al tavolo.

**Independent Test**: un Player scrive "attacco!" e poi tira un d20; il DM vede nella chat il messaggio seguito dal tiro, con totale e, se presente, l'esito contro la CD.

**Acceptance Scenarios**:

1. **Given** un messaggio e poi un tiro, **When** un membro guarda la chat, **Then** li vede nell'ordine in cui sono avvenuti.
2. **Given** un tiro nella chat, **When** un membro lo guarda, **Then** riconosce che è un tiro (non un testo scritto) e ne legge etichetta, risultato del dado, modificatore e totale.

---

### User Story 3 - Sussurrare a un giocatore (Priority: P3)

Il DM sceglie un destinatario e invia un messaggio privato: lo vedono solo il DM e quel giocatore. Un Player può sussurrare solo al DM.

**Why this priority**: utile per segreti e indizi, ma la partita si gioca anche senza.

**Independent Test**: con DM e due Player connessi, il DM sussurra al Player A; A lo vede segnato come privato, B non lo vede nemmeno ricaricando la pagina.

**Acceptance Scenarios**:

1. **Given** un sussurro dal DM al Player A, **When** il Player B guarda la chat, **Then** non lo vede, né in tempo reale né ricaricando.
2. **Given** un sussurro ricevuto, **When** il destinatario lo legge, **Then** è chiaramente indicato come privato, con il mittente.
3. **Given** un Player, **When** sceglie il destinatario di un sussurro, **Then** può scegliere solo il DM.

---

### Edge Cases

- Messaggio più lungo del limite: l'invio è bloccato e il membro vede quanti caratteri ha in eccesso.
- Perdita di connessione mentre si scrive: il testo non ancora inviato resta nel campo; al ritorno online la chat mostra i messaggi arrivati nel frattempo.
- Un Player viene rimosso dalla campagna: perde subito l'accesso alla chat; i suoi messaggi passati restano visibili agli altri con il suo nome.
- Testo con link o caratteri speciali: è mostrato come testo semplice, mai interpretato come formattazione o codice.
- Molti messaggi in poco tempo: l'ordine resta quello di arrivo per tutti.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Un membro della campagna MUST poter inviare messaggi di testo nella chat del tavolo.
- **FR-002**: Ogni messaggio MUST essere visibile a tutti i membri connessi senza ricaricare la pagina e MUST mostrare nome del mittente e ora.
- **FR-003**: All'apertura del tavolo un membro MUST vedere gli ultimi 100 messaggi della campagna in ordine cronologico.
- **FR-004**: Solo i membri della campagna MUST poter leggere e scrivere nella sua chat, anche con richieste dirette.
- **FR-005**: Il sistema MUST rifiutare messaggi vuoti e messaggi oltre 500 caratteri.
- **FR-006**: I tiri di dado MUST comparire nella chat nell'ordine temporale insieme ai messaggi, distinguibili da essi.
- **FR-007**: Il DM MUST poter inviare un sussurro a un singolo membro; un Player MUST poter sussurrare solo al DM.
- **FR-008**: Un sussurro MUST essere visibile solo a mittente e destinatario, anche con richieste dirette.
- **FR-009**: Il DM MUST poter eliminare qualsiasi messaggio; un membro MUST poter eliminare i propri. L'eliminazione MUST sparire per tutti senza ricaricare.
- **FR-010**: Il testo dei messaggi MUST essere mostrato come testo semplice.
- **FR-011**: La chat MUST essere utilizzabile solo da tastiera: scrivere, inviare con Invio e scegliere il destinatario di un sussurro.

### Key Entities

- **Messaggio**: testo scritto da un membro in una campagna, con mittente, ora ed eventuale destinatario (se è un sussurro).
- **Tiro**: già esistente (feature dadi); nella chat è mostrato insieme ai messaggi, senza diventare un messaggio.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un messaggio inviato è visibile agli altri membri connessi in meno di 1 secondo nel 95% dei casi.
- **SC-002**: Il 100% dei tentativi di leggere sussurri altrui o la chat di una campagna di cui non si è membri viene bloccato.
- **SC-003**: Un membro scrive e invia un messaggio in meno di 5 secondi dall'apertura del tavolo, senza istruzioni.
- **SC-004**: Con 6 membri e 500 messaggi nella campagna il tavolo si apre senza ritardi percepibili.
- **SC-005**: Il peso del primo caricamento dell'app, escluse le immagini, resta sotto i 500 KB anche con la chat inclusa.

## Assumptions

- Pubblico ristretto (circa 6 persone per campagna): niente moderazione, filtri o segnalazioni.
- Messaggi solo testo: niente immagini, allegati, reazioni, emoji personalizzate né formattazione.
- I messaggi non si modificano dopo l'invio; si possono solo eliminare.
- I messaggi restano finché la campagna esiste; chi apre il tavolo carica solo gli ultimi 100. Scorrere oltre è rimandato.
- Niente notifiche fuori dalla pagina e niente indicatore "sta scrivendo".
- I tiri restano gestiti dalla feature dadi esistente; questa feature li mostra soltanto nel flusso della chat e sostituisce il registro dei tiri separato.
- I sussurri sono uno a uno; i messaggi a gruppi di giocatori sono rimandati.
