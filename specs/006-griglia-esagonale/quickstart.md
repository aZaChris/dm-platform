# Quickstart: verificare la griglia esagonale

Prerequisiti: `0013_griglia.sql` applicata, `npm test` verde, un DM e un Player in sessioni separate, mappa a immagine.

| # | Passi | Risultato atteso | Copre |
|---|---|---|---|
| 1 | Campagna con mappa mai toccata | griglia quadrata | FR-001 |
| 2 | Il DM sceglie «Esagonale» | il Player vede gli esagoni senza ricaricare | US1, FR-003 |
| 3 | Il DM torna a «Quadrata» | tutti vedono i quadrati | US1 |
| 4 | Il Player cerca la scelta; poi `update` di `maps.grid` dalla console | non c'è; zero righe modificate | FR-002 |
| 5 | Il Player rilascia un token tra due esagoni | si aggancia al più vicino, uguale per il DM | FR-004 |
| 6 | Token nelle ultime righe in esagonale, poi il DM torna a quadrata | resta dentro la mappa, stessa colonna | FR-005 |
| 7 | Token scelto, frecce nelle quattro direzioni e sul bordo | un esagono confinante alla volta; sul bordo fermo | FR-006 |
| 8 | Righello tra esagoni confinanti e lontani, nelle sei direzioni | «1 esagono · 5 ft · 1,5 m», poi il numero di passi | FR-007 |
| 9 | Mappa a celle attiva | scelta disabilitata con il motivo; griglia quadrata | FR-008 |
| 10 | Combattimento in corso e tiro di dadi in esagonale | anello del turno e tiri come prima | FR-009 |
| 11 | Il DM carica un'altra immagine | resta esagonale | data model |
| 12 | `npm run build` | sotto 500 KB gzip | SC-005 |
