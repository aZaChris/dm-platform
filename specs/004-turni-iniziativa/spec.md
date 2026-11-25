# Feature Specification: Turni e iniziativa

**Feature Branch**: `004-turni-iniziativa`

**Created**: 2026-11-25

**Status**: Draft

**Input**: User description: "Turni e iniziativa (feature 004). Il DM avvia un combattimento, i partecipanti tirano o inseriscono l'iniziativa, tutti vedono l'ordine dei turni e di chi è il turno; il DM fa avanzare turni e round."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Avviare un combattimento e stabilire l'ordine (Priority: P1)

Il DM avvia un combattimento e sceglie chi partecipa tra i token sulla mappa. Per ogni partecipante si stabilisce l'iniziativa: con un tiro di d20 più modificatore fatto dall'app, oppure inserendo a mano un numero (per chi tira con i dadi veri). L'elenco si ordina da solo dal valore più alto al più basso e tutti i membri lo vedono.

**Why this priority**: senza un ordine condiviso non c'è gestione dei turni.

**Independent Test**: il DM avvia un combattimento con tre token, tira l'iniziativa di un mostro, inserisce a mano 15 per un altro; il Player tira per il proprio token; tutti vedono lo stesso elenco ordinato.

**Acceptance Scenarios**:

1. **Given** un tavolo con dei token, **When** il DM avvia un combattimento scegliendo alcuni token, **Then** tutti i membri vedono l'elenco dei partecipanti.
2. **Given** un partecipante senza iniziativa, **When** il DM la tira con un modificatore, **Then** il risultato compare nell'elenco e il tiro è visibile come gli altri tiri.
3. **Given** un Player con un token in combattimento, **When** tira o inserisce l'iniziativa del proprio token, **Then** il valore compare; non può farlo per token non suoi.
4. **Given** valori diversi, **When** l'elenco viene mostrato, **Then** è ordinato dal più alto al più basso.
5. **Given** due partecipanti con lo stesso valore, **When** l'elenco viene ordinato, **Then** viene prima chi ha il modificatore più alto; a parità anche di quello, il DM può scambiarli.

---

### User Story 2 - Far avanzare turni e round (Priority: P1)

Il DM preme "Turno successivo": il turno passa al partecipante seguente; dopo l'ultimo ricomincia dal primo e il contatore dei round sale di uno. Tutti vedono di chi è il turno, nell'elenco e con il token evidenziato sulla mappa.

**Why this priority**: è ciò che si usa per tutto il combattimento; insieme alla storia 1 forma il minimo utile.

**Independent Test**: con tre partecipanti il DM preme "Turno successivo" tre volte; tutti vedono il turno passare a ognuno e il round diventare 2 al ritorno al primo.

**Acceptance Scenarios**:

1. **Given** un combattimento con l'ordine stabilito, **When** il DM lo fa partire, **Then** il turno è del primo dell'elenco e il round è 1.
2. **Given** il turno dell'ultimo, **When** il DM preme "Turno successivo", **Then** il turno torna al primo e il round sale di uno.
3. **Given** un turno in corso, **When** un membro guarda la mappa, **Then** il token di turno è evidenziato.
4. **Given** il DM che ha premuto per errore, **When** preme "Turno precedente", **Then** il turno torna indietro, anche al round prima.
5. **Given** un Player, **When** cerca di far avanzare il turno, **Then** l'azione non è disponibile.

---

### User Story 3 - Correggere il combattimento in corso (Priority: P2)

Durante il combattimento il DM aggiunge un partecipante arrivato dopo, ne toglie uno sconfitto, cambia un valore di iniziativa o termina il combattimento.

**Why this priority**: i combattimenti reali cambiano; senza correzioni il DM dovrebbe ricominciare da capo.

**Independent Test**: a metà del round 2 il DM aggiunge un mostro con iniziativa 12, ne rimuove un altro e cambia un valore; l'ordine si aggiorna per tutti e il turno corrente resta a chi lo aveva.

**Acceptance Scenarios**:

1. **Given** un combattimento in corso, **When** il DM aggiunge un partecipante con la sua iniziativa, **Then** entra al posto giusto nell'ordine senza cambiare di chi è il turno.
2. **Given** un partecipante di turno, **When** il DM lo rimuove, **Then** il turno passa al successivo.
3. **Given** un combattimento, **When** il DM lo termina dopo conferma, **Then** l'elenco sparisce per tutti e l'evidenziazione sulla mappa si toglie.

---

### Edge Cases

- Un token in combattimento viene eliminato dalla mappa: esce dall'elenco; se era di turno, il turno passa al successivo.
- Si fa partire il combattimento con partecipanti senza iniziativa: la partenza è bloccata finché ognuno non ha un valore, con indicato chi manca.
- Un membro si connette a combattimento in corso: vede subito elenco, turno e round attuali.
- Un combattimento con un solo partecipante: ogni "Turno successivo" fa salire il round.
- Il DM chiude la pagina: il combattimento resta com'era alla riapertura.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Il DM MUST poter avviare un combattimento scegliendo i partecipanti tra i token della mappa.
- **FR-002**: L'iniziativa di un partecipante MUST potersi stabilire con un tiro di d20 più modificatore fatto dall'app, non falsificabile dal browser, oppure inserendo un numero a mano.
- **FR-003**: Il DM MUST poter stabilire l'iniziativa di ogni partecipante; un Player MUST poterlo fare solo per i token assegnati a lui.
- **FR-004**: L'elenco MUST essere ordinato per iniziativa decrescente; a parità, per modificatore decrescente; a parità di entrambi, il DM MUST poter cambiare l'ordine dei due.
- **FR-005**: Solo il DM MUST poter far partire, far avanzare, far tornare indietro e terminare il combattimento, anche con richieste dirette.
- **FR-006**: Il sistema MUST mostrare a tutti i membri l'elenco, il partecipante di turno e il numero del round, e MUST evidenziare sulla mappa il token di turno.
- **FR-007**: Ogni cambiamento del combattimento MUST essere visibile a tutti i membri connessi senza ricaricare; chi si connette dopo MUST vederne lo stato attuale.
- **FR-008**: Il DM MUST poter aggiungere e togliere partecipanti e cambiare l'iniziativa durante il combattimento senza che il turno corrente passi a un altro, salvo quando viene tolto proprio chi è di turno.
- **FR-009**: Terminare il combattimento MUST richiedere una conferma esplicita.
- **FR-010**: I tiri di iniziativa MUST comparire insieme agli altri tiri della campagna.
- **FR-011**: Tutti i comandi del combattimento MUST essere utilizzabili solo da tastiera.

### Key Entities

- **Combattimento**: appartiene a una campagna (al massimo uno attivo); ha un round e un partecipante di turno.
- **Partecipante**: un token in un combattimento, con valore di iniziativa, modificatore e posizione nell'ordine.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Il DM prepara un combattimento con 6 partecipanti, iniziative comprese, in meno di 1 minuto.
- **SC-002**: Il passaggio di turno è visibile a tutti i membri connessi in meno di 1 secondo nel 95% dei casi.
- **SC-003**: Il 100% dei tentativi di un Player di far avanzare i turni o di cambiare l'iniziativa di token non suoi viene bloccato.
- **SC-004**: In ogni prova con valori e modificatori uguali o diversi, l'ordine mostrato rispetta la regola di FR-004.
- **SC-005**: Il peso del primo caricamento dell'app, escluse le immagini, resta sotto i 500 KB anche con questa feature.

## Assumptions

- "Turni" e "iniziativa" sono una sola feature: l'iniziativa stabilisce l'ordine, i turni lo percorrono.
- Le regole di riferimento sono quelle di D&D 5e: d20 più modificatore di Destrezza, ordine decrescente.
- I partecipanti sono sempre token della mappa; il DM che vuole un mostro "fuori mappa" crea un token.
- Tutti i partecipanti sono visibili ai Player; partecipanti nascosti, condizioni, punti ferita e timer del turno sono rimandati (la scheda 5e sarà una feature a parte).
- Un solo combattimento attivo per campagna; non si conserva lo storico dei combattimenti finiti.
- La logica di ordinamento è non banale: secondo la costituzione richiede un piccolo test.
