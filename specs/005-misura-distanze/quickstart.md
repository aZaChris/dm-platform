# Quickstart: verificare il righello

## Prerequisiti

- Migrazione `supabase/migrations/0012_righello.sql` applicata (`npx supabase db push --remote --yes`).
- `npm test` da `app/` verde (`ruler.test.ts`).
- Due utenti nella stessa campagna, in sessioni separate: **DM** e **Player A**; una mappa a celle o a immagine.

## Scenari

| # | Passi | Risultato atteso | Copre |
|---|---|---|---|
| 1 | A attiva «Righello» e trascina da una cella a quella 4 celle più a destra | linea tra i centri, «4 celle · 20 ft · 6 m» | US1, FR-001, FR-002 |
| 2 | A misura 3 celle in diagonale e 2 in orizzontale | «5 celle · 25 ft · 7,5 m» | FR-003 |
| 3 | A rilascia | linea ed etichetta spariscono | US1 |
| 4 | Con il righello attivo, A trascina partendo da un token suo | il token non si muove | FR-004 |
| 5 | Il DM con il righello attivo e la modifica della mappa accesa trascina sulla mappa a celle | non dipinge celle | FR-004 |
| 6 | A misura; il DM guarda | il DM vede la stessa linea, la distanza e «A» mentre A si muove | US2, FR-005, SC-003 |
| 7 | A rilascia; poi un terzo membro entra al tavolo | la misura sparisce per il DM; il nuovo arrivato non vede misure vecchie | FR-005, FR-006 |
| 8 | A misura e chiude la scheda del browser a metà | la misura sparisce dallo schermo del DM entro 3-4 s | edge case |
| 9 | A e il DM misurano insieme | ognuno vede entrambe le misure, ciascuna con il suo nome | edge case |
| 10 | Partenza e arrivo nella stessa cella | «0 celle · 0 ft · 0 m» | edge case |
| 11 | Trascinamento oltre il bordo | l'arrivo si ferma sull'ultima cella del bordo | edge case |
| 12 | Da tablet, con il dito | misura senza far scorrere la pagina | FR-007 |
| 13 | Solo tastiera: R, token scelto in «Scena», frecce, Esc | la misura parte dal token, segue le frecce, Esc la chiude | FR-007 |
| 14 | Mappa a immagine invece che a celle | stesso comportamento | FR-008 |
| 15 | Un utente non membro, dalla console, si iscrive a `ruler:<campagna>` con `private: true` | non riceve i messaggi né può mandarne | sicurezza |
| 16 | `npm run build` | JS iniziale sotto 500 KB gzip (misurato: 222,1 KB, +1,4 KB per il righello) | SC-004 |
