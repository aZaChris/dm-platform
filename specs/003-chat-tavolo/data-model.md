# Data Model: Chat del tavolo

## Tabella `messages` (nuova)

| Colonna | Tipo | Vincoli | Note |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | |
| `campaign_id` | `uuid` | not null, FK `campaigns(id)` on delete cascade | |
| `user_id` | `uuid` | not null, FK `auth.users(id)` on delete cascade | impostato dal trigger = `auth.uid()` |
| `display_name` | `text` | not null | copiato dal trigger da `campaign_members`; resta se il membro è rimosso |
| `recipient_id` | `uuid` | null, FK `auth.users(id)` on delete cascade | `null` = a tutti; altrimenti sussurro |
| `body` | `text` | not null, `char_length(btrim(body)) between 1 and 500` | testo semplice |
| `created_at` | `timestamptz` | not null, default `now()` | orologio del database |

Indice: `(campaign_id, created_at desc)`, per caricare gli ultimi 100.

Vincolo aggiuntivo: `check (recipient_id is null or recipient_id <> user_id)`: niente sussurri a se stessi.

## Regole di accesso (RLS)

| Operazione | Chi | Condizione |
|---|---|---|
| select | membro | `is_member(campaign_id)` e (`recipient_id is null` o `user_id = auth.uid()` o `recipient_id = auth.uid()`) |
| insert | membro | `is_member(campaign_id)`, `user_id = auth.uid()` e destinatario valido (vedi sotto) |
| delete | autore o DM | `user_id = auth.uid()` o `is_dm(campaign_id)` |
| update | nessuno | nessuna policy: i messaggi non si modificano |

Destinatario valido: `recipient_id is null`, oppure il DM sussurra a un membro della campagna, oppure un Player
sussurra al DM della campagna.

**Limite noto**: il DM vede solo i sussurri in cui è mittente o destinatario, quindi non legge quelli tra due
Player. Non ce ne sono, perché un Player può sussurrare solo al DM.

## Trigger `set_message_author` (before insert)

- `new.user_id := auth.uid()`
- `new.display_name := (select display_name from campaign_members where campaign_id = new.campaign_id and user_id = auth.uid())`
- se il nome è `null` (non membro): `raise exception 'not_member'`. La policy di insert lo bloccherebbe comunque;
  l'errore dà solo un messaggio più chiaro.

## Entità esistenti toccate

- **Tiro (`rolls`)**: invariato. Nel client se ne caricano 100 invece di 20, per mostrarli nella chat.

## Elemento del flusso (solo client)

`{ kind: 'msg', ...Message } | { kind: 'roll', ...Roll }`, ordinato per `created_at`, poi per `id`; si mostrano gli
ultimi 100. Non è salvato: si ricostruisce da `messages` e `rolls`.
