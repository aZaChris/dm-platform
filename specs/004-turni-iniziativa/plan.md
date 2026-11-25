# Implementation Plan: Turni e iniziativa

**Branch**: `004-turni-iniziativa` (cartella della spec; il lavoro resta su `refactor/react-supabase`) | **Date**: 2026-11-25 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/004-turni-iniziativa/spec.md`

## Summary

Il DM avvia un combattimento scegliendo dei token; ognuno riceve un'iniziativa tirata dal database o scritta a
mano; l'elenco si ordina da solo e il DM fa avanzare turni e round. Due tabelle nuove: `encounters` (al massimo
una riga per campagna: round, token di turno, partito o no) e `encounter_participants` (un token, la sua
iniziativa, il modificatore e uno spareggio). Il tiro d'iniziativa è una RPC `roll_initiative` che **riusa
`roll_d20`**, così il risultato non è truccabile e compare nella chat come ogni altro tiro. L'ordine e il
calcolo del turno successivo/precedente sono **funzioni pure nel client**, con un piccolo test. Il token di turno
è evidenziato sulla mappa. Nessuna dipendenza nuova. Dettagli in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5, React 18, Node per il build come nelle feature precedenti

**Primary Dependencies**: nessuna nuova. `@supabase/supabase-js` per tabelle, RPC e Realtime; `react-konva` (già
presente) per l'anello del token di turno.

**Storage**: Supabase Postgres, tabelle `encounters` e `encounter_participants` con RLS, una funzione
`roll_initiative`. Nessuno Storage.

**Testing**: Vitest per la logica non banale, come chiede la costituzione: ordinamento con spareggi, turno
successivo, turno precedente, turno dopo la rimozione di chi era di turno (`app/src/lib/initiative.test.ts`).
Permessi e tempo reale con [quickstart.md](quickstart.md) e due utenti reali.

**Target Platform**: browser moderni, desktop e tablet; deploy statico su Vercel

**Project Type**: web-app (solo frontend + Supabase gestito)

**Performance Goals**: passaggio di turno visibile a tutti in <1 s (p95); preparazione di 6 partecipanti in <1 min

**Constraints**: JS al primo caricamento <500 KB gzip (oggi 203,8 KB); nessun backend proprio; nessuna tabella senza RLS

**Scale/Scope**: ~6 membri, un combattimento per campagna, qualche decina di partecipanti al massimo

## Constitution Check

*GATE: passa prima della Phase 0; rivalutato dopo la Phase 1.*

| Principio | Esito | Nota |
|---|---|---|
| I. Peso minimo | ✅ | Zero dipendenze nuove. Stima +3-4 KB gzip (componente, hook, logica): da **misurare**. |
| II. Nessun backend proprio | ✅ | Solo Supabase e Vercel statico; la RPC vive nel database. |
| III. Niente codice già fornito | ✅ | Permessi con RLS (DM per tutto, Player solo per l'iniziativa dei propri token), sincronizzazione con Realtime nativo. Il tiro riusa `roll_d20` invece di un secondo generatore. |
| IV. YAGNI | ✅ | Niente storico dei combattimenti, partecipanti nascosti, condizioni o punti ferita. Il calcolo del turno sta nel client del DM, non in trigger SQL. I limiti noti hanno un `ponytail:`. |
| V. Ambito e riferimento v1 | ✅ | «Gestione turni e iniziativa» è una funzione core della costituzione. |

**Rivalutazione dopo Phase 1**: invariata. Da giustificare la RPC e il turno spostato dal client, in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-turni-iniziativa/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/db-api.md
├── checklists/requirements.md
└── tasks.md             # prodotto da /speckit-tasks
```

### Source Code (repository root)

```text
supabase/migrations/
└── 0010_iniziativa.sql      # encounters, encounter_participants, RLS, roll_initiative, Realtime

app/src/
├── lib/
│   ├── initiative.ts        # sortParticipants, nextTurn, prevTurn, turnAfterRemoval
│   └── initiative.test.ts
├── hooks/
│   └── useEncounter.ts      # carica e ascolta il combattimento; azioni del DM e dei Player
├── components/
│   ├── Initiative.tsx       # avvio, iniziative, elenco ordinato, comandi del turno
│   └── MapCanvas.tsx        # + anello sul token di turno (prop turnTokenId)
└── pages/
    └── Table.tsx            # card «Iniziativa» e turnTokenId passato al canvas
```

**Structure Decision**: web-app esistente `app/` + `supabase/`; come per chat e mappa a celle, il combattimento ha
**un hook e un canale suoi** (`combat:<campagna>`) e non allarga `useTable.ts`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| RPC `roll_initiative` (`security invoker`) | Tira con `roll_d20` e scrive il risultato sul partecipante nella stessa transazione: se la RLS rifiuta la scrittura (token non tuo), sparisce anche il tiro | Il client chiama `roll_d20` e poi scrive il totale: il Player potrebbe scrivere un numero diverso da quello tirato, e un rifiuto lascerebbe un tiro orfano nella chat |
| Il turno, quando si toglie chi è di turno, lo sposta il client del DM | Serve l'ordine com'era prima della rimozione, che il client ha già; solo il DM può togliere partecipanti o token, quindi è sempre connesso in quel momento | Un trigger SQL dovrebbe ripetere in SQL la regola di ordinamento (due copie della stessa logica, una sola testata) |
