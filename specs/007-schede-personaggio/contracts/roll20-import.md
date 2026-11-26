# Contratto: file Roll20 → scheda

Funzione pura `fromRoll20(json: unknown): { name: string; data: CharacterData }[]` in `app/src/lib/roll20.ts`,
testata su `app/src/lib/__fixtures__/roll20-esempio.json` (export reale **anonimizzato**: nome, storia, testi di
incantesimi e privilegi sostituiti; numeri e struttura intatti). Il file reale resta in `import/roll20/`, esclusa
da git. Lancia `ERRORE_FORMATO` se il file non è riconosciuto (FR-013).

L'import dà un **punto di partenza**, non una copia 1:1 di Roll20: la scheda resta tutta modificabile (decisione di
Christian, 2026-11-26).

## Formato supportato (verificato sul primo file reale, 2026-11-26)

Export strutturato della scheda «D&D 5e OGL» di Roll20 (`meta.sheet_version` 4.21): un oggetto, o un array di
oggetti, con le sezioni `meta`, `identity`, `abilities`, `skills`, `combat`, `spellcasting`, `resources`,
`currency`, `attacks`, `spells`, `inventory`, `traits`, `proficiencies`, `tools`, `global_modifiers`,
`raw_attributes`. Basta che ci siano `identity` e `abilities`.

Il formato di VTT Enhancement Suite (`attribs[]` con nomi come `repeating_attack_<id>_atkname`) **non è ancora
supportato**: si aggiunge quando arriva il primo file di quel tipo (`ponytail:` in `roll20.ts`).

## Mappatura

| Sorgente | Campo della scheda | Note |
|---|---|---|
| `identity.character_name` | `name` | tagliato a 60 caratteri |
| `identity.class`, `identity.level` | `classes[0]` | livello 1-20 |
| `identity.race` + `subrace`, `alignment`, `backstory` | identità e testi | |
| `identity.age`, `height`, `weight`, `eyes`, `skin`, `hair`, `size` | `details` | testo libero |
| `abilities.<car>.score` | `abilities` | 1-30 |
| `abilities.<car>.save_proficient` | `saves.<car>.prof` | |
| `combat.global_save_bonus` | `save_bonus_all` | es. Aura di Protezione: +CAR a tutti i TS |
| `skills.<abilità>` (totale) | `skills.<abilità>` | competenza = `round((totale − mod) / competenza)`, il resto in `bonus` |
| `combat.armor_class`, `speed` | `ac`, `speed` | la velocità resta testo («10,5 m») |
| `combat.initiative_bonus` (totale) | `initiative_bonus` | si toglie il modificatore di Destrezza |
| `combat.hit_points.current/max/temporary` | `hp` | |
| `combat.hit_dice.current/max/type` | `hit_dice[0]` | `used = max − current` |
| `combat.death_saves` | `death_saves` | si contano le caselle spuntate |
| `combat.inspiration` | `inspiration` | |
| `spellcasting.ability`, `save_dc` | `spellcasting` | il bonus è ciò che la CD non spiega |
| `spellcasting.slots.level_N.total` | `slots.N.max` | **`used = 0`: all'import tutti liberi** (decisione di Christian) |
| `spells.level_N[]`, `spells.cantrip[]` | `spells[]` | con scuola, tempo, gittata, componenti, durata, concentrazione, rituale, descrizione |
| `attacks[]` | `attacks[]` | `attack_bonus` «-» = niente tiro (`tohit: false`); altrimenti il bonus è ciò che caratteristica e competenza non spiegano |
| `resources[]` | `resources[]` | attuale, massimo, ricarica |
| `currency` | `coins` | `null` → 0 |
| `inventory[]` | `items[]` | quantità, peso, equipaggiato |
| `traits[]` | `features[]` | `source_type` come fonte |
| `proficiencies[]` | `proficiencies` | ARMA → armi, ARMATURA → armature, LINGUAGGIO → lingue, altro → strumenti |
| `tools[]`, `global_modifiers`, `combat.extra_save_bonuses`, `combat.hero_points`, `identity.creature_type` | `notes_import[]` | non ancora rappresentati nella scheda (FR-011) |
| `raw_attributes`, `meta`, valori calcolati (`*_mod`, `proficiency_bonus`, `passive_wisdom`) | — | ricalcolati dalla scheda (research, punto 3) |

## Verifica

`roll20.test.ts` controlla che la scheda importata dia gli stessi numeri di Roll20: tiri salvezza 8/5/7/4/8/12,
Atletica +8, CD 16, attacco con incantesimi +8, Martello da guerra +8.
