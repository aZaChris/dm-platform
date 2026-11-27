# Implementation Plan: Griglia esagonale

**Branch**: `006-griglia-esagonale` | **Date**: 2026-11-26 | **Spec**: [spec.md](spec.md)

## Summary

Una colonna `grid` (`square`|`hex`) sulla riga di `maps`; il DM la cambia dalla scheda «DM» e arriva a tutti con
l'abbonamento Realtime già esistente. La geometria sta in `app/src/lib/grid.ts` (centro, aggancio, limiti) e la
distanza in `ruler.ts`; `MapCanvas` disegna gli esagoni. Dettagli in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7, React 18, Vite 8

**Primary Dependencies**: nessuna nuova

**Storage**: migrazione `0013_griglia.sql`, una colonna su `maps`

**Testing**: Vitest per la geometria (`grid.test.ts`) e la distanza (`ruler.test.ts`); il resto con
[quickstart.md](quickstart.md)

**Target Platform**: browser moderni, desktop, tablet e telefono

**Project Type**: web-app (solo frontend + Supabase gestito)

**Constraints**: JS al primo caricamento <500 KB gzip (oggi 222,1 KB)

**Scale/Scope**: ~6 membri, una mappa per campagna

## Constitution Check

| Principio | Esito | Nota |
|---|---|---|
| I. Peso minimo | ✅ | Nessuna dipendenza: la geometria sono poche funzioni. |
| II. Nessun backend proprio | ✅ | Una colonna Postgres. |
| III. Niente codice già fornito | ✅ | Permessi con le policy esistenti di `maps`, tempo reale già attivo. |
| IV. YAGNI | ✅ | Un solo orientamento, dimensione fissa, niente esagoni nell'editor. |
| V. Ambito | ✅ | Mappa con griglia e token. |

Rivalutato dopo la Phase 1: invariato.

## Project Structure

```text
supabase/migrations/0013_griglia.sql
app/src/
├── lib/grid.ts, grid.test.ts      # cellCenter, snapToCell, gridDims, clampToMap per i due tipi
├── lib/ruler.ts, ruler.test.ts    # distanza in esagoni
├── hooks/useTable.ts              # legge maps.grid
├── components/MapCanvas.tsx       # disegno, aggancio, righello
├── components/DmPanel.tsx         # scelta della griglia
└── pages/Table.tsx                # collega tutto, riporta dentro i token al cambio
```
