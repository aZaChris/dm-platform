// Mappa a celle: una stringa con un carattere per cella, indice = riga * colonne + colonna.
export type CellType = '.' | 'f' | 'w' | 'd' | 'a'

export const CELL_TYPES: { type: CellType; nome: string; color: string }[] = [
  { type: '.', nome: 'Vuoto', color: '#0d1a1f' },
  { type: 'f', nome: 'Pavimento', color: '#6d6248' },
  { type: 'w', nome: 'Muro', color: '#1a2226' },
  { type: 'd', nome: 'Porta', color: '#a8743a' },
  { type: 'a', nome: 'Acqua', color: '#2f6f8f' },
]

export const MAX_COLS = 40
export const MAX_ROWS = 30
export const MIN_SIZE = 4

// Un tratto è un elenco di [indice, tipo]: è ciò che parte verso paint_cells.
export type Patch = [number, CellType][]

export const cellIndex = (col: number, row: number, cols: number) => row * cols + col
export const emptyCells = (cols: number, rows: number) => '.'.repeat(cols * rows)

// Riempie la zona contigua (quattro direzioni) che ha lo stesso tipo della cella di partenza.
// Iterativo con una pila: una mappa 40x30 non rischia lo stack overflow.
export function floodFill(cells: string, cols: number, rows: number, start: number, type: CellType): number[] {
  const from = cells[start]
  if (from === undefined || from === type) return []
  const seen = new Set<number>([start])
  const pila = [start]
  while (pila.length) {
    const i = pila.pop()!
    const c = i % cols
    const r = Math.floor(i / cols)
    const vicini = [
      c > 0 ? i - 1 : -1,
      c < cols - 1 ? i + 1 : -1,
      r > 0 ? i - cols : -1,
      r < rows - 1 ? i + cols : -1,
    ]
    for (const n of vicini) {
      if (n >= 0 && !seen.has(n) && cells[n] === from) {
        seen.add(n)
        pila.push(n)
      }
    }
  }
  return [...seen]
}

// Bresenham: le celle tra due punti, estremi compresi, senza buchi.
export function lineCells(c0: number, r0: number, c1: number, r1: number): [number, number][] {
  const out: [number, number][] = []
  const dc = Math.abs(c1 - c0)
  const dr = -Math.abs(r1 - r0)
  const sc = c0 < c1 ? 1 : -1
  const sr = r0 < r1 ? 1 : -1
  let err = dc + dr
  let c = c0
  let r = r0
  for (;;) {
    out.push([c, r])
    if (c === c1 && r === r1) return out
    const e2 = 2 * err
    if (e2 >= dr) {
      err += dr
      c += sc
    }
    if (e2 <= dc) {
      err += dc
      r += sr
    }
  }
}

// Applica un tratto a una stringa di celle.
export function applyPatch(cells: string, patch: Patch): string {
  const a = cells.split('')
  for (const [i, t] of patch) if (i >= 0 && i < a.length) a[i] = t
  return a.join('')
}

// Il tratto che rimette i valori di prima nelle celle toccate (per annulla/ripeti).
export function invertPatch(cells: string, patch: Patch): Patch {
  return patch.map(([i]) => [i, cells[i] as CellType])
}
