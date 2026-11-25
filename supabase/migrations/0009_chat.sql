-- Chat del tavolo (feature 003): una riga per messaggio. recipient_id null = a tutti, altrimenti sussurro.
-- I permessi sono tutti nella RLS: Realtime applica la policy di select a ogni abbonato,
-- quindi un sussurro non arriva nemmeno al browser di chi non deve leggerlo.

create table public.messages (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null,
  recipient_id uuid references auth.users (id) on delete cascade,
  body         text not null check (char_length(btrim(body)) between 1 and 500),
  created_at   timestamptz not null default now(),
  check (recipient_id is null or recipient_id <> user_id)
);

create index messages_campaign_idx on public.messages (campaign_id, created_at desc);

-- Autore e nome non vengono dal client: il trigger li fissa prima che la RLS controlli la riga.
-- Il nome resta anche se il membro viene rimosso dalla campagna.
create function public.set_message_author() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.user_id := auth.uid();
  select display_name into new.display_name from public.campaign_members
    where campaign_id = new.campaign_id and user_id = auth.uid();
  if new.display_name is null then raise exception 'not_member'; end if;
  return new;
end $$;

create trigger messages_author before insert on public.messages
  for each row execute function public.set_message_author();

alter table public.messages enable row level security;

create policy messages_select on public.messages
  for select to authenticated using (
    public.is_member(campaign_id)
    and (recipient_id is null or user_id = auth.uid() or recipient_id = auth.uid())
  );

-- Sussurri: il DM a qualsiasi membro, un Player solo al DM.
create policy messages_insert on public.messages
  for insert to authenticated with check (
    public.is_member(campaign_id)
    and user_id = auth.uid()
    and (
      recipient_id is null
      or exists (
        select 1 from public.campaign_members m
        where m.campaign_id = messages.campaign_id
          and m.user_id = messages.recipient_id
          and (m.role = 'dm' or public.is_dm(messages.campaign_id))
      )
    )
  );

create policy messages_delete on public.messages
  for delete to authenticated using (user_id = auth.uid() or public.is_dm(campaign_id));

-- Nessuna policy di update: i messaggi non si modificano.
-- ponytail: replica identity di default, i DELETE portano solo l'id; il client toglie il messaggio per id.
alter publication supabase_realtime add table public.messages;
