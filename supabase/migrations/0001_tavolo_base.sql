-- Tavolo base (specs/001-tavolo-base). Il file cresce per fasi: base, inviti, mappa, token.

-- ===== Fondamenta: campagne, membri, helper di ruolo =====

create type public.member_role as enum ('dm', 'player');

create table public.campaigns (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 80),
  created_by uuid not null default auth.uid() references auth.users (id),
  created_at timestamptz not null default now()
);

create table public.campaign_members (
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  role         public.member_role not null,
  display_name text not null,
  joined_at    timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

-- security definer: evita la ricorsione infinita delle policy su campaign_members.
create function public.is_member(c uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (
    select 1 from public.campaign_members
    where campaign_id = c and user_id = auth.uid()
  ) $$;

create function public.is_dm(c uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (
    select 1 from public.campaign_members
    where campaign_id = c and user_id = auth.uid() and role = 'dm'
  ) $$;

revoke execute on function public.is_member(uuid), public.is_dm(uuid) from public, anon;
grant  execute on function public.is_member(uuid), public.is_dm(uuid) to authenticated;

alter table public.campaigns        enable row level security;
alter table public.campaign_members enable row level security;

-- campaigns: la creazione passa solo da create_campaign() (nessuna policy di insert)
create policy campaigns_select on public.campaigns
  for select to authenticated using (public.is_member(id));
create policy campaigns_update on public.campaigns
  for update to authenticated using (public.is_dm(id)) with check (public.is_dm(id));
create policy campaigns_delete on public.campaigns
  for delete to authenticated using (public.is_dm(id));

-- campaign_members: righe create solo da create_campaign()/join_campaign();
-- il DM può rimuovere i membri ma non se stesso.
create policy members_select on public.campaign_members
  for select to authenticated using (public.is_member(campaign_id));
create policy members_delete on public.campaign_members
  for delete to authenticated
  using (public.is_dm(campaign_id) and user_id <> auth.uid());
