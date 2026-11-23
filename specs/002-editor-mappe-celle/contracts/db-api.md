# Contratto: interfaccia verso Supabase (aggiunte della 002)

Come nella 001, non c'è un'API nostra: il client usa `@supabase/supabase-js`. Qui solo ciò che si aggiunge.

## Funzioni (RPC)

Entrambe `security invoker`: valgono i permessi dell'utente, quindi per un Player ottengono 0 righe modificate.

| Funzione | Input | Output | Errori |
|---|---|---|---|
| `paint_cells(p_campaign uuid, p_patch jsonb)` | `p_patch` = `[[indice, "w"], ...]`, al massimo `cols*rows` voci | niente | `cell_out_of_range`, `cell_type_invalid`, `no_cell_map` (nessuna riga modificabile) |
| `resize_cell_map(p_campaign uuid, p_cols int, p_rows int)` | nuove dimensioni (4..40 × 4..30) | `int`: token riportati dentro il bordo | `no_cell_map`, violazione dei `check` sulle dimensioni |

- `paint_cells` blocca la riga, sostituisce solo le celle indicate e lascia le altre com'erano: due schede del DM non si
  cancellano a vicenda cella per cella (FR-007, edge case «due schede»).
- `resize_cell_map` conserva le celle comuni alle due dimensioni, riempie le nuove con `.` e fa l'`update` dei token.
  Chiamata con le dimensioni attuali, riallinea soltanto i token (serve quando si attiva la mappa a celle).

## Letture e scritture dirette

| Operazione | Chiamata | Chi |
|---|---|---|
| Leggere la mappa | `from('cell_maps').select().eq('campaign_id', id).maybeSingle()` | membro |
| Creare | `from('cell_maps').insert({ campaign_id, cols, rows, cells: '.'.repeat(cols*rows) })` | DM |
| Svuotare | `from('cell_maps').update({ cells: '.'.repeat(cols*rows), updated_at: now }).eq('campaign_id', id)` | DM |
| Attivare/disattivare | `from('cell_maps').update({ active }).eq('campaign_id', id)` | DM |
| Eliminare | `from('cell_maps').delete().eq('campaign_id', id)` | DM |

## Realtime

Canale per campagna `cells:<campaign_id>` con un abbonamento Postgres Changes su `cell_maps`:

| Eventi | Filtro | Effetto nel client |
|---|---|---|
| INSERT, UPDATE | `campaign_id=eq.<id>` | sostituisce lo stato locale con la riga ricevuta (`cols`, `rows`, `cells`, `active`) |
| DELETE | nessuno (gli eventi DELETE non si filtrano): si confronta `old.campaign_id` | rimuove la mappa a celle e mostra l'immagine, se c'è |

Alla connessione il client fa prima la `select` (stato attuale) e poi si abbona; un evento arrivato nel frattempo
sostituisce lo stato per intero, quindi è idempotente.

## Contratto dell'interfaccia (componenti)

| Elemento | Comportamento |
|---|---|
| `MapEditor` (solo DM) | interruttore «Modifica mappa»; strumenti pennello, riempimento, gomma; 5 tipi di cella; annulla/ripeti; dimensione; svuota e elimina con conferma; attiva/disattiva |
| Scorciatoie (solo in modifica) | `B`, `F`, `E`, `1`-`5`, `Ctrl/Cmd+Z`, `Ctrl/Cmd+Y` |
| `MapCanvas` | disegna le celle sotto griglia e token; in modifica i token non si trascinano e il puntatore dipinge |
