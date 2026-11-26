# Contratto: canale Realtime del righello

Non c'è un'API nostra: il client usa `@supabase/supabase-js` (Realtime Broadcast). Forma dei messaggi in
[data-model.md](../data-model.md).

## Canale

```ts
supabase.channel(`ruler:${campaignId}`, { config: { private: true, broadcast: { self: false } } })
```

- `private: true`: valgono le policy su `realtime.messages` (migrazione `0012_righello.sql`); chi non è membro non
  riceve e non manda.
- `self: false`: chi misura disegna la propria linea in locale, senza aspettare il ritorno.

## Eventi

| Evento | Payload | Quando lo manda chi misura | Cosa fa chi lo riceve |
|---|---|---|---|
| `move` | `{ user_id, name, from, to }` | alla pressione, a ogni cambio della cella d'arrivo, e ogni 1 s se è fermo | sostituisce la misura di `user_id` e ne aggiorna l'istante |
| `end` | `{ user_id }` | al rilascio, con Esc, spegnendo il righello, uscendo dal tavolo | toglie la misura di `user_id` |

Senza `move` da 3 s la misura di un altro si toglie da sola (connessione caduta).

## Policy

```sql
-- lettura: ricevere i messaggi del righello della propria campagna
create policy ruler_select on realtime.messages for select to authenticated
  using (realtime.messages.extension = 'broadcast'
         and (select realtime.topic()) like 'ruler:%'
         and public.is_member(split_part((select realtime.topic()), ':', 2)::uuid));
-- invio: lo stesso controllo
create policy ruler_insert on realtime.messages for insert to authenticated
  with check (realtime.messages.extension = 'broadcast'
              and (select realtime.topic()) like 'ruler:%'
              and public.is_member(split_part((select realtime.topic()), ':', 2)::uuid));
```
