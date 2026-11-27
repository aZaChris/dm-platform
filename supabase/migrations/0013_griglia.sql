-- 006: tipo di griglia della mappa a immagine. Permessi: le policy di maps (scrive solo il DM).
alter table public.maps
  add column grid text not null default 'square' check (grid in ('square', 'hex'));
