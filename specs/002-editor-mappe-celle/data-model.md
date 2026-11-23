# Data Model: Editor di mappe a celle

Tabella nuova con RLS attiva. `is_member(c)` e `is_dm(c)` sono le funzioni `security definer` della 001.

## cell_maps
| Campo | Tipo | Note |
|---|---|---|
| campaign_id | uuid PK, FK → campaigns | `ON DELETE CASCADE`; una sola mappa a celle per campagna |
| cols | int | da 4 a 40 (`check`) |
| rows | int | da 4 a 30 (`check`) |
| cells | text | un carattere per cella, `cols * rows` caratteri (`check`); alfabeto `.fwda` (`check`) |
| active | boolean | default `true`; `false` = si mostra l'immagine di `maps` |
| updated_at | timestamptz | default `now()`, aggiornato a ogni modifica |

**Codifica delle celle**: indice = `row * cols + col`, a partire da 0 in alto a sinistra.

| Carattere | Tipo di cella | Aspetto (indicativo) |
|---|---|---|
| `.` | vuoto | sfondo del tavolo `#0d1a1f` |
| `f` | pavimento | `#6d6248` |
| `w` | muro | `#1a2226` con bordo chiaro |
| `d` | porta | `#a8743a` con segno marcato |
| `a` | acqua | `#2f6f8f` con onda leggera |

## Permessi (RLS)
| Operazione | Chi | Come |
|---|---|---|
| Leggere | membro della campagna | policy `select` con `is_member(campaign_id)` |
| Creare, modificare, eliminare | DM della campagna | policy `insert/update/delete` con `is_dm(campaign_id)` |

Le funzioni `paint_cells` e `resize_cell_map` sono `security invoker`: girano con i permessi di chi le chiama, quindi un
Player ottiene 0 righe modificate esattamente come con una richiesta diretta (SC-003).

## Relazioni con le tabelle esistenti
- **maps** (immagine) resta com'è. Mostrata solo se non esiste una `cell_maps` attiva.
- **tokens** non cambia struttura: restano in celle (`col`, `row`) con `>= 0`. `resize_cell_map` li riporta dentro il
  bordo con `least(col, cols - 1)` e `least("row", rows - 1)`.

## Stati e transizioni
- **assente** → `insert` (DM) → **attiva** (celle vuote).
- **attiva** ⇄ **disattiva** (`active`): non perde le celle; l'altra mappa (immagine) resta intatta.
- **attiva/disattiva** → `delete` (DM, dopo conferma) → **assente**; l'immagine, se c'è, torna visibile.
- Cambio dimensione: **attiva** → `resize_cell_map` → **attiva**, con token riportati dentro il bordo.

## Regole di validazione (da FR)
- Dimensioni fuori da 4..40 × 4..30 → rifiutate dai `check` (FR-001).
- Un carattere fuori da `.fwda` o una lunghezza diversa da `cols * rows` → rifiutati dai `check` (FR-002).
- Un indice fuori mappa in un patch → errore `cell_out_of_range` da `paint_cells`.
