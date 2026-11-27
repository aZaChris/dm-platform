import { describe, expect, it } from 'vitest'
import { cellCenter, clampToMap, gridDims, snapToCell } from './grid'

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

describe('griglia esagonale', () => {
  it('aggancia il centro di ogni esagono, e un punto vicino, a quell\'esagono', () => {
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 5; col++) {
        const [x, y] = cellCenter(col, row, true)
        expect(snapToCell(x, y, true)).toEqual({ col, row })
        expect(snapToCell(x + 20, y - 8, true)).toEqual({ col, row })
        expect(snapToCell(x - 20, y + 8, true)).toEqual({ col, row })
      }
  })
  it('conta le colonne parziali, una in meno nelle righe dispari se non si vedono', () => {
    expect(gridDims(500, 430, true)).toMatchObject({ cols: 10, oddCols: 10, rows: 10 })
    expect(gridDims(520, 430, true)).toMatchObject({ cols: 11, oddCols: 10 })
    expect(clampToMap(10, 1, 11, 10, 10)).toEqual({ col: 9, row: 1 })
    expect(clampToMap(10, 2, 11, 10, 10)).toEqual({ col: 10, row: 2 })
  })
})
