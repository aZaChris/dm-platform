# Contratto: interfaccia verso Supabase (aggiunte della 004)

Come nelle feature precedenti, non c'è un'API nostra: il client usa `@supabase/supabase-js`.

## Funzione (RPC)

| Funzione | Input | Output | Errori |
|---|---|---|---|
| `roll_initiative(p_token uuid, p_modifier int)` | token in combattimento, modificatore -20..20 | `int`: il totale | `not_participant`, `not_allowed`, `not_member` (da `roll_d20`) |

`security invoker`: valgono i permessi dell'utente. Il tiro passa da `roll_d20`, quindi finisce in `rolls` e
compare nella chat a tutti.

## Letture e scritture dirette

| Operazione | Chiamata | Chi |
|---|---|---|
| Leggere il combattimento | `from('encounters').select('*').eq('campaign_id', id).maybeSingle()` | membro |
| Leggere i partecipanti | `from('encounter_participants').select('*').eq('campaign_id', id)` | membro |
| Avviare | `insert` in `encounters({ campaign_id })`, poi `insert` in `encounter_participants` di `[{ campaign_id, token_id }, ...]` | DM |
| Iniziativa a mano | `from('encounter_participants').update({ initiative, modifier }).eq('token_id', t).select('token_id')` | DM o proprietario del token |
| Scambiare due pari | `update({ tiebreak: altro.tiebreak + 1 })` sul partecipante che deve salire | DM |
| Iniziare | `from('encounters').update({ started: true, round: 1, turn_token_id: primo })` | DM |
| Turno avanti/indietro | `from('encounters').update({ round, turn_token_id, updated_at })` | DM |
| Aggiungere / togliere | `insert` / `delete().eq('token_id', t)` su `encounter_participants` | DM |
| Terminare | `from('encounters').delete().eq('campaign_id', id)` | DM |

Le scritture con `.select()` restituiscono 0 righe se la RLS le rifiuta: il client lo mostra come errore.

## Realtime

Canale `combat:<campaign_id>`:

| Evento | Filtro | Cosa fa il client |
|---|---|---|
| `*` su `encounters` | `campaign_id=eq.<id>` | INSERT/UPDATE sostituiscono lo stato |
| `DELETE` su `encounters` | nessuno | se `old.campaign_id` è questa campagna: combattimento finito |
| `INSERT`/`UPDATE` su `encounter_participants` | `campaign_id=eq.<id>` | sostituisce per `token_id` |
| `DELETE` su `encounter_participants` | nessuno | toglie per `token_id`; se era di turno e l'utente è DM, sposta il turno (`turnAfterRemoval`) |

Caricamento iniziale allo stato `SUBSCRIBED` (anche dopo una riconnessione).
