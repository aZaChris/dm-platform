-- Mappe multiple (feature 010): una riga per scena con immagine, griglia e celle. Una sola scena attiva per
-- campagna; i giocatori leggono solo quella (righe, token e immagine).
-- DA APPLICARE INSIEME AL DEPLOY: copia lo stato di maps/cell_maps, che restano (non più usate) fino a una pulizia.

create table public.scenes (
  id             uuid primary key default gen_random_uuid(),
  campaign_id    uuid not null references public.campaigns (id) on delete cascade,
  name           text not null check (char_length(name) between 1 and 40),
  active         boolean not null default false,
  image_path     text,
  grid           text not null default 'square' check (grid in ('square', 'hex')),
  cols           int check (cols between 4 and 40),
  rows           int check (rows between 4 and 30),
  cells          text check (cells ~ '^[.fwda]*$'),
  cells_active   boolean not null default false, -- false = si mostra l'immagine
  tokens_moved_at timestamptz, -- il DM ha tolto token da qui: i client li rileggono
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (id, campaign_id),
  check (num_nulls(cols, rows, cells) in (0, 3)),
  check (cells is null or char_length(cells) = cols * rows),
  check (not cells_active or cells is not null)
);
create unique index scenes_active_idx on public.scenes (campaign_id) where active;

alter table public.scenes enable row level security;
create policy scenes_select on public.scenes
  for select to authenticated using (public.is_dm(campaign_id) or (active and public.is_member(campaign_id)));
create policy scenes_insert on public.scenes
  for insert to authenticated with check (public.is_dm(campaign_id) and not active);
create policy scenes_update on public.scenes
  for update to authenticated using (public.is_dm(campaign_id)) with check (public.is_dm(campaign_id));
create policy scenes_delete on public.scenes
  for delete to authenticated using (public.is_dm(campaign_id) and not active);

-- Una scena attiva per ogni campagna che c'è già, con la sua mappa.
insert into public.scenes (campaign_id, name, active, image_path, grid, cols, rows, cells, cells_active)
select c.id, 'Scena 1', true, m.image_path, coalesce(m.grid, 'square'), k.cols, k.rows, k.cells, coalesce(k.active, false)
  from public.campaigns c
  left join public.maps m on m.campaign_id = c.id
  left join public.cell_maps k on k.campaign_id = c.id;

-- E una per ogni campagna nuova.
create function public.first_scene() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.scenes (campaign_id, name, active) values (new.id, 'Scena 1', true);
  return new;
end $$;
create trigger first_scene after insert on public.campaigns
  for each row execute function public.first_scene();

alter table public.tokens add column scene_id uuid;
update public.tokens t set scene_id = s.id from public.scenes s where s.campaign_id = t.campaign_id and s.active;
alter table public.tokens alter column scene_id set not null;
-- La coppia (scena, campagna) impedisce di mettere un token nella scena di un'altra campagna.
alter table public.tokens add foreign key (scene_id, campaign_id)
  references public.scenes (id, campaign_id) on delete cascade;

-- Senza scena indicata il token va in quella attiva.
create function public.token_scene() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.scene_id is null then
    select id into new.scene_id from public.scenes where campaign_id = new.campaign_id and active;
  end if;
  return new;
end $$;
create trigger token_scene before insert on public.tokens
  for each row execute function public.token_scene();
revoke all on function public.first_scene(), public.token_scene() from public, anon, authenticated;

create function public.scene_is_active(s uuid) returns boolean
  language sql stable security definer set search_path = ''
  as $$ select exists (select 1 from public.scenes where id = s and active) $$;
revoke execute on function public.scene_is_active(uuid) from public, anon;
grant execute on function public.scene_is_active(uuid) to authenticated;

drop policy tokens_select on public.tokens;
create policy tokens_select on public.tokens
  for select to authenticated
  using (public.is_dm(campaign_id) or (public.is_member(campaign_id) and public.scene_is_active(scene_id)));
drop policy tokens_update on public.tokens;
create policy tokens_update on public.tokens
  for update to authenticated
  using (public.is_dm(campaign_id) or (public.is_member(campaign_id) and owner_id = auth.uid() and public.scene_is_active(scene_id)))
  with check (public.is_dm(campaign_id) or (public.is_member(campaign_id) and owner_id = auth.uid() and public.scene_is_active(scene_id)));

-- Immagini: il giocatore legge solo quella della scena attiva.
drop policy maps_obj_select on storage.objects;
create policy maps_obj_select on storage.objects
  for select to authenticated
  using (bucket_id = 'maps' and (
    public.is_dm(((storage.foldername(name))[1])::uuid)
    or exists (select 1 from public.scenes s where s.active and s.image_path = objects.name
               and public.is_member(s.campaign_id))
  ));

-- Come paint_cells e resize_cell_map, sulla scena. security invoker: vale la RLS (scrive solo il DM).
create function public.paint_scene(p_scene uuid, p_patch jsonb) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.scenes;
  v_cells text;
  e jsonb;
  v_i int;
  v_t text;
begin
  select * into v_row from public.scenes where id = p_scene for update;
  if not found or v_row.cells is null then raise exception 'no_cell_map'; end if;
  v_cells := v_row.cells;
  for e in select * from jsonb_array_elements(p_patch) loop
    v_i := (e ->> 0)::int;
    v_t := e ->> 1;
    if v_i < 0 or v_i >= v_row.cols * v_row.rows then raise exception 'cell_out_of_range'; end if;
    if v_t is null or v_t !~ '^[.fwda]$' then raise exception 'cell_type_invalid'; end if;
    v_cells := overlay(v_cells placing v_t from v_i + 1 for 1);
  end loop;
  update public.scenes set cells = v_cells, updated_at = now() where id = p_scene;
  if not found then raise exception 'no_cell_map'; end if;
end $$;

create function public.resize_scene(p_scene uuid, p_cols int, p_rows int) returns int
language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.scenes;
  v_new text := '';
  r int;
  v_moved int;
begin
  select * into v_row from public.scenes where id = p_scene for update;
  if not found or v_row.cells is null then raise exception 'no_cell_map'; end if;
  for r in 0 .. p_rows - 1 loop
    if r < v_row.rows then
      v_new := v_new || rpad(left(substr(v_row.cells, r * v_row.cols + 1, v_row.cols), p_cols), p_cols, '.');
    else
      v_new := v_new || repeat('.', p_cols);
    end if;
  end loop;
  update public.scenes set cols = p_cols, rows = p_rows, cells = v_new, updated_at = now() where id = p_scene;
  if not found then raise exception 'no_cell_map'; end if;
  update public.tokens set col = least(col, p_cols - 1), "row" = least("row", p_rows - 1)
    where scene_id = p_scene and (col > p_cols - 1 or "row" > p_rows - 1);
  get diagnostics v_moved = row_count;
  return v_moved;
end $$;

-- Mette in scena: i token dei giocatori seguono (stesso id, quindi la scheda resta collegata).
-- ponytail: su una mappa a immagine non si controlla che restino dentro i bordi; il DM li trascina.
create function public.activate_scene(p_scene uuid) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_new public.scenes;
  v_old uuid;
begin
  select * into v_new from public.scenes where id = p_scene;
  if not found or not public.is_dm(v_new.campaign_id) then raise exception 'not_allowed'; end if;
  if v_new.active then return; end if;
  if exists (select 1 from public.encounters where campaign_id = v_new.campaign_id) then
    raise exception 'combat_active';
  end if;
  select id into v_old from public.scenes where campaign_id = v_new.campaign_id and active for update;
  update public.scenes set active = false where id = v_old;
  update public.scenes set active = true, updated_at = now() where id = p_scene;
  update public.tokens set scene_id = p_scene where scene_id = v_old and owner_id is not null;
  if v_new.cells_active then
    update public.tokens set col = least(col, v_new.cols - 1), "row" = least("row", v_new.rows - 1)
      where scene_id = p_scene and (col > v_new.cols - 1 or "row" > v_new.rows - 1);
  end if;
end $$;

revoke all on function public.paint_scene(uuid, jsonb), public.resize_scene(uuid, int, int), public.activate_scene(uuid) from public, anon;
grant execute on function public.paint_scene(uuid, jsonb), public.resize_scene(uuid, int, int), public.activate_scene(uuid) to authenticated;

alter publication supabase_realtime add table public.scenes;
