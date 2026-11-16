-- US3: token sulla mappa. Posizione in celle (col, "row"), così cambiare immagine non li sposta.

create table public.tokens (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  color       text not null default '#c0392b' check (color ~ '^#[0-9a-fA-F]{6}$'),
  col         int  not null check (col >= 0),
  "row"       int  not null check ("row" >= 0),
  owner_id    uuid references auth.users (id) on delete set null, -- null = del DM
  created_at  timestamptz not null default now()
);

create index tokens_campaign_idx on public.tokens (campaign_id);

alter table public.tokens enable row level security;

create policy tokens_select on public.tokens
  for select to authenticated using (public.is_member(campaign_id));

-- Crea solo il DM, e l'assegnatario (se c'è) deve essere un membro della stessa campagna.
create policy tokens_insert on public.tokens
  for insert to authenticated
  with check (
    public.is_dm(campaign_id)
    and (owner_id is null or exists (
      select 1 from public.campaign_members m
      where m.campaign_id = tokens.campaign_id and m.user_id = tokens.owner_id
    ))
  );

-- Muove il DM, oppure il Player solo se il token è suo. Il WITH CHECK impedisce a un Player
-- di riassegnarlo ad altri. Limite noto: può rinominare/ricolorare il proprio token.
create policy tokens_update on public.tokens
  for update to authenticated
  using (public.is_member(campaign_id) and (public.is_dm(campaign_id) or owner_id = auth.uid()))
  with check (public.is_member(campaign_id) and (public.is_dm(campaign_id) or owner_id = auth.uid()));

create policy tokens_delete on public.tokens
  for delete to authenticated using (public.is_dm(campaign_id));

-- FULL: gli eventi DELETE portano campaign_id e il filtro Realtime funziona.
alter table public.tokens replica identity full;
alter publication supabase_realtime add table public.tokens;
