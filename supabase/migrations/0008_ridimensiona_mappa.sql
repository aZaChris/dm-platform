-- Cambio dimensione della mappa a celle: conserva le celle comuni, riempie le nuove con "." e
-- riporta dentro il bordo i token fuori. Restituisce quanti token ha spostato.
-- Chiamata con le dimensioni attuali riallinea soltanto i token. security invoker: vale la RLS.

create or replace function public.resize_cell_map(p_campaign uuid, p_cols int, p_rows int)
returns int
language plpgsql security invoker set search_path = '' as $$
declare
  v_row public.cell_maps;
  v_new text := '';
  r int;
  v_moved int;
begin
  select * into v_row from public.cell_maps where campaign_id = p_campaign for update;
  if not found then raise exception 'no_cell_map'; end if;

  for r in 0 .. p_rows - 1 loop
    if r < v_row.rows then
      v_new := v_new || rpad(left(substr(v_row.cells, r * v_row.cols + 1, v_row.cols), p_cols), p_cols, '.');
    else
      v_new := v_new || repeat('.', p_cols);
    end if;
  end loop;

  update public.cell_maps set cols = p_cols, rows = p_rows, cells = v_new, updated_at = now()
    where campaign_id = p_campaign;
  if not found then raise exception 'no_cell_map'; end if;

  update public.tokens
    set col = least(col, p_cols - 1), "row" = least("row", p_rows - 1)
    where campaign_id = p_campaign and (col > p_cols - 1 or "row" > p_rows - 1);
  get diagnostics v_moved = row_count;
  return v_moved;
end $$;

revoke all on function public.resize_cell_map(uuid, int, int) from public, anon;
grant execute on function public.resize_cell_map(uuid, int, int) to authenticated;
