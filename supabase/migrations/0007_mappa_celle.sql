-- Mappa a celle (feature 002): una riga per campagna, con una stringa di un carattere per cella.
-- Alfabeto: . vuoto, f pavimento, w muro, d porta, a acqua. Indice = riga * colonne + colonna.

create table public.cell_maps (
  campaign_id uuid primary key references public.campaigns (id) on delete cascade,
  cols        int  not null check (cols between 4 and 40),
  rows        int  not null check (rows between 4 and 30),
  cells       text not null check (cells ~ '^[.fwda]*$'),
  active      boolean not null default true, -- false = si mostra l'immagine di maps
  updated_at  timestamptz not null default now(),
  check (char_length(cells) = cols * rows)
);

alter table public.cell_maps enable row level security;

create policy cell_maps_select on public.cell_maps
  for select to authenticated using (public.is_member(campaign_id));
create policy cell_maps_insert on public.cell_maps
  for insert to authenticated with check (public.is_dm(campaign_id));
create policy cell_maps_update on public.cell_maps
  for update to authenticated using (public.is_dm(campaign_id)) with check (public.is_dm(campaign_id));
create policy cell_maps_delete on public.cell_maps
  for delete to authenticated using (public.is_dm(campaign_id));

-- Un tratto = [[indice, "w"], ...]. Sostituisce solo le celle indicate sulla riga bloccata:
-- due schede del DM non si cancellano a vicenda. security invoker: i permessi sono quelli della RLS,
-- quindi un Player non trova righe modificabili e ottiene no_cell_map.
create or replace function public.paint_cells(p_campaign uuid, p_patch jsonb)
returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.cell_maps;
  v_cells text;
  e jsonb;
  v_i int;
  v_t text;
begin
  select * into v_row from public.cell_maps where campaign_id = p_campaign for update;
  if not found then raise exception 'no_cell_map'; end if;
  v_cells := v_row.cells;
  for e in select * from jsonb_array_elements(p_patch) loop
    v_i := (e ->> 0)::int;
    v_t := e ->> 1;
    if v_i < 0 or v_i >= v_row.cols * v_row.rows then raise exception 'cell_out_of_range'; end if;
    if v_t is null or v_t !~ '^[.fwda]$' then raise exception 'cell_type_invalid'; end if;
    v_cells := overlay(v_cells placing v_t from v_i + 1 for 1);
  end loop;
  update public.cell_maps set cells = v_cells, updated_at = now() where campaign_id = p_campaign;
  if not found then raise exception 'no_cell_map'; end if;
end $$;

revoke all on function public.paint_cells(uuid, jsonb) from public, anon;
grant execute on function public.paint_cells(uuid, jsonb) to authenticated;

alter publication supabase_realtime add table public.cell_maps;
