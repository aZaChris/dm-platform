// Scheda personaggio D&D 5e (feature 007): tipi, default e valori calcolati.
// Nella scheda si salvano solo i dati di base; tutto ciò che si ricava (modificatori, competenza, abilità, CD)
// si calcola qui, così non diventa mai incoerente. Forma dei dati: specs/007-schede-personaggio/data-model.md.

export const ABILITIES = [
  { key: 'str', nome: 'Forza', breve: 'FOR' },
  { key: 'dex', nome: 'Destrezza', breve: 'DES' },
  { key: 'con', nome: 'Costituzione', breve: 'COS' },
  { key: 'int', nome: 'Intelligenza', breve: 'INT' },
  { key: 'wis', nome: 'Saggezza', breve: 'SAG' },
  { key: 'cha', nome: 'Carisma', breve: 'CAR' },
] as const
export type Ability = (typeof ABILITIES)[number]['key']

export const SKILLS = [
  { key: 'acrobatics', nome: 'Acrobazia', ab: 'dex' },
  { key: 'animal_handling', nome: 'Addestrare animali', ab: 'wis' },
  { key: 'arcana', nome: 'Arcano', ab: 'int' },
  { key: 'athletics', nome: 'Atletica', ab: 'str' },
  { key: 'deception', nome: 'Inganno', ab: 'cha' },
  { key: 'history', nome: 'Storia', ab: 'int' },
  { key: 'insight', nome: 'Intuizione', ab: 'wis' },
  { key: 'intimidation', nome: 'Intimidire', ab: 'cha' },
  { key: 'investigation', nome: 'Indagare', ab: 'int' },
  { key: 'medicine', nome: 'Medicina', ab: 'wis' },
  { key: 'nature', nome: 'Natura', ab: 'int' },
  { key: 'perception', nome: 'Percezione', ab: 'wis' },
  { key: 'performance', nome: 'Intrattenere', ab: 'cha' },
  { key: 'persuasion', nome: 'Persuasione', ab: 'cha' },
  { key: 'religion', nome: 'Religione', ab: 'int' },
  { key: 'sleight_of_hand', nome: 'Rapidità di mano', ab: 'dex' },
  { key: 'stealth', nome: 'Furtività', ab: 'dex' },
  { key: 'survival', nome: 'Sopravvivenza', ab: 'wis' },
] as const satisfies readonly { key: string; nome: string; ab: Ability }[]
export type Skill = (typeof SKILLS)[number]['key']

export type Hp = { max: number; current: number; temp: number }
export type Attack = { id: string; name: string; tohit: boolean; ability: Ability | null; prof: boolean; bonus: number; damage: string; range: string } // tohit false = niente tiro per colpire (es. una cura)
export type Spell = {
  id: string; name: string; level: number; prepared: boolean
  school: string; casting_time: string; range: string; components: string; duration: string
  concentration: boolean; ritual: boolean; description: string
}
export type Resource = { id: string; name: string; current: number; max: number; reset: string }
export type Item = { id: string; name: string; qty: number; weight: string; equipped: boolean; notes: string }
export type Feature = { id: string; name: string; source: string; text: string }
export type SlotLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'

export type CharacterData = {
  classes: { name: string; subclass: string; level: number }[]
  race: string; background: string; alignment: string; xp: number
  details: { age: string; height: string; weight: string; eyes: string; skin: string; hair: string; size: string }
  abilities: Record<Ability, number>
  saves: Partial<Record<Ability, { prof: boolean; bonus: number }>>
  save_bonus_all: number // bonus a tutti i tiri salvezza (es. Aura di Protezione del paladino)
  skills: Partial<Record<Skill, { prof: 0 | 1 | 2; bonus: number }>> // 0 nessuna, 1 competenza, 2 maestria
  ac: number; speed: string; initiative_bonus: number; inspiration: number
  hp: Hp
  hit_dice: { die: number; total: number; used: number }[]
  death_saves: { success: number; fail: number }
  attacks: Attack[]
  resources: Resource[]
  spellcasting: { ability: Ability | null; bonus: number }
  slots: Partial<Record<SlotLevel, { max: number; used: number }>>
  spells: Spell[]
  coins: { cp: number; sp: number; ep: number; gp: number; pp: number }
  items: Item[]
  features: Feature[]
  proficiencies: { armor: string; weapons: string; tools: string; languages: string }
  traits: string; ideals: string; bonds: string; flaws: string
  appearance: string; backstory: string; notes: string
  notes_import: { name: string; current: string; max: string }[]
}

const vuota = (): CharacterData => ({
  classes: [], race: '', background: '', alignment: '', xp: 0,
  details: { age: '', height: '', weight: '', eyes: '', skin: '', hair: '', size: '' },
  abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  saves: {}, save_bonus_all: 0, skills: {},
  ac: 10, speed: '9 m', initiative_bonus: 0, inspiration: 0,
  hp: { max: 1, current: 1, temp: 0 },
  hit_dice: [], death_saves: { success: 0, fail: 0 },
  attacks: [], resources: [],
  spellcasting: { ability: null, bonus: 0 }, slots: {}, spells: [],
  coins: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
  items: [], features: [],
  proficiencies: { armor: '', weapons: '', tools: '', languages: '' },
  traits: '', ideals: '', bonds: '', flaws: '', appearance: '', backstory: '', notes: '',
  notes_import: [],
})

// Riempie i campi assenti: una scheda nuova è {} nel database. Unisce un livello sotto per gli oggetti fissi.
export function withDefaults(data: Partial<CharacterData> | null | undefined): CharacterData {
  const d = vuota()
  const src = (data ?? {}) as Record<string, unknown>
  const out = { ...d, ...src } as Record<string, unknown>
  for (const k of ['details', 'abilities', 'hp', 'death_saves', 'spellcasting', 'coins', 'proficiencies'] as const) {
    out[k] = { ...(d[k] as object), ...((src[k] as object) ?? {}) }
  }
  return out as CharacterData
}

export const mod = (score: number) => Math.floor((score - 10) / 2)
export const formatMod = (n: number) => (n >= 0 ? `+${n}` : `−${-n}`)
export const totalLevel = (d: CharacterData) => Math.max(1, d.classes.reduce((s, c) => s + (c.level || 0), 0))
export const profBonus = (level: number) => 2 + Math.floor((Math.min(Math.max(level, 1), 20) - 1) / 4)
const pb = (d: CharacterData) => profBonus(totalLevel(d))

export const abilityMod = (d: CharacterData, ab: Ability) => mod(d.abilities[ab])
export const saveBonus = (d: CharacterData, ab: Ability) => {
  const s = d.saves[ab]
  return abilityMod(d, ab) + (s?.prof ? pb(d) : 0) + (s?.bonus ?? 0) + d.save_bonus_all
}
export const skillBonus = (d: CharacterData, sk: Skill) => {
  const ab = SKILLS.find((s) => s.key === sk)!.ab
  const s = d.skills[sk]
  return abilityMod(d, ab) + pb(d) * (s?.prof ?? 0) + (s?.bonus ?? 0)
}
export const initiative = (d: CharacterData) => abilityMod(d, 'dex') + d.initiative_bonus
export const passivePerception = (d: CharacterData) => 10 + skillBonus(d, 'perception')
export const attackBonus = (d: CharacterData, a: Attack) => (a.ability ? abilityMod(d, a.ability) : 0) + (a.prof ? pb(d) : 0) + a.bonus
export const spellDc = (d: CharacterData) => d.spellcasting.ability ? 8 + pb(d) + abilityMod(d, d.spellcasting.ability) + d.spellcasting.bonus : null
export const spellAttack = (d: CharacterData) => d.spellcasting.ability ? pb(d) + abilityMod(d, d.spellcasting.ability) + d.spellcasting.bonus : null
export const classLabel = (d: CharacterData) => d.classes.map((c) => `${c.name} ${c.level}`).join(' / ') || 'Senza classe'

// PF: un danno consuma prima i temporanei e non scende sotto 0; una cura non supera il massimo.
export function applyHp(hp: Hp, delta: number): Hp {
  if (delta >= 0) return { ...hp, current: Math.min(hp.max, hp.current + delta) }
  let danno = -delta
  const temp = Math.max(0, hp.temp - danno)
  danno -= hp.temp - temp
  return { ...hp, temp, current: Math.max(0, hp.current - danno) }
}
// I PF temporanei non si sommano: si tiene il valore più alto (regola 5e).
export const setTempHp = (hp: Hp, n: number): Hp => ({ ...hp, temp: Math.max(hp.temp, Math.max(0, n)) })

export const newId = () => Math.random().toString(36).slice(2, 10)
