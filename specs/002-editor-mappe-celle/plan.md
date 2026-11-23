# Implementation Plan: Editor di mappe a celle

**Branch**: `002-editor-mappe-celle` (cartella della spec; il lavoro resta su `refactor/react-supabase`) | **Date**: 2026-11-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-editor-mappe-celle/spec.md`

## Summary

Il DM disegna la mappa del tavolo come griglia di celle (vuoto, pavimento, muro, porta, acqua) con pennello,
riempimento e gomma. La mappa è **una riga di una nuova tabella** `cell_maps`: dimensioni più una stringa con un
carattere per cella. Un tratto di disegno diventa **una sola chiamata** a `paint_cells`, che unisce le celle
modificate a quelle già salvate; Realtime (Postgres Changes) manda la riga aggiornata ai giocatori. Nessuna
dipendenza nuova: il disegno usa `react-konva`, già presente. Annulla e ripeti vivono nel client (solo sessione).
La scelta tra immagine e mappa a celle è un flag `active` sulla stessa riga. Dettagli in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5, React 18, Node 20 per il build (come la 001)

**Primary Dependencies**: nessuna nuova. `react-konva` e `konva` (già presenti) disegnano le celle; `@supabase/supabase-js`
per tabella, RPC e Realtime. Dev: `vitest` (già presente).

**Storage**: Supabase Postgres, nuova tabella `cell_maps` con RLS, 2 funzioni SQL (`paint_cells`, `resize_cell_map`).
Nessun uso di Storage: la mappa a celle non è un'immagine.

**Testing**: Vitest solo per la logica non banale: riempimento (`floodFill`), linea tra due celle (`lineCells`),
inversione di un tratto per l'annulla. RLS e Realtime si verificano con [quickstart.md](quickstart.md) usando due utenti reali.

**Target Platform**: browser moderni, desktop e tablet; deploy statico su Vercel

**Project Type**: web-app (solo frontend + Supabase gestito)

**Performance Goals**: modifica del DM visibile ai giocatori in <1 s (p95); mappa 40×30 con 50 token fluida

**Constraints**: JS al primo caricamento <500 KB gzip (oggi ~197 KB); nessun backend proprio; nessuna tabella senza RLS

**Scale/Scope**: ~6 utenti per campagna, una mappa a celle per campagna, massimo 40×30 = 1200 celle (1,2 KB di dati)

## Constitution Check

*GATE: passa prima della Phase 0; rivalutato dopo la Phase 1.*

| Principio | Esito | Nota |
|---|---|---|
| I. Peso minimo | ✅ | Zero dipendenze nuove. Stima +3-5 KB gzip di codice (editor, riempimento, hook): da **misurare** con `vite build`. Una mappa pesa 1,2 KB nel database. |
| II. Nessun backend proprio | ✅ | Solo Supabase e Vercel statico. Le 2 funzioni SQL vivono in Supabase, non sono un server. |
| III. Niente codice già fornito | ✅ | Permessi con RLS (nessun controllo DM scritto a mano nelle funzioni: girano come l'utente), sincronizzazione con Realtime nativo, nessun WebSocket nostro. |
| IV. YAGNI | ✅ | Una tabella, una stringa, niente tabella di celle, niente storico persistente, niente blocco dei token. Le semplificazioni hanno un `ponytail:` con il limite noto. |
| V. Ambito e riferimento v1 | ✅ | «Mappa con griglia e token» include il contenuto della mappa. La 001 escludeva il *disegno libero a mano*, non un editor a celle: nessun emendamento. Fuori ambito: nebbia di guerra, linea di vista, più mappe. |

**Rivalutazione dopo Phase 1**: invariata. Il solo punto da giustificare è l'uso di funzioni SQL, in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/002-editor-mappe-celle/
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
└── 0007_mappa_celle.sql     # tabella cell_maps, RLS, vincoli, paint_cells, resize_cell_map, Realtime

app/src/
├── lib/
│   ├── cells.ts             # tipi di cella, indice, floodFill, lineCells, invertPatch
│   └── cells.test.ts
├── hooks/
│   └── useCellMap.ts        # carica la riga, si abbona, paint/undo/redo/resize/clear/attiva/elimina
├── components/
│   ├── MapCanvas.tsx        # + disegna le celle (un solo Shape) e gestisce il pennello in modifica
│   └── MapEditor.tsx        # barra: strumenti, tipi di cella, annulla/ripeti, dimensione, svuota, attiva
└── pages/
    └── Table.tsx            # sceglie cosa mostrare (celle o immagine) e passa il tutto al canvas
```

**Structure Decision**: web-app esistente `app/` + `supabase/`; si aggiungono un file di logica pura, un hook, un
componente e una migrazione. `DmPanel.tsx` guadagna solo un link all'editor. `useTable.ts` non cambia: la mappa a
celle ha un hook e un canale suoi (vedi research, punto 8).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Funzioni SQL `paint_cells` e `resize_cell_map` | `paint_cells` unisce i tratti cella per cella in modo atomico (due schede del DM non si sovrascrivono); `resize_cell_map` rimappa la stringa e riporta dentro i token in una sola transazione | Un `update` diretto dal client sovrascriverebbe l'intera stringa: l'ultima scheda cancella le celle dell'altra. Entrambe girano come l'utente (`security invoker`), quindi i permessi restano della RLS. |
