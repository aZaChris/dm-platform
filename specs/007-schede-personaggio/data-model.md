# Data model: Schede personaggio (007)

## Tabella `characters`

| Colonna | Tipo | Regole |
|---|---|---|
| `id` | uuid, chiave | `gen_random_uuid()` |
| `campaign_id` | uuid → `campaigns.id` | `on delete cascade`; non modificabile dopo la creazione (trigger) |
| `owner_id` | uuid → `auth.users.id` | `on delete set null`; `null` = scheda del DM; la cambia solo il DM (trigger) |
| `token_id` | uuid → `tokens.id`, unico | `on delete set null` (FR-014: eliminare il token non elimina la scheda); lo cambia solo il DM; il token MUST essere della stessa campagna |
| `name` | text | 1–60 caratteri; è il nome mostrato nell'elenco e nei tiri |
| `data` | jsonb | oggetto (`jsonb_typeof = 'object'`), al massimo 256 KB (`pg_column_size`) |
| `created_at`, `updated_at` | timestamptz | `updated_at` lo aggiorna `patch_character` |

Indici: `(campaign_id)`; `token_id` unico (un token ha al più una scheda).

### Permessi (RLS)

| Azione | Chi |
|---|---|
| select | ogni membro della campagna (`is_member`) |
| insert | il DM per chiunque della campagna; un giocatore solo con `owner_id = auth.uid()` e `token_id` nullo |
| update | il DM, o il proprietario (`owner_id = auth.uid()`); il trigger blocca `owner_id`, `token_id`, `campaign_id` a chi non è DM |
| delete | il DM o il proprietario |

Il proprietario assegnato MUST essere membro della campagna (controllo nella policy di insert e nel trigger).

## Forma di `data`

Tutte le chiavi sono facoltative: un campo assente vale il suo default. Così una scheda nuova è `{}` e l'import
riempie solo ciò che trova.

```ts
type CharacterData = {
  // Identità
  classes: { name: string; subclass?: string; level: number }[] // multiclasse; livello totale = somma (1-20)
  race: string; background: string; alignment: string; xp: number
  details: { age; height; weight; eyes; skin; hair; size: string }   // aspetto, testo libero

  // Caratteristiche: punteggi 1-30
  abilities: { str: number; dex: number; con: number; int: number; wis: number; cha: number }
  saves: Partial<Record<Ability, { prof: boolean; bonus: number }>>          // bonus = correzione manuale
  skills: Partial<Record<Skill, { prof: 0 | 1 | 2; bonus: number }>>         // 0 nessuna, 1 competenza, 2 maestria
  save_bonus_all: number                                                     // bonus a tutti i TS (es. Aura di Protezione)

  // Combattimento
  ac: number; speed: string; initiative_bonus: number; inspiration: number   // velocità come testo: «9 m», «30 ft»
  hp: { max: number; current: number; temp: number }
  hit_dice: { die: 6 | 8 | 10 | 12; total: number; used: number }[]
  death_saves: { success: 0 | 1 | 2 | 3; fail: 0 | 1 | 2 | 3 }
  attacks: { id: string; name: string; tohit: boolean; ability: Ability | null; prof: boolean; bonus: number; damage: string; range: string }[]  // tohit false = niente tiro per colpire (una cura)
  resources: { id: string; name: string; current: number; max: number; reset: string }[]  // es. Imposizione delle mani 30/50

  // Incantesimi
  spellcasting: { ability: Ability | null; bonus: number }
  slots: Partial<Record<'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9', { max: number; used: number }>>
  spells: { id: string; name: string; level: number; prepared: boolean; school: string; casting_time: string; range: string;
            components: string; duration: string; concentration: boolean; ritual: boolean; description: string }[]  // level 0 = trucchetto

  // Equipaggiamento e privilegi
  coins: { cp: number; sp: number; ep: number; gp: number; pp: number }
  items: { id: string; name: string; qty: number; weight: string; equipped: boolean; notes: string }[]
  features: { id: string; name: string; source: string; text: string }[]
  proficiencies: { armor: string; weapons: string; tools: string; languages: string }

  // Testi
  traits: string; ideals: string; bonds: string; flaws: string
  appearance: string; backstory: string; notes: string
  notes_import: { name: string; current: string; max: string }[]   // attributi Roll20 non riconosciuti (FR-011)
}
```

`Ability` = `str | dex | con | int | wis | cha`. `Skill` = le 18 abilità della 5e (acrobatics, animal_handling,
arcana, athletics, deception, history, insight, intimidation, investigation, medicine, nature, perception,
performance, persuasion, religion, sleight_of_hand, stealth, survival), ognuna con la sua caratteristica fissa.

Gli elementi delle liste hanno un `id` stabile (stringa breve generata nel client), così `patch_character` può
puntare a un elemento senza dipendere dall'indice. Le liste si riscrivono intere quando cambia l'ordine o si
aggiunge/toglie un elemento; i campi dentro un elemento si aggiornano con il loro percorso.

Campi aggiunti dopo il primo export reale di Roll20 (2026-11-26): `details`, `save_bonus_all`, `inspiration`,
`resources`, `tohit` e `range` degli attacchi, i dettagli degli incantesimi, peso ed equipaggiato degli oggetti;
`speed` è diventata testo.

## Valori calcolati (non salvati)

Funzioni pure in `app/src/lib/character.ts` (research, punto 3):

| Valore | Formula |
|---|---|
| modificatore | `floor((punteggio − 10) / 2)` |
| livello totale | somma dei livelli delle classi, minimo 1 |
| bonus di competenza | `2 + floor((livello totale − 1) / 4)` → +2 ai livelli 1-4, +6 ai livelli 17-20 |
| tiro salvezza | modificatore + (competenza se `prof`) + `bonus` + `save_bonus_all` |
| abilità | modificatore della sua caratteristica + competenza × `prof` (0, 1, 2) + `bonus` |
| iniziativa | modificatore di Destrezza + `initiative_bonus` |
| percezione passiva | 10 + abilità Percezione |
| attacco | modificatore della caratteristica (se indicata) + competenza (se `prof`) + `bonus` |
| CD incantesimi | 8 + competenza + modificatore della caratteristica da incantatore + `spellcasting.bonus` |
| attacco con incantesimi | competenza + modificatore della caratteristica da incantatore + `spellcasting.bonus` |

Regole di validazione nel client (FR, edge case): punteggi 1–30, livello per classe 1–20 e totale ≤ 20, PF massimi
≥ 1, slot usati tra 0 e il massimo, `qty` ≥ 0.

## Transizioni dei PF (FR-007)

Funzione pura `applyHp(hp, delta)`:
- **danno** (delta negativo): si toglie prima da `temp`, il resto da `current`; `current` non scende sotto 0.
- **cura** (delta positivo): sale `current` fino a `max`; non tocca `temp`.
- **PF temporanei**: si sostituiscono, non si sommano (regola 5e): si tiene il valore più alto.
- A `current = 0` la vista pratica mostra i tiri salvezza contro la morte; una cura li azzera.

## Relazioni

- `campaigns 1 — N characters`
- `auth.users 1 — N characters` (proprietario)
- `tokens 1 — 0..1 characters`: dal token si apre la scheda; il nome del token resta del token (la spec non chiede
  di sincronizzarli).
- `characters` → `rolls`: nessuna chiave; il tiro porta il nome del personaggio nell'etichetta.
