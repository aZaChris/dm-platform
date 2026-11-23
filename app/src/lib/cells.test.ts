import { describe, expect, it } from 'vitest'
import { applyPatch, floodFill, invertPatch, lineCells, type Patch } from './cells'

describe('floodFill', () => {
  it('riempie una stanza chiusa da muri e non esce', () => {
    // 5x3: colonna 2 è muro, parte a sinistra = 6 celle vuote
    const cells = '..w..' + '..w..' + '..w..'
    expect(floodFill(cells, 5, 3, 0, 'f').sort((a, b) => a - b)).toEqual([0, 1, 5, 6, 10, 11])
  })
  it('non esce dal bordo e non va a capo', () => {
    const r = floodFill('.'.repeat(12), 4, 3, 3, 'f')
    expect(r).toHaveLength(12)
  })
  it('stesso tipo = niente da fare', () => {
    expect(floodFill('ff..', 2, 2, 0, 'f')).toEqual([])
  })
})

describe('lineCells', () => {
  it('diagonale', () => {
    expect(lineCells(0, 0, 3, 3)).toEqual([[0, 0], [1, 1], [2, 2], [3, 3]])
  })
  it('un solo punto', () => {
    expect(lineCells(2, 2, 2, 2)).toEqual([[2, 2]])
  })
  it('orizzontale al contrario, senza buchi', () => {
    expect(lineCells(3, 1, 0, 1)).toEqual([[3, 1], [2, 1], [1, 1], [0, 1]])
  })
})

describe('invertPatch', () => {
  it('rimette i vecchi valori e la doppia inversione riporta al tratto', () => {
    const cells = '....'
    const tratto: Patch = [[0, 'w'], [3, 'a']]
    const dopo = applyPatch(cells, tratto)
    expect(dopo).toBe('w..a')
    const inverso = invertPatch(cells, tratto)
    expect(applyPatch(dopo, inverso)).toBe(cells)
    expect(invertPatch(dopo, inverso)).toEqual(tratto)
  })
})
