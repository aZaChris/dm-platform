# Contratto: interfaccia verso Supabase (aggiunte della 003)

Come nelle feature precedenti, non c'è un'API nostra: il client usa `@supabase/supabase-js`. Qui solo ciò che si aggiunge.

## Letture e scritture dirette

| Operazione | Chiamata | Chi | Errori |
|---|---|---|---|
| Ultimi 100 messaggi | `from('messages').select('*').eq('campaign_id', id).order('created_at', { ascending: false }).limit(100)` | membro (la RLS toglie i sussurri altrui) | nessuno: un non membro riceve 0 righe |
| Inviare | `from('messages').insert({ campaign_id, body, recipient_id })` | membro | violazione RLS (destinatario non ammesso), `check` su `body`, `not_member` |
| Eliminare | `from('messages').delete().eq('id', id).select('id')` | autore o DM | 0 righe restituite = non permesso |

`user_id` e `display_name` **non si mandano**: li imposta il trigger. Se il client li manda, vengono sovrascritti.

## Realtime

Canale `chat:<campaign_id>`, separato da `table:<campaign_id>`:

| Evento | Filtro | Cosa fa il client |
|---|---|---|
| `INSERT` su `messages` | `campaign_id=eq.<id>` | aggiunge il messaggio se l'`id` non c'è già (idempotente rispetto alla select iniziale) |
| `DELETE` su `messages` | nessuno (i `DELETE` non si filtrano lato server) | toglie il messaggio con quell'`id`, se presente |

Come in `useTable`, la select iniziale parte quando lo stato del canale è `SUBSCRIBED`, così non si perdono
messaggi arrivati in mezzo (e dopo una riconnessione si ricarica).

I tiri continuano ad arrivare dal canale `table:<campaign_id>` di `useTable` (INSERT su `rolls`), come oggi.
