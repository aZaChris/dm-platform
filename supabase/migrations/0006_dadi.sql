-- Dadi: il d20 lo tira il database, non il browser, così nessuno può truccare un tiro.
-- La tabella non ha policy di insert: si scrive solo da roll_d20().

create table public.rolls (
  id           uuid primary key default gen_random_uuid(),
  campaign_id  uuid not null references public.campaigns (id) on delete cascade,
  user_id      uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  label        text not null check (char_length(label) between 1 and 60),
  face      int  not null check (face between 1 and 20),
  modifier     int  not null check (modifier between -20 and 20),
  total        int  not null,
  dc           int  check (dc between 1 and 40), -- null = tiro libero, senza verdetto
  created_at   timestamptz not null default now()
);

create index rolls_campaign_idx on public.rolls (campaign_id, created_at desc);

alter table public.rolls enable row level security;

create policy rolls_select on public.rolls
  for select to authenticated using (public.is_member(campaign_id));

create or replace function public.roll_d20(p_campaign uuid, p_label text, p_modifier int, p_dc int)
returns public.rolls
language plpgsql security definer set search_path = '' as $$
declare
  v_name text;
  v_nat  int;
  v_row  public.rolls;
begin
  select display_name into v_name from public.campaign_members
    where campaign_id = p_campaign and user_id = auth.uid();
  if v_name is null then raise exception 'not_member'; end if;

  -- ponytail: random() non è crittografico; basta per un gioco tra amici, e il client non lo controlla.
  v_nat := floor(random() * 20)::int + 1;

  insert into public.rolls (campaign_id, user_id, display_name, label, face, modifier, total, dc)
  values (p_campaign, auth.uid(), v_name, left(p_label, 60), v_nat, p_modifier, v_nat + p_modifier, p_dc)
  returning * into v_row;
  return v_row;
end $$;

revoke all on function public.roll_d20(uuid, text, int, int) from public, anon;
grant execute on function public.roll_d20(uuid, text, int, int) to authenticated;

alter publication supabase_realtime add table public.rolls;
