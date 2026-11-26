# Data model: Griglia esagonale (006)

## `maps` (modificata)

| Colonna | Tipo | Regole |
|---|---|---|
| `grid` | text | `not null default 'square'`, `check (grid in ('square','hex'))` |

Permessi invariati: leggono i membri, scrive solo il DM. Caricare una nuova immagine non cambia `grid`.

## Griglia effettiva

Esagonale solo se la mappa mostrata è l'immagine e `maps.grid = 'hex'`. Con la mappa a celle attiva è quadrata (FR-008).

## Token

Invariato: `col`, `row`.
