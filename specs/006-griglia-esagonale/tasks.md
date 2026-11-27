# Tasks: Griglia esagonale (006)

## Foundational
- [X] T001 Geometria in `app/src/lib/grid.ts` (`cellCenter`, `snapToCell`, `gridDims`, `clampToMap` con `oddCols`) e test in `grid.test.ts`
- [X] T002 `supabase/migrations/0013_griglia.sql`: colonna `maps.grid`; applicarla (`--dry-run`, poi `--yes`)

## US1 - Scegliere la griglia (P1)
- [X] T003 [US1] `useTable.ts` legge `grid`; `DmPanel.tsx` la fa scegliere (disabilitata con la mappa a celle); `MapCanvas.tsx` disegna gli esagoni

## US2 - Muovere i token (P1)
- [X] T004 [US2] Centro e aggancio in `MapCanvas.tsx`, limiti in `TokenList.tsx` e `Table.tsx`, rientro dei token al cambio

## US3 - Misurare (P2)
- [X] T005 [US3] `ruler.ts` e `ruler.test.ts`: passi tra esagoni e testo; collegare a `MapCanvas.tsx`

## Polish
- [X] T006 `npm test`, `npm run build`, README, DESIGN, nota Decisioni nel vault
- [ ] T007 Scenari di `quickstart.md`
