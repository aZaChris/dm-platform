# Data Model: Turni e iniziativa

## Tabella `encounters` (nuova)

| Colonna | Tipo | Vincoli | Note |
|---|---|---|---|
| `campaign_id` | `uuid` | PK, FK `campaigns(id)` on delete cascade | al massimo un combattimento per campagna |
| `started` | `boolean` | not null, default `false` | `false` = preparazione (si stabiliscono le iniziative) |
| `round` | `int` | not null, default `1`, `check (round >= 1)` | |
| `turn_token_id` | `uuid` | null, **nessuna FK** | token di turno; `null` finché non parte (vedi research, punto 2) |
| `updated_at` | `timestamptz` | not null, default `now()` | |

## Tabella `encounter_participants` (nuova)

| Colonna | Tipo | Vincoli | Note |
|---|---|---|---|
| `token_id` | `uuid` | PK, FK `tokens(id)` on delete cascade | un token partecipa al massimo una volta |
| `campaign_id` | `uuid` | not null, FK `encounters(campaign_id)` on delete cascade | serve anche per il filtro Realtime |
| `initiative` | `int` | null, `check (initiative between -20 and 60)` | `null` = non ancora stabilita |
| `modifier` | `int` | not null, default `0`, `check (modifier between -20 and 20)` | primo spareggio |
| `tiebreak` | `int` | not null, default `0` | scelta del DM a parità totale |

Vincolo di coerenza: il token deve essere della stessa campagna, controllato nella policy di insert.

## Regole di accesso (RLS)

| Tabella | Operazione | Chi |
|---|---|---|
| `encounters` | select | membro (`is_member`) |
| `encounters` | insert, update, delete | DM (`is_dm`) |
| `encounter_participants` | select | membro |
| `encounter_participants` | insert, delete | DM, e il token deve appartenere alla stessa campagna |
| `encounter_participants` | update | DM, oppure il Player che è `owner_id` del token |

## Funzione `roll_initiative(p_token uuid, p_modifier int) returns int`

`security invoker`. Legge nome e campagna del token (RLS di select), chiama `public.roll_d20(campagna,
'Iniziativa · ' || nome, p_modifier, null)`, aggiorna `initiative = total, modifier = p_modifier` sul partecipante
e restituisce il totale. Errori: `not_participant` (il token non è in combattimento o non è visibile),
`not_allowed` (0 righe aggiornate per la RLS: la transazione annulla anche il tiro).

## Logica nel client (`app/src/lib/initiative.ts`)

- `sortParticipants(ps)`: iniziativa ↓ (i `null` in fondo), modificatore ↓, tiebreak ↓, `token_id` ↑.
- `nextTurn(ordine, turno, round)` → `{ turn, round }`: dopo l'ultimo torna al primo con `round + 1`; con un solo
  partecipante ogni passo fa salire il round.
- `prevTurn(ordine, turno, round)` → `{ turn, round } | null`: dal primo va all'ultimo con `round - 1`; `null` al
  primo turno del round 1.
- `turnAfterRemoval(ordinePrima, tolto, round)` → il successivo di `tolto` nell'ordine di prima (saltando `tolto`),
  con il round che sale se si riparte dal primo; `null` se non resta nessuno.

## Transizioni di stato

```text
(nessuna riga) --DM avvia--> preparazione (started=false)
preparazione --tutti con iniziativa, DM «Inizia»--> in corso (started=true, round=1, turno=primo)
in corso --DM «Turno successivo/precedente»--> in corso (turno e round aggiornati)
qualsiasi --DM «Termina» + conferma--> (nessuna riga; partecipanti cancellati in cascata)
```
