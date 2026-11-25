# Quickstart: verificare la chat del tavolo

## Prerequisiti

- Migrazione `supabase/migrations/0009_chat.sql` applicata (`supabase db push --remote`, **solo con il via di Christian**).
- `app/.env.local` con le variabili `VITE_` complete (vedi la knowledge base `env-local-sovrascritto.md`).
- `npm run dev` da `app/`.
- Tre utenti nella stessa campagna: **DM**, **Player A**, **Player B**, ognuno in un browser o in una finestra anonima.
  Un quarto utente **Estraneo**, non membro.

## Scenari

| # | Passi | Risultato atteso | Copre |
|---|---|---|---|
| 1 | A scrive «ciao» e preme Invio | DM e B lo vedono entro 1 s con nome «A» e ora | US1, FR-001, FR-002, SC-001 |
| 2 | Il DM ricarica la pagina | ritrova «ciao» in fondo all'elenco | FR-003 |
| 3 | A prova a inviare un testo vuoto o di soli spazi | il pulsante resta disattivato, Invio non manda nulla | FR-005 |
| 4 | A incolla 520 caratteri | contatore «20 caratteri di troppo», invio bloccato; il testo resta nel campo | FR-005, edge case |
| 5 | Estraneo, dalla console: `supabase.from('messages').select('*').eq('campaign_id', '<id>')` e un `insert` | select: 0 righe; insert: errore | FR-004, SC-002 |
| 6 | A scrive «attacco!» poi tira un d20 con CD | nella chat il messaggio e sotto il tiro, riconoscibile come tiro, con dado, modificatore e totale | US2, FR-006 |
| 7 | Il DM sussurra ad A «c'è una trappola» | A lo vede segnato come privato; B non lo vede, nemmeno ricaricando | US3, FR-007, FR-008 |
| 8 | B, dalla console: select dei messaggi della campagna | il sussurro del punto 7 non c'è | FR-008, SC-002 |
| 9 | B apre il selettore del destinatario | trova solo «Tutti» e il DM | FR-007 |
| 10 | B, dalla console: insert con `recipient_id` = A | errore RLS | FR-007 |
| 11 | A scrive `<b>ciao</b> https://esempio.it/…` lunghissimo | si vede il testo letterale, a capo dentro la colonna, senza grassetto | FR-010 |
| 12 | A elimina un proprio messaggio; il DM elimina un messaggio di B | spariscono per tutti senza ricaricare | FR-009 |
| 13 | A prova a eliminare un messaggio di B dalla console | 0 righe eliminate | FR-009 |
| 14 | Il DM rimuove B dalla campagna | B perde l'accesso; i messaggi di B restano per gli altri con il suo nome | edge case |
| 15 | A stacca la rete, scrive, la riattacca | il testo non inviato resta nel campo; arrivano i messaggi mandati dagli altri nel frattempo | edge case |
| 16 | Solo tastiera: Tab fino al campo, scrivere, Invio; Maiusc+Invio va a capo; Tab al destinatario, frecce per sceglierlo | tutto funziona, focus visibile | FR-011 |
| 17 | Campagna con 500 messaggi (script dalla console), aprire il tavolo | apertura senza ritardi percepibili; si vedono gli ultimi 100 | SC-004 |
| 18 | `npm run build` da `app/` con le variabili `VITE_` presenti | JS gzip totale <500 KB (misurato: 203,8 KB gzip il 2026-11-25, +1,8 KB rispetto alla 002) | SC-005 |
