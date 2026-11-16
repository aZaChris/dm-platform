# Data Model: Tavolo base

Tutte le tabelle hanno RLS attiva. `is_member(c)` e `is_dm(c)` sono funzioni `security definer`
che leggono `campaign_members`.

## campaigns
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | default `gen_random_uuid()` |
| name | text | 1-80 caratteri |
| created_by | uuid | utente creatore |
| created_at | timestamptz | default `now()` |

## campaign_members
| Campo | Tipo | Note |
|---|---|---|
| campaign_id | uuid FK → campaigns | ON DELETE CASCADE |
| user_id | uuid FK → auth.users | |
| role | enum `dm` \| `player` | |
| display_name | text | copiato dai metadati/email all'ingresso |
| joined_at | timestamptz | |

PK `(campaign_id, user_id)`. Nessuna campagna senza un DM: la riga DM nasce in `create_campaign`.

## invites
| Campo | Tipo | Note |
|---|---|---|
| token | uuid PK | default `gen_random_uuid()` |
| campaign_id | uuid FK | ON DELETE CASCADE |
| created_by | uuid | |
| expires_at | timestamptz | default `now() + 7 days` |
| used_at / used_by | timestamptz / uuid | null finché non riscattato |

Stati: **valido** (`used_at` null e non scaduto) → **usato** | **scaduto**.

## maps
| Campo | Tipo | Note |
|---|---|---|
| campaign_id | uuid PK, FK | una sola mappa attiva per campagna |
| image_path | text | percorso nel bucket `maps` |
| updated_at | timestamptz | |

## tokens
| Campo | Tipo | Note |
|---|---|---|
| id | uuid PK | |
| campaign_id | uuid FK | ON DELETE CASCADE; `REPLICA IDENTITY FULL` |
| name | text | 1-40 caratteri |
| color | text | esadecimale `#rrggbb` |
| col, row | int | ≥ 0, posizione in celle |
| owner_id | uuid null | null = del DM; altrimenti il Player assegnato |
| created_at | timestamptz | |

## Matrice permessi (RLS)

| Tabella | select | insert | update | delete |
|---|---|---|---|---|
| campaigns | membro | solo via `create_campaign` | DM | DM |
| campaign_members | membro | solo via funzioni | nessuno | DM (non la propria riga) |
| invites | DM | DM | solo via `join_campaign` | DM |
| maps | membro | DM | DM | DM |
| tokens | membro | DM | DM, oppure Player con `owner_id = auth.uid()` | DM |
| storage `maps` | membro (dal percorso) | DM | DM | DM |

## Validazioni dalla spec

| Requisito | Dove si applica |
|---|---|
| FR-004 solo membri | policy `select` su tutte le tabelle e su Storage |
| FR-005 solo DM carica mappa | policy `maps` + policy Storage |
| FR-008 Player solo propri token | policy `update` su `tokens` |
| FR-012 formato e peso | limiti del bucket `maps` (5 MB, jpeg/png/webp) |
| FR-013 rimozione Player | delete su `campaign_members` consentito al DM |
| Bordo mappa | `check (col >= 0 and row >= 0)` nel DB; limite superiore nel client (`clampToMap`) |
