# Quickstart: verificare le scene

Prerequisiti: `0014_scene.sql` applicata, un DM e un Player in sessioni separate.

| # | Passi | Risultato atteso | Copre |
|---|---|---|---|
| 1 | Apri una campagna di prima | «Scena 1» con mappa, griglia e token di prima | FR-001 |
| 2 | Il DM aggiunge «Cripta», carica una mappa e un mostro | il Player non vede cambiamenti | US1, FR-003 |
| 3 | Il Player, da console, legge `scenes` e `tokens` | solo la scena in gioco | FR-003, FR-004 |
| 4 | Il DM preme «Metti in gioco» | il Player vede Cripta col mostro e il proprio token, senza ricaricare | US2, FR-005 |
| 5 | Il Player apre la scheda dal token | è ancora collegata | FR-005 |
| 6 | Con un combattimento aperto, cambio di scena | rifiutato con il messaggio | FR-006 |
| 7 | Dipingi celle, annulla, cambia dimensione, svuota, elimina la mappa a celle | come prima, solo su quella scena | FR-002 |
| 8 | Righello su una scena che si sta preparando | il Player non lo vede | plan |
| 9 | «Porta qui» un token dalla scena in gioco a un'altra | sparisce al Player | US3 |
| 10 | Elimina una scena non in gioco | sparisce con i suoi token | FR-007 |
| 11 | Campagna nuova | ha «Scena 1» | FR-001 |
