# Feature Specification: Schede personaggio

**Feature Branch**: `007-schede-personaggio`

**Created**: 2026-11-26

**Status**: Draft

**Input**: User description: "Schede personaggio (feature 007). Ogni personaggio di una campagna ha una scheda D&D 5e completa (caratteristiche, competenze, tiri salvezza, PF, CA, attacchi, incantesimi, equipaggiamento, privilegi, background, note) collegata al suo token. Due viste con un interruttore: una scheda classica che riprende la disposizione della scheda 5e su carta (disegnata da noi, senza copiare la grafica ufficiale Wizards of the Coast), tutta modificabile; e una vista pratica e compatta per giocare, con PF, CA e tiri salvezza in alto e attacchi e incantesimi cliccabili che tirano il d20 del database. Import dei personaggi da Roll20: si carica il file JSON esportato con l'estensione VTT Enhancement Suite (uno o più personaggi) e i suoi attributi diventano una scheda. Permessi: il giocatore modifica solo le proprie schede, il DM tutte; tutti i membri vedono le schede della campagna. Le modifiche arrivano agli altri in tempo reale come per token e chat."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Giocare con la propria scheda (Priority: P1)

Un giocatore apre la scheda del suo personaggio nella vista pratica. In alto legge PF attuali e massimi, CA, iniziativa, velocità e i sei tiri salvezza; sotto, le abilità, gli attacchi e gli incantesimi. Durante la sessione abbassa e rialza i PF con un tocco, segna gli slot incantesimo usati e clicca un'abilità, un tiro salvezza o un attacco: parte un tiro di d20 del database con il modificatore giusto, visibile a tutti nell'overlay e nella chat.

**Why this priority**: è l'uso di ogni sera di gioco; senza una scheda pratica da cui tirare, il resto (import, vista classica) non serve.

**Independent Test**: il giocatore crea a mano un personaggio di 3° livello con Destrezza 16 e competenza in Furtività, clicca Furtività e vede in chat un tiro con modificatore +5.

**Acceptance Scenarios**:

1. **Given** un personaggio con Destrezza 16 e competenza in Furtività al 3° livello, **When** il giocatore clicca Furtività, **Then** parte un tiro d20 + 5 etichettato "Furtività" con il nome del personaggio, visibile a tutti.
2. **Given** un personaggio con 24 PF su 31, **When** il giocatore applica 7 danni, **Then** la scheda mostra 17/31 e gli altri membri vedono il nuovo valore senza ricaricare.
3. **Given** un personaggio con PF temporanei, **When** riceve danni, **Then** si consumano prima i PF temporanei, poi quelli normali.
4. **Given** un incantatore con 3 slot di 1° livello, **When** il giocatore ne segna uno usato, **Then** la scheda mostra 2 slot liberi su 3 e lo stato resta dopo aver ricaricato la pagina.
5. **Given** un attacco con bonus +6 e danno 1d8+4, **When** il giocatore clicca l'attacco, **Then** parte il tiro per colpire con +6 e l'attacco mostra il danno da tirare.

---

### User Story 2 - Scheda classica completa e modificabile (Priority: P2)

Con un interruttore il giocatore passa alla vista classica: la scheda è disposta come la scheda 5e su carta (caratteristiche a sinistra, tiri salvezza e abilità, al centro CA, iniziativa, velocità e PF, a destra tratti, ideali, legami e difetti; poi attacchi, equipaggiamento, privilegi, incantesimi, background e note). Ogni campo si modifica in quel punto e le modifiche si salvano da sole.

**Why this priority**: serve per creare e aggiornare il personaggio (salire di livello, nuovo equipaggiamento); al tavolo basta la vista pratica.

**Independent Test**: il giocatore apre la vista classica, cambia Forza da 14 a 16 e vede aggiornarsi da soli il modificatore, il tiro salvezza e l'abilità Atletica, anche nella vista pratica.

**Acceptance Scenarios**:

1. **Given** la vista pratica aperta, **When** il giocatore usa l'interruttore, **Then** vede la stessa scheda nella vista classica, e la scelta resta la prossima volta che apre una scheda.
2. **Given** la vista classica, **When** il giocatore cambia un punteggio di caratteristica, **Then** modificatore, tiri salvezza e abilità collegate si ricalcolano subito.
3. **Given** un personaggio che sale dal 4° al 5° livello, **When** il giocatore cambia il livello, **Then** il bonus di competenza passa da +2 a +3 e tutti i valori che lo usano si aggiornano.
4. **Given** un campo modificato, **When** il giocatore chiude e riapre la scheda, **Then** ritrova la modifica.

---

### User Story 3 - Importare i personaggi da Roll20 (Priority: P3)

Il giocatore (o il DM) carica il file JSON esportato da Roll20 con l'estensione VTT Enhancement Suite. L'app legge uno o più personaggi dal file, mostra un riepilogo (nome, classe, livello) e, dopo la conferma, crea le schede con tutti i dati riconosciuti. I campi che non trovano posto finiscono nelle note della scheda, così non si perde niente.

**Why this priority**: molti giocatori hanno già la scheda su Roll20 e non vogliono riscriverla; ma una scheda creata a mano funziona anche senza import.

**Independent Test**: il DM carica il JSON di un personaggio di 5° livello esportato da Roll20 e ritrova nella nuova scheda caratteristiche, PF, CA, competenze, attacchi e incantesimi uguali a quelli di Roll20.

**Acceptance Scenarios**:

1. **Given** un file JSON con un personaggio, **When** il giocatore lo carica, **Then** vede il riepilogo del personaggio prima di confermare.
2. **Given** un file con più personaggi, **When** il DM lo carica, **Then** sceglie quali importare e a quale membro assegnare ciascuno.
3. **Given** un personaggio importato, **When** si apre la scheda, **Then** caratteristiche, PF, CA, livello, competenze, attacchi, incantesimi ed equipaggiamento coincidono con quelli del file.
4. **Given** attributi del file che la scheda non riconosce, **When** l'import finisce, **Then** compaiono in una sezione delle note con il loro nome e valore.
5. **Given** un file che non è un export di Roll20 o è danneggiato, **When** viene caricato, **Then** l'app spiega che il file non è valido e non crea niente.

---

### User Story 4 - Schede della campagna e token (Priority: P3)

Ogni membro vede l'elenco delle schede della campagna e può aprirle in sola lettura se non sono sue. Il DM collega una scheda a un token sulla mappa: aprendo il token si apre la sua scheda e il nome del personaggio compare sul token.

**Why this priority**: al tavolo si guarda spesso la scheda degli altri (chi ha più PF, chi ha la cura); il collegamento al token rende tutto a un clic dalla mappa.

**Independent Test**: il DM collega la scheda di Aria al suo token; un altro giocatore apre il token dalla mappa e legge la scheda di Aria senza poterla modificare.

**Acceptance Scenarios**:

1. **Given** una campagna con tre schede, **When** un membro apre l'elenco, **Then** vede le tre schede con nome, classe, livello e PF.
2. **Given** la scheda di un altro giocatore, **When** un membro la apre, **Then** la legge ma non può modificare né tirare a nome di quel personaggio.
3. **Given** una scheda collegata a un token, **When** un membro apre il token dalla mappa, **Then** si apre quella scheda.
4. **Given** una scheda collegata, **When** il token viene eliminato, **Then** la scheda resta e risulta senza token.

---

### Edge Cases

- Due persone modificano la stessa scheda nello stesso momento (il giocatore e il DM): vale l'ultima modifica di ciascun campo e l'altro la vede comparire, senza perdere i campi diversi.
- PF che scendono sotto zero: la scheda si ferma a 0 e segnala i tiri salvezza contro la morte; i PF non superano il massimo con le cure.
- Punteggio di caratteristica fuori scala (meno di 1 o più di 30) o livello fuori da 1–20: il campo lo rifiuta e spiega il limite.
- Import di un personaggio con lo stesso nome di una scheda esistente: l'app chiede se crearne una nuova o sostituire quella esistente.
- File JSON molto grande o con decine di personaggi: l'import mostra l'elenco e non blocca la pagina.
- Il proprietario della scheda viene rimosso dalla campagna: la scheda resta al DM, che può riassegnarla.
- Uso da tablet o telefono: la vista pratica si legge in una colonna; la vista classica scorre senza far scorrere la pagina di lato.
- Uso solo da tastiera e con lettore di schermo: ogni campo ha un nome, ogni tiro cliccabile è un pulsante con il nome dell'abilità e il modificatore.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ogni campagna MUST poter avere più schede personaggio, ciascuna con un proprietario (un membro) che il DM può cambiare.
- **FR-002**: La scheda MUST contenere i campi della scheda D&D 5e: nome, classe e livello (anche multiclasse), razza, background, allineamento, punti esperienza; i sei punteggi di caratteristica; competenze nei tiri salvezza e nelle 18 abilità (con maestria); CA, iniziativa, velocità, PF massimi, attuali e temporanei, dadi vita, tiri salvezza contro la morte; attacchi (nome, bonus, danno e tipo); incantesimi per livello con slot massimi e usati, caratteristica da incantatore, CD e bonus d'attacco; equipaggiamento e monete; privilegi e tratti; competenze in armi, armature, strumenti e lingue; tratti, ideali, legami, difetti; aspetto e storia; note libere.
- **FR-003**: Modificatori, bonus di competenza (dal livello totale), tiri salvezza, abilità, percezione passiva, CD e bonus d'attacco degli incantesimi MUST essere calcolati dai valori della scheda; un bonus aggiuntivo manuale per voce MUST permettere di correggerli.
- **FR-004**: Un interruttore MUST passare tra vista pratica e vista classica della stessa scheda; la scelta MUST essere ricordata per ogni utente.
- **FR-005**: La vista classica MUST riprendere la disposizione della scheda 5e su carta con un aspetto proprio dell'app, senza riprodurre la grafica ufficiale di Wizards of the Coast.
- **FR-006**: Nella vista pratica abilità, tiri salvezza, prove di caratteristica, iniziativa e attacchi MUST essere cliccabili e lanciare il tiro d20 del database con etichetta e modificatore corretti, a nome del personaggio, visibile a tutti come gli altri tiri.
- **FR-007**: Danni, cure e PF temporanei MUST applicarsi con un'azione sola (i temporanei si consumano per primi, i PF restano tra 0 e il massimo), e gli slot incantesimo MUST potersi segnare e ripristinare.
- **FR-008**: Ogni modifica MUST salvarsi da sola e arrivare agli altri membri connessi in tempo reale, senza perdere le modifiche di altri campi fatte nello stesso momento.
- **FR-009**: Tutti i membri della campagna MUST vedere tutte le sue schede; solo il proprietario e il DM MUST poter modificare una scheda e tirare a nome del personaggio; i permessi MUST essere verificati dal sistema, non solo nascosti nell'interfaccia.
- **FR-010**: Il sistema MUST importare uno o più personaggi da un file JSON esportato da Roll20 con VTT Enhancement Suite, mostrando un riepilogo prima di creare le schede.
- **FR-011**: L'import MUST riconoscere gli attributi della scheda "D&D 5E by Roll20" (caratteristiche, competenze, PF, CA, livello e classe, attacchi, incantesimi, equipaggiamento, privilegi, testi del background) e MUST conservare nelle note, con nome e valore, gli attributi che non riconosce.
- **FR-012**: Un giocatore MUST poter importare solo schede assegnate a sé; il DM MUST poter importare e assegnare schede a qualsiasi membro o tenerle per sé.
- **FR-013**: Un file non valido MUST essere rifiutato con un messaggio chiaro, senza creare schede a metà.
- **FR-014**: Il DM MUST poter collegare una scheda a un token della campagna (al più un token per scheda); dal token MUST aprirsi la scheda collegata. Eliminare il token MUST NOT eliminare la scheda.
- **FR-015**: Una scheda MUST poter essere eliminata solo dal suo proprietario o dal DM, dopo una conferma.
- **FR-016**: Entrambe le viste MUST funzionare con mouse, dito e tastiera e su schermi da telefono a desktop.

### Key Entities

- **Scheda personaggio**: appartiene a una campagna e a un membro proprietario; contiene identità (nome, classe e livelli, razza, background), caratteristiche, competenze, combattimento (CA, PF, dadi vita, tiri contro la morte), attacchi, incantesimi e slot, equipaggiamento e monete, privilegi, testi narrativi e note; può essere collegata a un token.
- **Attacco**: voce della scheda con nome, bonus per colpire, danno e tipo di danno.
- **Incantesimo**: voce della scheda con nome, livello, se preparato e descrizione breve; gli slot sono contati per livello.
- **Import**: operazione temporanea che legge un file Roll20, propone i personaggi trovati e crea le schede confermate; non resta salvata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Durante il gioco un giocatore lancia un tiro dalla scheda in un clic e in meno di 3 secondi dall'apertura della scheda.
- **SC-002**: Un personaggio di livello 5 esportato da Roll20 si importa in meno di 1 minuto, e caratteristiche, PF, CA, competenze, attacchi e slot incantesimo coincidono con Roll20 nel 100% delle prove sui file del gruppo.
- **SC-003**: Nessun dato del file Roll20 va perso: ogni attributo non riconosciuto si ritrova nelle note.
- **SC-004**: Una modifica alla scheda compare agli altri membri connessi in meno di 1 secondo nel 95% dei casi.
- **SC-005**: I valori calcolati (modificatori, competenza, tiri salvezza, abilità, CD) sono corretti nel 100% delle prove su personaggi di livello 1, 5, 11 e 20.
- **SC-006**: Il peso del primo caricamento dell'app, escluse le immagini, resta sotto i 500 KB anche con le schede.

## Assumptions

- Regole di riferimento: D&D 5e 2014 (SRD 5.1); i campi della revisione 2024 che cambiano poco (per esempio i talenti d'origine) si scrivono nei privilegi. Una scheda 2024 dedicata è rimandata.
- La scheda Roll20 supportata dall'import è "D&D 5E by Roll20", la più usata; altre schede (Shaped, 2024) si importano dopo, partendo da un file d'esempio reale. Il convertitore si costruisce sui JSON veri del gruppo.
- I file Roll20 si ottengono con l'estensione VTT Enhancement Suite, un personaggio o più alla volta, dal DM o da ciascun giocatore; nessuna connessione diretta a Roll20.
- I file di altri giocatori si importano con il loro permesso; i file d'esempio usati per lo sviluppo restano fuori dal repository pubblico.
- Le schede sono per i personaggi giocanti; schede segrete del DM (mostri, PNG nascosti ai giocatori) sono rimandate.
- I danni degli attacchi si mostrano come formula da tirare; il tiro dei danni dal database arriverà quando il tiro supporterà dadi diversi dal d20.
- Ritratto del personaggio, condizioni sulla mappa, riposi brevi e lunghi automatici e esportazione verso Roll20 o PDF sono rimandati.
- La vista classica è disegnata con il design system dell'app (DESIGN.md), nel rispetto della licenza: dello SRD si usano solo nomi di regole e campi.
