# Contratto: file Roll20 → scheda

Funzione pura `fromRoll20(json: unknown): { name: string; data: CharacterData }[]` in `app/src/lib/roll20.ts`,
testata su un file d'esempio. Lancia un errore leggibile se il file non è un export di VTT Enhancement Suite
(FR-013).

> **Da verificare sul primo JSON reale del gruppo.** I nomi qui sotto sono quelli della scheda «D&D 5E by Roll20»
> (2014) come li conosciamo; il primo file vero conferma o corregge questa tabella prima di scrivere il
> convertitore. I file reali stanno in `import/roll20/`, esclusa da git; il test usa una copia **anonimizzata**
> (nomi e testi sostituiti) in `app/src/lib/__fixtures__/`.

## Ingresso accettato

- Un oggetto personaggio: `{ name, bio?, gmnotes?, attribs: { name, current, max }[], abilities? }`.
- Un array di oggetti personaggio (più personaggi in un file).
- Più file scelti insieme: ogni file si legge per conto suo e i risultati si sommano.

Tutti i valori di `attribs` arrivano come stringhe: i numeri si convertono con `Number`, i vuoti diventano il
default.

## Mappatura

| Attributo Roll20 | Campo della scheda |
|---|---|
| `strength` … `charisma` | `abilities.str` … `abilities.cha` |
| `<caratteristica>_save_prof` (non vuoto / diverso da 0) | `saves.<car>.prof = true` |
| `<abilità>_prof` non vuoto + `<abilità>_type` (1 o 2) | `skills.<abilità>.prof` = 0, 1 o 2 |
| `class`, `subclass`, `base_level`; `multiclass1..3`, `multiclass1..3_subclass`, `multiclass1..3_lvl`, `multiclass1..3_flag` | `classes[]` |
| `race` (o `race_display`), `background`, `alignment`, `experience` | identità |
| `ac`, `speed`, `initiative_bonus` | combattimento |
| `hp` (`current` / `max`), `hp_temp` | `hp.current`, `hp.max`, `hp.temp` |
| `hit_dice` (`current`/`max`), `hitdietype` | `hit_dice[]` |
| `deathsave_succ1..3`, `deathsave_fail1..3` | `death_saves` |
| `repeating_attack_<id>_atkname`, `_atkattr_base`, `_atkprofflag`, `_atkmagic`, `_dmgbase`, `_dmgtype` | `attacks[]` |
| `spellcasting_ability` (es. `@{wisdom_mod}+`) | `spellcasting.ability` |
| `lvl1_slots_total` … `lvl9_slots_total`, `lvl1_slots_expended` … | `slots` (`used = max − expended`, la scheda Roll20 conta i liberi) |
| `repeating_spell-cantrip_<id>_spellname`, `repeating_spell-<n>_<id>_spellname`, `_spellprepared` | `spells[]` con `level` 0 o n |
| `cp`, `sp`, `ep`, `gp`, `pp` | `coins` |
| `repeating_inventory_<id>_itemname`, `_itemcount`, `_itemcontent` | `items[]` |
| `repeating_traits_<id>_name`, `_source`, `_description` | `features[]` |
| `repeating_proficiencies_<id>_name`, `_prof_type` | `proficiencies` (per tipo, unite con virgola) |
| `personality_traits`, `ideals`, `bonds`, `flaws` | testi |
| `bio` dell'oggetto, `backstory` | `backstory` |
| tutto il resto | `notes_import[]` con nome, `current`, `max` |

Si scartano senza salvarli i valori **calcolati** da Roll20 (`*_mod`, `*_bonus` delle abilità, `pb`,
`passive_wisdom`, `spell_save_dc`…): li ricalcola la scheda (research, punto 3). Un valore calcolato che non
coincide con il nostro calcolo finisce invece in `notes_import`, per segnalare un bonus che non abbiamo capito.

## Uscita

`name` = `name` dell'oggetto Roll20, tagliato a 60 caratteri. `data` = la forma di
[data-model.md](../data-model.md), con gli `id` delle liste generati nuovi.
