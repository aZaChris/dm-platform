# Research: Misurazione delle distanze (005)

## 1. La misura viaggia in Broadcast, non nel database

**Decisione**: la misura in corso si manda agli altri con Supabase Realtime **Broadcast** sul canale
`ruler:<campaign_id>`: messaggi `{ user_id, name, from: [col, row], to: [col, row] }` e un messaggio `end` al
rilascio. Niente tabella.

**Perché**: la spec vieta di salvare le misure (FR-006) e le vuole in tempo reale (FR-005). Broadcast passa da client a
client senza scrivere nel database: niente righe da cancellare, niente storico, nessun carico su Postgres.

**Scartato**: una tabella `rulers` con Postgres Changes (scritture e cancellazioni continue per un dato che vive pochi
secondi); Presence (pensata per «chi c'è», manda lo stato intero a ogni cambio).

## 2. Canale privato con RLS su `realtime.messages`

**Decisione**: il canale è **privato** (`config: { private: true }`). Una migrazione aggiunge due policy su
`realtime.messages`: leggere e mandare messaggi `broadcast` sul topic `ruler:<id>` solo se `is_member(<id>)`.

**Perché**: la costituzione vuole RLS su tutti i dati condivisi. Un canale pubblico si ascolta conoscendo solo
l'id della campagna; con la Realtime Authorization di Supabase decide la stessa funzione `is_member` delle tabelle.

**Scartato**: canale pubblico (chiunque abbia l'id ascolta e disegna righelli); controllo nel client (si aggira).

## 3. Si manda solo quando cambia la cella

**Decisione**: durante il trascinamento il client manda un messaggio solo quando la cella d'arrivo cambia, non a ogni
movimento del puntatore.

**Perché**: una misura attraversa al massimo qualche decina di celle; così i messaggi sono pochi anche su una mappa
40×30, e non serve un limitatore di frequenza.

## 4. Misura sparita se chi misura si disconnette

**Decisione**: ogni client cancella da solo la misura di un altro se non riceve aggiornamenti per 3 secondi; chi
misura, mentre tiene premuto senza muoversi, rimanda la stessa misura ogni secondo.

**Perché**: se il browser si chiude a metà, il messaggio `end` non parte (edge case della spec 2). Un tempo massimo
locale basta, senza Presence.

## 5. La regola della distanza è una funzione pura, con test

**Decisione**: `app/src/lib/ruler.ts` con `distance(from, to)` → `{ cells, ft, m }`:
celle = max(|Δcol|, |Δriga|) (FR-003), piedi = celle × 5, metri = celle × 1,5.

**Perché**: è la regola che la 006 cambierà per gli esagoni; in un file solo, con un test, la si sostituisce senza
toccare la mappa. La costituzione chiede test per la logica non banale.

## 6. Anche i metri

**Decisione**: l'etichetta mostra celle, piedi e metri: «6 celle · 30 ft · 9 m».

**Perché**: il gruppo gioca con la traduzione italiana, dove le velocità sono in metri (1,5 m per quadretto); la spec
chiedeva celle e piedi. Aggiunta alla spec in FR-002.

## 7. Il righello è uno strumento della mappa

**Decisione**: un pulsante «Righello» nella barra della mappa (scorciatoia R), come la griglia. Con il righello attivo
`MapCanvas` non trascina i token né dipinge celle (FR-004) e disegna la linea con Konva. Da tastiera: con un token
selezionato in «Scena» e il righello attivo, le frecce spostano la fine della misura a partire dal token; Esc la chiude.

**Perché**: niente modalità nuove fuori dalla mappa; la tastiera riusa la selezione del token che c'è già (FR-007).

**Scartato**: misura sempre attiva con un tasto modificatore (Shift + trascinamento): scomoda al tocco.
