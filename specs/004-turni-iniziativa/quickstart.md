# Quickstart: verificare turni e iniziativa

## Prerequisiti

- Migrazione `supabase/migrations/0010_iniziativa.sql` applicata (`npx supabase db push --remote --yes`).
- `npm test` da `app/` verde (ordinamento e turni).
- Due utenti nella stessa campagna, in sessioni separate (vedi la 003): **DM** e **Player A**.
- Sulla mappa almeno quattro token: «Goblin 1», «Goblin 2», «Orco» (del DM) e «Aria» (assegnato ad A).

## Scenari

| # | Passi | Risultato atteso | Copre |
|---|---|---|---|
| 1 | Il DM avvia un combattimento con Goblin 1, Orco e Aria | A vede subito l'elenco dei tre, senza iniziative | US1, FR-001, FR-007 |
| 2 | Il DM tira l'iniziativa di Goblin 1 con modificatore +2 | il valore compare per entrambi; nella chat c'è il tiro «Iniziativa · Goblin 1» | FR-002, FR-010 |
| 3 | Il DM scrive 15 a mano per Orco | compare 15 per entrambi | FR-002 |
| 4 | A tira per Aria; poi prova a scrivere un valore per Orco (dal pannello non può; dalla console `update` su Orco) | Aria ha il suo valore; per Orco 0 righe aggiornate | FR-003, SC-003 |
| 5 | A dalla console: `rpc('roll_initiative', { p_token: <Orco>, p_modifier: 5 })` | errore `not_allowed`, e nessun tiro nuovo nella chat | FR-003 |
| 6 | Valori 18, 15, 12 | ordine 18, 15, 12 per tutti | FR-004, SC-004 |
| 7 | Due partecipanti a 14, modificatori +3 e +1 | prima quello con +3 | FR-004 |
| 8 | Due a 14 con lo stesso modificatore; il DM preme «Sposta su» sul secondo | si scambiano per tutti | FR-004 |
| 9 | Un partecipante senza iniziativa; il DM prova «Inizia» | pulsante disattivato, indicato chi manca | edge case |
| 10 | Il DM preme «Inizia» | turno al primo, round 1; il suo token ha l'anello menta sulla mappa per entrambi | US2, FR-006 |
| 11 | Il DM preme «Turno successivo» fino a tornare al primo | il turno passa a ognuno; al ritorno al primo il round è 2 | US2, SC-002 |
| 12 | Il DM preme «Turno precedente» al primo del round 2 | turno all'ultimo, round 1 | US2 |
| 13 | A cerca i comandi del turno; dalla console `update` di `encounters` | non li vede; 0 righe aggiornate | FR-005, SC-003 |
| 14 | A metà round il DM aggiunge Goblin 2 con iniziativa 12 | entra al posto giusto, il turno non cambia | US3, FR-008 |
| 15 | Il DM toglie il partecipante di turno | il turno passa al successivo | US3, FR-008 |
| 16 | Il DM elimina dalla mappa il token di turno | esce dall'elenco e il turno passa al successivo | edge case |
| 17 | Un solo partecipante, «Turno successivo» due volte | il round sale di uno ogni volta | edge case |
| 18 | A ricarica la pagina a combattimento in corso | vede elenco, turno e round attuali | FR-007 |
| 19 | Il DM chiude e riapre la pagina | il combattimento è com'era | edge case |
| 20 | Il DM preme «Termina» e conferma | elenco e anello spariscono per entrambi | US3, FR-009 |
| 21 | Solo tastiera: avviare, scrivere un'iniziativa, iniziare, turno avanti e indietro, terminare | tutto funziona, focus visibile | FR-011 |
| 22 | `npm run build` da `app/` con le variabili `VITE_` presenti | JS gzip totale <500 KB (misurato: 206,1 KB gzip il 2026-11-25, +2,3 KB rispetto alla 003) | SC-005 |
