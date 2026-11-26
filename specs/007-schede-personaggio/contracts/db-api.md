# Contratto: interfaccia verso Supabase (aggiunte della 007)

Come nelle feature precedenti, non c'è un'API nostra: il client usa `@supabase/supabase-js`. Tabella e permessi in
[data-model.md](../data-model.md).

## Funzioni (RPC)

| Funzione | Input | Output | Errori |
|---|---|---|---|
| `patch_character(p_id uuid, p_path text[], p_value jsonb)` | scheda, percorso dentro `data` (es. `{hp,current}`, `{abilities,str}`, `{attacks}`), nuovo valore | la riga aggiornata | `not_allowed` (0 righe: la RLS rifiuta), `too_large` (oltre 256 KB) |
| `roll_character(p_character uuid, p_label text, p_modifier int)` | scheda, nome della prova (es. «Furtività»), modificatore -20..20 | la riga di `rolls` | `not_allowed` (non proprietario né DM), `not_member` (da `roll_d20`) |

- `patch_character`: `security invoker`; aggiorna `data = jsonb_set(data, p_path, p_value, true)` e `updated_at`
  in un'unica istruzione, quindi due modifiche a campi diversi non si cancellano (research, punto 2). Un percorso
  vuoto è rifiutato: la scheda intera non si riscrive.
- `roll_character`: `security invoker`; verifica `owner_id = auth.uid() or is_dm(campaign_id)` sulla scheda, poi
  chiama `roll_d20(campaign_id, left(name || ' · ' || p_label, 60), p_modifier, null)`. Il tiro finisce in `rolls`
  e compare in overlay e chat a tutti.

## Letture e scritture dirette

| Operazione | Chiamata | Chi |
|---|---|---|
| Elenco della campagna | `from('characters').select('id, name, owner_id, token_id, data, updated_at').eq('campaign_id', id).order('name')` | membro |
| Nuova scheda vuota | `insert({ campaign_id, owner_id, name, data: {} }).select().single()` | DM, o giocatore per sé |
| Importare personaggi | `insert([{ campaign_id, owner_id, name, data }, ...]).select('id')`: tutti o nessuno (FR-013) | DM, o giocatore per sé |
| Sostituire con un import | `update({ name, data }).eq('id', id).select('id')` dopo conferma | proprietario o DM |
| Cambiare proprietario o token | `update({ owner_id })`, `update({ token_id })` | solo DM (trigger) |
| Eliminare | `delete().eq('id', id).select('id')` dopo conferma | proprietario o DM |
| Preferenza della vista | `auth.updateUser({ data: { vista_scheda: 'pratica' \| 'classica' } })` | l'utente |

Le scritture con `.select()` restituiscono 0 righe se la RLS le rifiuta: il client lo mostra come errore.

## Realtime

Canale `characters:<campaign_id>`:

| Evento | Filtro | Cosa fa il client |
|---|---|---|
| `INSERT`/`UPDATE` su `characters` | `campaign_id=eq.<id>` | sostituisce la scheda per `id` (la riga arriva intera) |
| `DELETE` su `characters` | nessuno (i DELETE non si filtrano) | toglie la scheda per `id`, se è di questa campagna |

Un campo che l'utente sta scrivendo non viene sovrascritto dall'evento finché ha il focus: il valore remoto si
applica all'uscita dal campo. Gli altri campi si aggiornano subito.
