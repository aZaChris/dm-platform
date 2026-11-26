// Import da Roll20 (feature 007): file JSON del personaggio → scheda.
// Formato supportato: l'export strutturato della scheda "D&D 5e OGL" (meta, identity, abilities, skills, combat…),
// quello del primo file reale del gruppo. La scheda è modificabile: l'import dà un punto di partenza, non una copia 1:1.
// ponytail: il formato di VTT Enhancement Suite (attribs[]) si aggiunge quando arriva il primo file di quel tipo.
import { mod, newId, profBonus, withDefaults, type Ability, type CharacterData, type Skill, SKILLS } from './character'

export const ERRORE_FORMATO = 'File non riconosciuto: serve l\'export JSON di una scheda Roll20 D&D 5e.'

type Obj = Record<string, unknown>
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, d = 0) => {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').replace(',', '.').replace(/^\+/, ''))
  return Number.isFinite(n) ? n : d
}
const str = (v: unknown) => (v == null ? '' : String(v))
const arr = (v: unknown): Obj[] => (Array.isArray(v) ? v.filter(isObj) : [])

const AB: Record<string, Ability> = {
  strength: 'str', dexterity: 'dex', constitution: 'con', intelligence: 'int', wisdom: 'wis', charisma: 'cha',
}

export type Importato = { name: string; data: CharacterData }

// Accetta un personaggio o un array di personaggi; lancia ERRORE_FORMATO se il file non è quello atteso.
export function fromRoll20(json: unknown): Importato[] {
  const lista = Array.isArray(json) ? json : [json]
  if (lista.length === 0) throw new Error(ERRORE_FORMATO)
  return lista.map((p) => {
    if (!isObj(p) || !isObj(p.identity) || !isObj(p.abilities)) throw new Error(ERRORE_FORMATO)
    return converti(p)
  })
}

function converti(p: Obj): Importato {
  const id = p.identity as Obj
  const abil = p.abilities as Obj
  const combat = isObj(p.combat) ? p.combat : {}
  const notes: CharacterData['notes_import'] = []
  const nota = (name: string, current: unknown, max: unknown = '') => notes.push({ name, current: str(current), max: str(max) })

  const livello = Math.min(20, Math.max(1, num(id.level, 1)))
  const pb = profBonus(livello)
  const abilities = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
  const saves: CharacterData['saves'] = {}
  for (const [nome, k] of Object.entries(AB)) {
    const a = isObj(abil[nome]) ? (abil[nome] as Obj) : {}
    abilities[k] = Math.min(30, Math.max(1, num(a.score, 10)))
    if (a.save_proficient === true) saves[k] = { prof: true, bonus: 0 }
  }

  // Le abilità arrivano come totale: competenza e bonus si ricavano togliendo il modificatore.
  const skillsIn = isObj(p.skills) ? p.skills : {}
  const skills: CharacterData['skills'] = {}
  for (const s of SKILLS) {
    if (!(s.key in skillsIn)) continue
    const extra = num(skillsIn[s.key]) - mod(abilities[s.ab])
    const prof = Math.min(2, Math.max(0, Math.round(extra / pb))) as 0 | 1 | 2
    const bonus = extra - prof * pb
    if (prof || bonus) skills[s.key as Skill] = { prof, bonus }
  }

  const sc = isObj(p.spellcasting) ? p.spellcasting : {}
  const castAb = AB[str(sc.ability)] ?? null
  const slotsIn = isObj(sc.slots) ? sc.slots : {}
  const slots: CharacterData['slots'] = {}
  for (let n = 1; n <= 9; n++) {
    const s = slotsIn[`level_${n}`]
    const max = isObj(s) ? num(s.total) : 0
    if (max > 0) slots[String(n) as '1'] = { max, used: 0 } // all'import tutti liberi (scelta di Christian)
  }

  const spellsIn = isObj(p.spells) ? p.spells : {}
  const spells: CharacterData['spells'] = []
  for (const [chiave, lista] of Object.entries(spellsIn)) {
    const level = chiave === 'cantrip' ? 0 : num(chiave.replace('level_', ''))
    for (const s of arr(lista)) {
      const c = isObj(s.components) ? s.components : {}
      spells.push({
        id: newId(), name: str(s.name), level, prepared: true,
        school: str(s.school), casting_time: str(s.casting_time), range: str(s.range),
        components: [c.verbal && 'V', c.somatic && 'S', c.material && 'M'].filter(Boolean).join(', '),
        duration: str(s.duration), concentration: s.concentration === true, ritual: s.ritual === true,
        description: [str(s.materials), str(s.description)].filter(Boolean).join('\n\n'),
      })
    }
  }

  // Attacco: il totale per colpire resta quello di Roll20; ciò che non spiegano caratteristica e competenza va nel bonus.
  const attacks: CharacterData['attacks'] = arr(p.attacks).map((a) => {
    const tohit = str(a.attack_bonus).trim()
    const ab = str(a.attack_ability) === 'spell' ? castAb : (AB[str(a.attack_ability)] ?? null)
    const prof = a.proficient === true
    const base = (ab ? mod(abilities[ab]) : 0) + (prof ? pb : 0)
    const hasRoll = /^[+-]?\d+$/.test(tohit)
    return {
      id: newId(), name: str(a.name), ability: hasRoll ? ab : null, prof: hasRoll && prof,
      bonus: hasRoll ? num(tohit) - (hasRoll ? base : 0) : 0, tohit: hasRoll,
      damage: str(a.damage ?? a.damage_dice), range: str(a.range),
    }
  })

  const hp = isObj(combat.hit_points) ? combat.hit_points : {}
  const hd = isObj(combat.hit_dice) ? combat.hit_dice : null
  const death = isObj(combat.death_saves) ? combat.death_saves : {}
  const conta = (v: unknown) => (Array.isArray(v) ? v.filter((x) => x === 1 || x === true || x === 'on').length : 0)

  const cur = isObj(p.currency) ? p.currency : {}
  const profs = { armor: [] as string[], weapons: [] as string[], tools: [] as string[], languages: [] as string[] }
  for (const pr of arr(p.proficiencies)) {
    const t = str(pr.type).toUpperCase()
    const dove = t.startsWith('ARMA') && t !== 'ARMATURA' ? 'weapons' : t === 'ARMATURA' ? 'armor' : t.startsWith('LING') ? 'languages' : 'tools'
    profs[dove].push(str(pr.name))
  }

  // Ciò che la scheda non sa ancora rappresentare resta nelle note importate (FR-011).
  for (const t of arr(p.tools)) nota('Strumento', `${str(t.ability)} ${str(t.bonus)}`)
  const gm = isObj(p.global_modifiers) ? p.global_modifiers : {}
  for (const [tipo, lista] of Object.entries(gm)) for (const m of arr(lista)) nota(`Modificatore ${tipo}: ${str(m.name)}`, [m.roll, m.type].filter(Boolean).join(' '))
  if (isObj(combat.extra_save_bonuses)) for (const [k, v] of Object.entries(combat.extra_save_bonuses)) nota(`Bonus tiro salvezza ${k}`, v)
  if (combat.hero_points != null) nota('Punti eroe', combat.hero_points)
  if (id.creature_type) nota('Tipo di creatura', id.creature_type)

  const d = withDefaults({
    classes: [{ name: str(id.class), subclass: '', level: livello }],
    race: [str(id.race), str(id.subrace)].filter(Boolean).join(' '),
    alignment: str(id.alignment),
    details: { age: str(id.age), height: str(id.height), weight: str(id.weight), eyes: str(id.eyes), skin: str(id.skin), hair: str(id.hair), size: str(id.size) },
    abilities, saves, skills,
    save_bonus_all: num(combat.global_save_bonus),
    ac: num(combat.armor_class, 10),
    speed: str(combat.speed) || '9 m',
    initiative_bonus: num(combat.initiative_bonus) - mod(abilities.dex),
    inspiration: num(combat.inspiration),
    hp: { max: Math.max(1, num(hp.max, 1)), current: num(hp.current, num(hp.max, 1)), temp: num(hp.temporary) },
    hit_dice: hd ? [{ die: num(str(hd.type).replace(/\D/g, ''), 8), total: num(hd.max), used: num(hd.max) - num(hd.current) }] : [],
    death_saves: { success: conta(death.successes), fail: conta(death.failures) },
    attacks,
    resources: arr(p.resources).map((r) => ({ id: newId(), name: str(r.name), current: num(r.current), max: num(r.max), reset: str(r.reset) })),
    spellcasting: { ability: castAb, bonus: castAb && sc.save_dc != null ? num(sc.save_dc) - (8 + pb + mod(abilities[castAb])) : 0 },
    slots, spells,
    coins: { cp: num(cur.cp), sp: num(cur.sp), ep: num(cur.ep), gp: num(cur.gp), pp: num(cur.pp) },
    items: arr(p.inventory).map((x) => ({ id: newId(), name: str(x.name), qty: num(x.count, 1), weight: str(x.weight), equipped: x.equipped === true, notes: '' })),
    features: arr(p.traits).map((t) => ({ id: newId(), name: str(t.name), source: str(t.source_type || t.source), text: str(t.description) })),
    proficiencies: { armor: profs.armor.join(', '), weapons: profs.weapons.join(', '), tools: profs.tools.join(', '), languages: profs.languages.join(', ') },
    backstory: str(id.backstory),
    notes_import: notes,
  })
  return { name: (str(id.character_name) || 'Senza nome').slice(0, 60), data: d }
}
