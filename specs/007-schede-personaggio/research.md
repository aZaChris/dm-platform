# Research: Schede personaggio (007)

Le scelte di fondo della feature, ognuna con il perché e cosa è stato scartato.

## 1. Una riga per scheda, con il contenuto in un campo JSON

**Decisione**: tabella `characters` con poche colonne vere (campagna, proprietario, token, nome, data di modifica) e
tutto il resto della scheda in una colonna `data jsonb`, con la forma descritta in [data-model.md](data-model.md).

**Perché**: una scheda 5e ha più di cento campi e diverse liste (attacchi, incantesimi, equipaggiamento,
privilegi). Con una riga sola si legge con una query, si ascolta con un abbonamento Realtime e si importa da Roll20
con un insert. Le colonne vere servono solo a ciò che il database deve controllare: permessi (proprietario,
campagna), collegamento al token e l'elenco delle schede (nome).

**Scartato**:
- Tabelle separate per attacchi, incantesimi, oggetti: cinque tabelle, cinque policy RLS e cinque canali Realtime
  per dati che si leggono e si mostrano sempre insieme.
- Una colonna per campo: oltre cento colonne e una migrazione per ogni campo aggiunto.

## 2. Modifiche per campo, non dell'intera scheda

**Decisione**: ogni modifica passa da una funzione `patch_character(p_id, p_path text[], p_value jsonb)` che scrive
solo quel campo con `jsonb_set`, in modo atomico. Gira `security invoker`, quindi i permessi restano quelli della
RLS di update.

**Perché**: la spec (FR-008) chiede che il giocatore e il DM possano modificare la stessa scheda nello stesso
momento senza perdere i campi diversi. Se il client riscrivesse l'intero JSON, l'ultimo salvataggio cancellerebbe
le modifiche dell'altro. È lo stesso schema di `paint_cells` nella feature 002.

**Scartato**: `update` dell'intera colonna `data` dal client (perde le modifiche concorrenti); un sistema di
versioni con conflitti da risolvere (troppo per ~6 persone).

## 3. Valori calcolati nel client, non salvati

**Decisione**: modificatori, bonus di competenza, tiri salvezza, abilità, percezione passiva, CD e bonus d'attacco
degli incantesimi sono funzioni pure in `app/src/lib/character.ts`, con test. Nella scheda si salvano solo i dati
di base (punteggi, livelli, competenze, bonus manuali).

**Perché**: un valore salvato e uno calcolato possono divergere (cambi Forza e il tiro salvezza resta vecchio). Così
la scheda è sempre coerente, e la regola sta in un posto solo, testato come chiede la costituzione per la logica
non banale.

**Scartato**: colonne generate o trigger in SQL (stessa regola scritta due volte, più difficile da testare);
salvare i valori calcolati di Roll20 così come arrivano.

## 4. Tiri dalla scheda con una funzione che riusa `roll_d20`

**Decisione**: `roll_character(p_character uuid, p_label text, p_modifier int)` controlla che chi tira sia il
proprietario della scheda o il DM, poi chiama `roll_d20` con l'etichetta `"<nome> · <prova>"` (massimo 60
caratteri). Il modificatore lo calcola il client.

**Perché**: il numero resta del database (non truccabile) e il tiro compare in overlay e chat come gli altri. Il
controllo nel database rispetta FR-009: nessuno tira a nome del personaggio di un altro, nemmeno dalla console.
Calcolare il modificatore nel client va bene: chi tira è già chi può modificare la scheda.

**Scartato**: chiamare `roll_d20` direttamente con l'etichetta (chiunque potrebbe tirare «a nome» di qualsiasi
personaggio); calcolare il modificatore in SQL (duplica la logica del punto 3).

## 5. Proprietario e token li cambia solo il DM

**Decisione**: un trigger `before update` rifiuta le modifiche a `owner_id`, `token_id` e `campaign_id` se chi
aggiorna non è il DM. Le policy RLS decidono chi può aggiornare la riga; il trigger decide quali colonne.

**Perché**: una policy RLS non vede il valore vecchio di una colonna, quindi da sola non impedisce a un giocatore di
«regalarsi» un token o la scheda di un altro.

**Scartato**: privilegi di colonna (`grant update (data, name)`): funzionerebbero per il giocatore ma
bloccherebbero anche il DM, che usa lo stesso ruolo `authenticated`.

## 6. Import da Roll20 interamente nel browser

**Decisione**: il file JSON di VTT Enhancement Suite si legge nel browser; `app/src/lib/roll20.ts` (funzione pura,
con test su un file d'esempio) lo trasforma nella forma della scheda; poi un normale `insert` per ogni personaggio
confermato. Si possono scegliere più file insieme (VTT Enhancement Suite esporta un personaggio per file) o un
file con un array di personaggi.

**Perché**: nessun server (principio II), nessun file caricato nello Storage, e il convertitore si testa senza
database. Gli attributi non riconosciuti finiscono in `data.notes_import` con nome e valore (FR-011, SC-003).

**Formato atteso** (da verificare sul primo JSON reale del gruppo, vedi
[contracts/roll20-import.md](contracts/roll20-import.md)): un oggetto con `name`, `bio`, `attribs` (elenco di
`{ name, current, max }`) e `abilities`. I campi ripetuti di Roll20 (`repeating_attack_<id>_atkname`…) si
raggruppano per `<id>`.

**Scartato**: leggere Roll20 direttamente (nessuna API pubblica; reverse engineering contro i termini di servizio);
un'Edge Function per il parsing (un servizio in più per lavoro che il browser fa da solo).

## 7. Interruttore della vista salvato nei metadati dell'utente

**Decisione**: la vista scelta (`pratica` o `classica`) si salva in `user_metadata.vista_scheda` con
`supabase.auth.updateUser`.

**Perché**: la spec chiede che la scelta resti per l'utente (FR-004), anche cambiando dispositivo; i metadati di
Supabase Auth ci sono già, senza tabelle nuove.

**Scartato**: `localStorage` (vale per un solo browser); una tabella di preferenze (YAGNI per un solo valore).

## 8. Dove si apre la scheda

**Decisione**: due punti.
- Una pagina **Schede** (`#/schede/<campagna>`, voce nuova nella barra laterale): elenco delle schede a sinistra,
  scheda aperta a destra con l'interruttore delle viste, pulsanti «Nuova scheda» e «Importa da Roll20».
- Una scheda **Scheda** nel pannello del tavolo: la vista pratica del personaggio scelto (il token selezionato,
  altrimenti il proprio). Si gioca senza lasciare la mappa.

**Perché**: al tavolo serve la vista pratica a portata di mano; la vista classica, larga, sta meglio in una pagina
intera.

**Scartato**: una finestra sopra la mappa (copre i token durante il gioco); solo la pagina separata (bisogna
lasciare la mappa per ogni tiro).

## 9. La scheda classica è nostra

**Decisione**: la vista classica riprende l'ordine dei blocchi della scheda su carta (caratteristiche e abilità a
sinistra, combattimento al centro, tratti a destra, poi attacchi, equipaggiamento, privilegi, incantesimi) con
griglia CSS e i token di DESIGN.md. Nessuna immagine, cornice o font della scheda ufficiale.

**Perché**: la grafica della scheda di Wizards of the Coast non è sotto licenza libera; lo SRD 5.1 (CC-BY-4.0)
copre regole e nomi dei campi, che è quanto serve. Il sito è pubblico.

## 10. Danni come formula, niente nuovo dado

**Decisione**: l'attacco tira per colpire con `roll_character`; il danno si mostra come testo (`1d8+4 taglienti`).

**Perché**: `roll_d20` tira solo il d20. Un tiro generico di dadi (`XdY+Z`) è una feature a sé, con la sua
spec e la sua tabella; qui si rimanda, come scritto nelle Assunzioni della spec.
