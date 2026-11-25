-- Turni e iniziativa (feature 004): al massimo un combattimento per campagna, una riga per partecipante.
-- Ordine e calcolo dei turni stanno nel client (app/src/lib/initiative.ts); qui solo dati e permessi.

create table public.encounters (
  campaign_id   uuid primary key references public.campaigns (id) on delete cascade,
  started       boolean not null default false, -- false = si stabiliscono le iniziative
  round         int not null default 1 check (round >= 1),
  turn_token_id uuid, -- nessuna FK: se il token sparisce il client del DM sposta il turno (research, punto 5)
  updated_at    timestamptz not null default now()
);

create table public.encounter_participants (
  token_id    uuid primary key references public.tokens (id) on delete cascade,
  campaign_id uuid not null references public.encounters (campaign_id) on delete cascade,
  initiative  int check (initiative between -20 and 60), -- null = non ancora stabilita
  modifier    int not null default 0 check (modifier between -20 and 20),
  tiebreak    int not null default 0 -- scelta del DM a parità totale
);

create index encounter_participants_campaign_idx on public.encounter_participants (campaign_id);

alter table public.encounters enable row level security;
alter table public.encounter_participants enable row level security;

create policy encounters_select on public.encounters
  for select to authenticated using (public.is_member(campaign_id));
create policy encounters_insert on public.encounters
  for insert to authenticated with check (public.is_dm(campaign_id));
create policy encounters_update on public.encounters
  for update to authenticated using (public.is_dm(campaign_id)) with check (public.is_dm(campaign_id));
create policy encounters_delete on public.encounters
  for delete to authenticated using (public.is_dm(campaign_id));

create policy participants_select on public.encounter_participants
  for select to authenticated using (public.is_member(campaign_id));

-- Il DM aggiunge solo token della stessa campagna.
create policy participants_insert on public.encounter_participants
  for insert to authenticated with check (
    public.is_dm(campaign_id)
    and exists (select 1 from public.tokens t where t.id = token_id and t.campaign_id = encounter_participants.campaign_id)
  );

-- Iniziativa: il DM per tutti, il Player solo per i token di cui è proprietario.
-- ponytail: il Player può toccare anche il tiebreak del suo token; privilegi di colonna se diventa un problema.
create policy participants_update on public.encounter_participants
  for update to authenticated
  using (public.is_dm(campaign_id) or exists (select 1 from public.tokens t where t.id = token_id and t.owner_id = auth.uid()))
  with check (public.is_dm(campaign_id) or exists (select 1 from public.tokens t where t.id = token_id and t.owner_id = auth.uid()));

create policy participants_delete on public.encounter_participants
  for delete to authenticated using (public.is_dm(campaign_id));

-- Tiro d'iniziativa: il numero lo genera roll_d20 (non truccabile, compare nella chat).
-- security invoker: se la RLS rifiuta l'update, l'eccezione annulla anche il tiro.
create or replace function public.roll_initiative(p_token uuid, p_modifier int)
returns int
language plpgsql security invoker set search_path = '' as $$
declare
  v_campaign uuid;
  v_name     text;
  v_roll     public.rolls;
begin
  select p.campaign_id, t.name into v_campaign, v_name
    from public.encounter_participants p join public.tokens t on t.id = p.token_id
    where p.token_id = p_token;
  if v_campaign is null then raise exception 'not_participant'; end if;

  v_roll := public.roll_d20(v_campaign, 'Iniziativa · ' || v_name, p_modifier, null);

  update public.encounter_participants set initiative = v_roll.total, modifier = p_modifier
    where token_id = p_token;
  if not found then raise exception 'not_allowed'; end if;
  return v_roll.total;
end $$;

revoke all on function public.roll_initiative(uuid, int) from public, anon;
grant execute on function public.roll_initiative(uuid, int) to authenticated;

-- ponytail: replica identity di default; i DELETE portano solo la chiave primaria e il client li riconosce da quella.
alter publication supabase_realtime add table public.encounters, public.encounter_participants;
