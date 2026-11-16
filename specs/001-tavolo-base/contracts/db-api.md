# Contratto: interfaccia verso Supabase

Non c'è un'API nostra: il client usa `@supabase/supabase-js`. Questo è il contratto che il
frontend si aspetta dallo schema.

## Funzioni (RPC)

| Funzione | Input | Output | Errori |
|---|---|---|---|
| `create_campaign(p_name text)` | nome 1-80 car. | `uuid` della campagna | nome non valido |
| `join_campaign(p_token uuid)` | token d'invito | `uuid` della campagna | `invite_invalid` (inesistente, usato o scaduto) |

Entrambe usano `auth.uid()`; senza sessione falliscono. `join_campaign` è idempotente se
l'utente è già membro (non consuma l'invito).

## Letture e scritture dirette

| Operazione | Chiamata | Chi |
|---|---|---|
| Elenco campagne | `from('campaigns').select()` | membro |
| Membri della campagna | `from('campaign_members').select().eq('campaign_id', id)` | membro |
| Crea invito | `from('invites').insert({ campaign_id })` → `token` | DM |
| Rimuovi Player | `from('campaign_members').delete().match({ campaign_id, user_id })` | DM |
| Mappa | `from('maps').upsert({ campaign_id, image_path })` | DM |
| Upload immagine | `storage.from('maps').upload('<campaign_id>/<uuid>.<ext>', file)` | DM |
| Link immagine | `storage.from('maps').createSignedUrl(path, 3600)` | membro |
| Crea/elimina token | `from('tokens').insert / delete` | DM |
| Sposta token | `from('tokens').update({ col, row }).eq('id', id)` | DM o proprietario |

## Realtime

Un solo canale per campagna, `table:<campaign_id>`, con tre abbonamenti Postgres Changes
filtrati su `campaign_id=eq.<id>`:

| Tabella | Eventi | Effetto nel client |
|---|---|---|
| `tokens` | INSERT, UPDATE, DELETE | aggiorna/rimuove il token in stato locale |
| `maps` | INSERT, UPDATE | ricarica il signed URL dello sfondo |
| `campaign_members` | DELETE | se la riga è la propria, torna all'elenco campagne |

Alla connessione il client fa prima le select (stato attuale) e poi si abbona; eventuali eventi
arrivati nel frattempo sono idempotenti perché sostituiscono per `id`.
