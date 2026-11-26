import { describe, expect, it } from 'vitest'
import { distance, formatDistance } from './ruler'

describe('distance', () => {
  it('in orizzontale e in verticale conta le celle', () => {
    expect(distance([2, 3], [6, 3])).toEqual({ cells: 4, ft: 20, m: 6 })
    expect(distance([2, 3], [2, 0])).toEqual({ cells: 3, ft: 15, m: 4.5 })
  })
  it('ogni passo in diagonale vale una cella', () => {
    expect(distance([0, 0], [5, 3])).toEqual({ cells: 5, ft: 25, m: 7.5 })
    expect(distance([0, 0], [3, 3])).toEqual({ cells: 3, ft: 15, m: 4.5 })
  })
  it('stessa cella e ordine inverso', () => {
    expect(distance([4, 4], [4, 4]).cells).toBe(0)
    expect(distance([6, 2], [0, 0])).toEqual(distance([0, 0], [6, 2]))
  })
})

describe('formatDistance', () => {
  it('scrive celle, piedi e metri con la virgola', () => {
    expect(formatDistance(distance([0, 0], [6, 2]))).toBe('6 celle · 30 ft · 9 m')
    expect(formatDistance(distance([0, 0], [5, 0]))).toBe('5 celle · 25 ft · 7,5 m')
    expect(formatDistance(distance([0, 0], [1, 1]))).toBe('1 cella · 5 ft · 1,5 m')
    expect(formatDistance(distance([2, 2], [2, 2]))).toBe('0 celle · 0 ft · 0 m')
  })
})
