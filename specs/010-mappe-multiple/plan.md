# Implementation Plan: Mappe multiple e scene

**Spec**: [spec.md](spec.md)

## Summary

Tabella `scenes` (immagine, griglia, celle, quale è in gioco) e `tokens.scene_id`. I permessi stanno nella RLS; il
cambio di scena è una funzione sola (`activate_scene`), così avviene tutto insieme o niente. Nessuna dipendenza.

## Scelte

- **Tabella nuova** invece di cambiare la chiave di `maps` e `cell_maps`: la migrazione aggiunge e copia. Le tabelle
  vecchie e `paint_cells`/`resize_cell_map` restano inutilizzate: da togliere in una migrazione successiva.
- **Token dei giocatori spostati**, non copiati: stesso id, quindi scheda collegata.
- **`tokens_moved_at`**: un token che diventa invisibile non manda eventi al giocatore; il cambio di questo campo
  fa rileggere i token.
- **Righello** su una scena non in gioco: resta locale.

## Rilascio

`0014_scene.sql` va applicata **insieme al deploy**: copia lo stato di quel momento, e dopo la migrazione l'app
vecchia mostrerebbe ai giocatori solo l'immagine copiata.

## Constitution Check

I ✅ · II ✅ · III ✅ RLS, Realtime e Storage di Supabase · IV ✅ · V ✅ mappa con griglia e token.
