# Quickstart: verificare le schede personaggio

## Prerequisiti

- Migrazione `supabase/migrations/0011_schede.sql` applicata (`npx supabase db push --remote --yes`).
- `npm test` da `app/` verde: calcoli della scheda (`character.test.ts`) e convertitore Roll20 (`roll20.test.ts`).
- Due utenti nella stessa campagna, in sessioni separate: **DM** e **Player A**.
- Sulla mappa il token «Aria», assegnato ad A.
- Almeno un JSON esportato da Roll20 con VTT Enhancement Suite in `import/roll20/` (cartella esclusa da git).

## Scenari

| # | Passi | Risultato atteso | Copre |
|---|---|---|---|
| 1 | A crea una scheda «Aria»: Ladra 3, Destrezza 16, competenza in Furtività | nella vista pratica Furtività vale +5, iniziativa +3 | US1, FR-003 |
| 2 | A clicca Furtività | overlay del d20 per entrambi; in chat «Aria · Furtività» con +5 | US1, FR-006 |
| 3 | A imposta PF 24/31, poi applica 7 danni | 17/31 per entrambi, senza ricaricare | US1, FR-007, FR-008, SC-004 |
| 4 | A dà 5 PF temporanei, poi 8 danni | temporanei a 0, PF 14/31 | FR-007 |
| 5 | Cure oltre il massimo; danni oltre i PF | si ferma a 31; a 0 compaiono i tiri contro la morte | edge case |
| 6 | A segna uno slot di 1° livello su 3 e ricarica la pagina | 2 liberi su 3 | US1, FR-007 |
| 7 | A usa l'interruttore, poi apre la scheda da un altro browser | vista classica in entrambi | US2, FR-004 |
| 8 | Nella vista classica A porta Destrezza a 18 | Furtività +6, iniziativa +4, anche nella vista pratica | US2, FR-003 |
| 9 | A porta Ladra al 5° livello | competenza +3; Furtività +7 | US2, SC-005 |
| 10 | A scrive Forza 31 o livello 21 | il campo rifiuta e spiega il limite | edge case |
| 11 | A e il DM modificano insieme campi diversi (A i PF, il DM le note) | entrambe le modifiche restano | FR-008 |
| 12 | Il DM apre la scheda di A e la modifica | può farlo | FR-009 |
| 13 | A apre una scheda del DM | la legge, non può modificarla né tirare | US4, FR-009 |
| 14 | A dalla console: `rpc('patch_character', …)` e `rpc('roll_character', …)` su una scheda del DM; `update({ token_id })` sulla propria | `not_allowed`, nessun tiro in chat; il trigger rifiuta il token | FR-009 |
| 15 | A importa il proprio JSON Roll20 | riepilogo (nome, classe, livello), poi la scheda con caratteristiche, PF, CA, competenze, attacchi, incantesimi e slot uguali a Roll20 | US3, FR-010, FR-011, SC-002 |
| 16 | Aprire «Note importate» della scheda appena importata | gli attributi non riconosciuti con nome e valore | FR-011, SC-003 |
| 17 | Il DM carica tre file insieme e assegna ognuno a un membro | tre schede con il proprietario scelto | US3, FR-012 |
| 18 | Caricare un file non Roll20 (es. un JSON qualsiasi o un'immagine rinominata) | messaggio d'errore, nessuna scheda creata | FR-013 |
| 19 | Importare un personaggio con lo stesso nome di una scheda esistente | l'app chiede: nuova scheda o sostituire | edge case |
| 20 | Il DM collega la scheda di Aria al suo token; A apre il token dalla mappa | si apre la scheda di Aria | US4, FR-014 |
| 21 | Il DM elimina il token di Aria | la scheda resta, senza token | FR-014 |
| 22 | A elimina la propria scheda | chiede conferma, poi sparisce per tutti | FR-015 |
| 23 | Vista pratica e classica a 390 px e da tastiera (Tab, Invio sui tiri) | una colonna, nessuno scorrimento laterale; ogni campo e tiro ha un nome | FR-016 |
| 24 | `npm run build` | JS iniziale sotto 500 KB gzip | SC-006 |
