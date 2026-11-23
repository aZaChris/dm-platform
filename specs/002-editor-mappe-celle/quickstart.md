# Quickstart: validare l'editor di mappe a celle

## Prerequisiti

Quelli della [001](../001-tavolo-base/quickstart.md), più la migrazione `0007_mappa_celle.sql` applicata
(`npx supabase db push --remote`). Due browser: A (DM, finestra normale), B (Player, finestra anonima), nella stessa campagna.

## Controlli automatici

`cd app && npm test` — copre `floodFill`, `lineCells` e `invertPatch`.

## Scenari

| # | Passi | Esito atteso | Copre |
|---|---|---|---|
| 1 | A crea una mappa a celle 20×15 | Griglia vuota; B la vede comparire senza ricaricare | US1, US2, FR-001 |
| 2 | A sceglie «muro» e trascina il pennello su una riga | Tutte le celle attraversate sono muro, senza buchi anche muovendo veloce | FR-003 |
| 3 | A chiude una stanza con i muri, sceglie «pavimento» e usa il riempimento dentro | Si riempie solo l'interno; fuori dai muri nulla cambia | FR-003, US1 |
| 4 | A usa la gomma sul pavimento | Le celle tornano vuote | FR-003 |
| 5 | B guarda la mappa mentre A disegna | Ogni tratto compare a B entro 1 secondo dal rilascio | SC-002, FR-007 |
| 6 | B ricarica la pagina; poi C si unisce in ritardo | Entrambi vedono la mappa com'è, con griglia e token | FR-007, US2 |
| 7 | Dalla console di B: `supabase.from('cell_maps').update({ cells: '...' })` oppure `rpc('paint_cells', ...)` | 0 righe modificate o errore; la mappa non cambia | FR-008, SC-003 |
| 8 | A disegna tre tratti, poi annulla due volte e ripete una | La mappa segue; B vede gli stessi stati | FR-009, SC-007 |
| 9 | A ingrandisce la mappa a 30×20 | Il disegno resta dov'è, le nuove celle sono vuote | FR-010 |
| 10 | Con un token a colonna 25, A rimpicciolisce a 20×15 | Il token è riportato dentro il bordo e A riceve un avviso con il numero | FR-010 |
| 11 | A svuota la mappa | Prima chiede conferma; poi tutte le celle sono vuote | FR-011 |
| 12 | A carica un'immagine e disattiva la mappa a celle | B vede l'immagine; la mappa a celle resta salvata | FR-012, US4 |
| 13 | A riattiva la mappa a celle | B rivede le celle; i token sono dentro il bordo | FR-012, FR-010 |
| 14 | A elimina la mappa a celle (con conferma) | Sparisce per tutti; torna l'immagine | US4 |
| 15 | A muove un token con le frecce e B tira un d20 sulla mappa a celle | Token e dadi funzionano come con l'immagine | FR-013 |
| 16 | A usa solo la tastiera: `B`, `3`, `Ctrl+Z` | Strumento e tipo cambiano, l'annulla funziona | FR-014 |
| 17 | Su tablet, A dipinge con il dito | Il tratto segue il dito, senza scorrere la pagina | FR-014 |
| 18 | `npm run build` | JS gzip totale <500 KB (misurato: 202 KB gzip il 2026-11-23) | SC-006 |

Per lo scenario 7 serve provare anche la chiamata diretta dalla console di B: se la RLS è corretta torna 0 righe
modificate o un errore. Se `supabase` non è accessibile dalla console, vale la verifica con la funzione SQL
direttamente nel progetto (modificando `request.jwt.claims` in una transazione chiusa con rollback).
