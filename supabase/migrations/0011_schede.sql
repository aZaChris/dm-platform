-- Schede personaggio (feature 007): una riga per scheda, il contenuto in data jsonb.
-- Forma di data e valori calcolati: specs/007-schede-personaggio/data-model.md (i calcoli stanno nel client).

create table public.characters (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  owner_id    uuid references auth.users (id) on delete set null, -- null = del DM
  token_id    uuid unique references public.tokens (id) on delete set null, -- eliminare il token non elimina la scheda
  name        text not null check (char_length(name) between 1 and 60),
  data        jsonb not null default '{}'::jsonb
              check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 262144),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index characters_campaign_idx on public.characters (campaign_id);

alter table public.characters enable row level security;

create policy characters_select on public.characters
  for select to authenticated using (public.is_member(campaign_id));

-- Il DM crea per chiunque della campagna; il giocatore solo per sé e senza token.
create policy characters_insert on public.characters
  for insert to authenticated with check (
    (public.is_dm(campaign_id)
      or (owner_id = auth.uid() and token_id is null and public.is_member(campaign_id)))
    and (owner_id is null or exists (
      select 1 from public.campaign_members m where m.campaign_id = characters.campaign_id and m.user_id = owner_id))
  );

create policy characters_update on public.characters
  for update to authenticated
  using (public.is_dm(campaign_id) or owner_id = auth.uid())
  with check (public.is_dm(campaign_id) or owner_id = auth.uid());

create policy characters_delete on public.characters
  for delete to authenticated using (public.is_dm(campaign_id) or owner_id = auth.uid());

-- La RLS non vede il valore vecchio di una colonna: proprietario, token e campagna li cambia solo il DM.
create or replace function public.characters_guard()
returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_dm(old.campaign_id)
     and (new.owner_id is distinct from old.owner_id
          or new.token_id is distinct from old.token_id
          or new.campaign_id is distinct from old.campaign_id) then
    raise exception 'not_allowed';
  end if;
  if new.token_id is not null and not exists (
       select 1 from public.tokens t where t.id = new.token_id and t.campaign_id = new.campaign_id) then
    raise exception 'token_other_campaign';
  end if;
  if new.owner_id is not null and not exists (
       select 1 from public.campaign_members m where m.campaign_id = new.campaign_id and m.user_id = new.owner_id) then
    raise exception 'owner_not_member';
  end if;
  return new;
end $$;

create trigger characters_guard before update on public.characters
  for each row execute function public.characters_guard();

-- Una modifica = un campo: due persone sulla stessa scheda non si cancellano a vicenda (come paint_cells).
create or replace function public.patch_character(p_id uuid, p_path text[], p_value jsonb)
returns public.characters
language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.characters;
begin
  if p_path is null or cardinality(p_path) = 0 then raise exception 'empty_path'; end if;
  update public.characters
    set data = jsonb_set(data, p_path, p_value, true), updated_at = now()
    where id = p_id
    returning * into v_row;
  if not found then raise exception 'not_allowed'; end if;
  return v_row;
end $$;

-- Tiro dalla scheda: solo il proprietario o il DM; il numero lo genera roll_d20 (compare in chat a tutti).
create or replace function public.roll_character(p_character uuid, p_label text, p_modifier int)
returns public.rolls
language plpgsql security invoker set search_path = '' as $$
declare
  v_c public.characters;
begin
  select * into v_c from public.characters where id = p_character;
  if v_c.id is null then raise exception 'not_allowed'; end if;
  if v_c.owner_id is distinct from auth.uid() and not public.is_dm(v_c.campaign_id) then
    raise exception 'not_allowed';
  end if;
  return public.roll_d20(v_c.campaign_id, left(v_c.name || ' · ' || p_label, 60), p_modifier, null);
end $$;

revoke all on function public.patch_character(uuid, text[], jsonb) from public, anon;
grant execute on function public.patch_character(uuid, text[], jsonb) to authenticated;
revoke all on function public.roll_character(uuid, text, int) from public, anon;
grant execute on function public.roll_character(uuid, text, int) to authenticated;
revoke all on function public.characters_guard() from public, anon, authenticated;

-- ponytail: replica identity di default; i DELETE portano solo l'id e il client li riconosce da quello.
alter publication supabase_realtime add table public.characters;
