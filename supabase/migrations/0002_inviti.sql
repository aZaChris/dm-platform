-- US1: inviti e funzioni di creazione/ingresso campagna.

create table public.invites (
  token       uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  created_by  uuid not null default auth.uid() references auth.users (id),
  expires_at  timestamptz not null default now() + interval '7 days',
  used_at     timestamptz,
  used_by     uuid references auth.users (id)
);

alter table public.invites enable row level security;

-- Solo il DM gestisce gli inviti; il riscatto passa da join_campaign() (security definer).
create policy invites_select on public.invites
  for select to authenticated using (public.is_dm(campaign_id));
create policy invites_insert on public.invites
  for insert to authenticated
  with check (public.is_dm(campaign_id) and created_by = auth.uid());
create policy invites_delete on public.invites
  for delete to authenticated using (public.is_dm(campaign_id));

-- Nome mostrato nel tavolo: metadato "name" della registrazione, altrimenti l'email.
create function public.caller_name() returns text
  language sql stable set search_path = ''
  as $$ select coalesce(
    nullif(auth.jwt() -> 'user_metadata' ->> 'name', ''),
    auth.jwt() ->> 'email',
    'Giocatore'
  ) $$;

-- Campagna + riga DM in un'unica transazione (la sola RLS non può farlo: il creatore
-- non è ancora membro, quindi non potrebbe nemmeno rileggere la campagna appena creata).
create function public.create_campaign(p_name text) returns uuid
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  insert into public.campaigns (name) values (p_name) returning id into v_id;
  insert into public.campaign_members (campaign_id, user_id, role, display_name)
  values (v_id, auth.uid(), 'dm', public.caller_name());

  return v_id;
end $$;

-- Riscatto di un invito monouso. Se l'utente è già membro restituisce la campagna
-- senza consumare nulla; altrimenti l'UPDATE condizionato rende il monouso atomico.
create function public.join_campaign(p_token uuid) returns uuid
  language plpgsql security definer set search_path = ''
  as $$
declare
  v_campaign uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select campaign_id into v_campaign from public.invites where token = p_token;
  if v_campaign is not null and public.is_member(v_campaign) then
    return v_campaign;
  end if;

  update public.invites
     set used_at = now(), used_by = auth.uid()
   where token = p_token and used_at is null and expires_at > now()
  returning campaign_id into v_campaign;

  if v_campaign is null then raise exception 'invite_invalid'; end if;

  insert into public.campaign_members (campaign_id, user_id, role, display_name)
  values (v_campaign, auth.uid(), 'player', public.caller_name())
  on conflict do nothing;

  return v_campaign;
end $$;

revoke execute on function public.create_campaign(text), public.join_campaign(uuid)
  from public, anon;
grant  execute on function public.create_campaign(text), public.join_campaign(uuid)
  to authenticated;
