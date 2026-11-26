import { describe, expect, it } from 'vitest'
import esempio from './__fixtures__/roll20-esempio.json'
import { ERRORE_FORMATO, fromRoll20 } from './roll20'
import { attackBonus, initiative, saveBonus, skillBonus, spellAttack, spellDc } from './character'

// Export reale anonimizzato (paladino di 10° livello): la scheda importata deve dare gli stessi numeri di Roll20.
describe('fromRoll20', () => {
  const [{ name, data: d }] = fromRoll20(esempio)

  it('identità, caratteristiche e combattimento', () => {
    expect(name).toBe('Eroe di Prova')
    expect(d.classes).toEqual([{ name: 'Paladin', subclass: '', level: 10 }])
    expect(d.abilities).toEqual({ str: 18, dex: 12, con: 16, int: 11, wis: 10, cha: 18 })
    expect(d.ac).toBe(16)
    expect(d.hp).toEqual({ max: 93, current: 52, temp: 0 })
    expect(d.speed).toBe('10,5 m')
    expect(initiative(d)).toBe(1)
  })

  it('tiri salvezza e abilità come su Roll20', () => {
    expect(['str', 'dex', 'con', 'int', 'wis', 'cha'].map((a) => saveBonus(d, a as 'str'))).toEqual([8, 5, 7, 4, 8, 12])
    expect(skillBonus(d, 'athletics')).toBe(8)
    expect(skillBonus(d, 'intimidation')).toBe(8)
    expect(skillBonus(d, 'insight')).toBe(4)
    expect(skillBonus(d, 'perception')).toBe(0)
    expect(d.skills.athletics).toEqual({ prof: 1, bonus: 0 })
  })

  it('incantesimi: CD, attacco, slot tutti liberi', () => {
    expect(spellDc(d)).toBe(16)
    expect(spellAttack(d)).toBe(8)
    expect(d.slots).toEqual({ '1': { max: 4, used: 0 }, '2': { max: 3, used: 0 }, '3': { max: 2, used: 0 } })
    expect(d.spells).toHaveLength(2)
    expect(d.spells[0]).toMatchObject({ level: 1, components: 'V, S, M', concentration: true })
  })

  it('attacchi con lo stesso bonus per colpire; la cura senza tiro', () => {
    const [cura, , martello] = d.attacks
    expect(cura.tohit).toBe(false)
    expect(martello.tohit).toBe(true)
    expect(attackBonus(d, martello)).toBe(8)
    expect(martello.damage).toBe('1d8+4')
  })

  it('risorse, oggetti, privilegi, competenze e note importate', () => {
    expect(d.resources[0]).toMatchObject({ current: 30, max: 50, reset: 'long' })
    expect(d.items).toHaveLength(5)
    expect(d.features).toHaveLength(3)
    expect(d.proficiencies.languages).toBe('Comune, Elfico')
    expect(d.coins).toEqual({ cp: 0, sp: 17, ep: 0, gp: 1, pp: 6 })
    expect(d.notes_import.map((n) => n.name)).toContain('Punti eroe')
  })

  it('più personaggi in un array', () => {
    expect(fromRoll20([esempio, esempio])).toHaveLength(2)
  })

  it('rifiuta un file che non è una scheda', () => {
    for (const x of [{}, 'testo', [], { attribs: [] }, null]) expect(() => fromRoll20(x)).toThrow(ERRORE_FORMATO)
  })
})
