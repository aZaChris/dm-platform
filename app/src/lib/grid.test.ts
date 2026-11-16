import { describe, expect, it } from 'vitest'
import { clampToMap, snapToCell } from './grid'

describe('snapToCell', () => {
  it('assegna il punto alla cella che lo contiene', () => {
    expect(snapToCell(0, 0)).toEqual({ col: 0, row: 0 })
    expect(snapToCell(49.9, 49.9)).toEqual({ col: 0, row: 0 })
    expect(snapToCell(50, 50)).toEqual({ col: 1, row: 1 })
    expect(snapToCell(125, 30)).toEqual({ col: 2, row: 0 })
  })
  it('restituisce valori negativi fuori dalla mappa (poi li sistema clampToMap)', () => {
    expect(snapToCell(-1, -60)).toEqual({ col: -1, row: -2 })
  })
})

describe('clampToMap', () => {
  it('lascia invariata una cella valida', () => {
    expect(clampToMap(3, 2, 10, 8)).toEqual({ col: 3, row: 2 })
  })
  it('riporta dentro il bordo le celle fuori mappa', () => {
    expect(clampToMap(-1, -5, 10, 8)).toEqual({ col: 0, row: 0 })
    expect(clampToMap(10, 8, 10, 8)).toEqual({ col: 9, row: 7 })
    expect(clampToMap(99, 99, 10, 8)).toEqual({ col: 9, row: 7 })
  })
  it('non va sotto zero con mappa vuota', () => {
    expect(clampToMap(4, 4, 0, 0)).toEqual({ col: 0, row: 0 })
  })
})
