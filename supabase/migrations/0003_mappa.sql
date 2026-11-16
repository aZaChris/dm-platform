-- US2: mappa condivisa (una per campagna) e bucket privato per le immagini.

create table public.maps (
  campaign_id uuid primary key references public.campaigns (id) on delete cascade,
  image_path  text not null,
  updated_at  timestamptz not null default now()
);

alter table public.maps enable row level security;

create policy maps_select on public.maps
  for select to authenticated using (public.is_member(campaign_id));
create policy maps_insert on public.maps
  for insert to authenticated with check (public.is_dm(campaign_id));
create policy maps_update on public.maps
  for update to authenticated using (public.is_dm(campaign_id)) with check (public.is_dm(campaign_id));
create policy maps_delete on public.maps
  for delete to authenticated using (public.is_dm(campaign_id));

alter publication supabase_realtime add table public.maps;

-- Bucket privato: 5 MB e solo jpeg/png/webp li applica Supabase (FR-012).
-- Il primo segmento del percorso è l'id della campagna: "<campaign_id>/<uuid>.<ext>".
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('maps', 'maps', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy maps_obj_select on storage.objects
  for select to authenticated
  using (bucket_id = 'maps' and public.is_member(((storage.foldername(name))[1])::uuid));
create policy maps_obj_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'maps' and public.is_dm(((storage.foldername(name))[1])::uuid));
create policy maps_obj_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'maps' and public.is_dm(((storage.foldername(name))[1])::uuid));
