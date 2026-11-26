import { describe, expect, it } from 'vitest'
import { applyHp, initiative, mod, passivePerception, profBonus, saveBonus, setTempHp, skillBonus, spellDc, totalLevel, withDefaults } from './character'

const ladra = withDefaults({
  classes: [{ name: 'Ladra', subclass: '', level: 3 }],
  abilities: { str: 8, dex: 16, con: 12, int: 10, wis: 14, cha: 10 },
  skills: { stealth: { prof: 1, bonus: 0 }, perception: { prof: 1, bonus: 0 } },
})

describe('valori calcolati', () => {
  it('modificatore', () => {
    expect([1, 10, 11, 16, 30].map(mod)).toEqual([-5, 0, 0, 3, 10])
  })
  it('bonus di competenza per livello', () => {
    expect([1, 4, 5, 11, 17, 20].map(profBonus)).toEqual([2, 2, 3, 4, 6, 6])
  })
  it('abilità con competenza e con maestria', () => {
    expect(skillBonus(ladra, 'stealth')).toBe(5)
    expect(skillBonus(withDefaults({ ...ladra, skills: { stealth: { prof: 2, bonus: 0 } } }), 'stealth')).toBe(7)
    expect(skillBonus(ladra, 'athletics')).toBe(-1)
  })
  it('tiro salvezza con competenza, bonus manuale e bonus globale', () => {
    const p = withDefaults({ ...ladra, saves: { dex: { prof: true, bonus: 1 } }, save_bonus_all: 2 })
    expect(saveBonus(p, 'dex')).toBe(3 + 2 + 1 + 2)
    expect(saveBonus(p, 'str')).toBe(-1 + 2)
  })
  it('iniziativa e percezione passiva', () => {
    expect(initiative(withDefaults({ ...ladra, initiative_bonus: 2 }))).toBe(5)
    expect(passivePerception(ladra)).toBe(10 + 2 + 2)
  })
  it('CD degli incantesimi', () => {
    const mago = withDefaults({ classes: [{ name: 'Mago', subclass: '', level: 5 }], abilities: { ...ladra.abilities, int: 18 }, spellcasting: { ability: 'int', bonus: 0 } })
    expect(spellDc(mago)).toBe(15)
    expect(spellDc(ladra)).toBeNull()
  })
  it('multiclasse: la competenza viene dal livello totale', () => {
    const m = withDefaults({ classes: [{ name: 'Guerriero', subclass: '', level: 3 }, { name: 'Ladro', subclass: '', level: 2 }] })
    expect(totalLevel(m)).toBe(5)
    expect(profBonus(totalLevel(m))).toBe(3)
  })
})

describe('punti ferita', () => {
  it('il danno consuma prima i temporanei', () => {
    expect(applyHp({ max: 31, current: 22, temp: 5 }, -8)).toEqual({ max: 31, current: 19, temp: 0 })
  })
  it('il danno non scende sotto zero e la cura non supera il massimo', () => {
    expect(applyHp({ max: 31, current: 4, temp: 0 }, -10).current).toBe(0)
    expect(applyHp({ max: 31, current: 25, temp: 0 }, 20).current).toBe(31)
  })
  it('i temporanei non si sommano', () => {
    expect(setTempHp({ max: 10, current: 10, temp: 6 }, 4).temp).toBe(6)
    expect(setTempHp({ max: 10, current: 10, temp: 2 }, 4).temp).toBe(4)
  })
})
