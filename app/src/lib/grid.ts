// Dimensione fissa della cella (spec: "cella fissa"). Le posizioni dei token sono in celle.
export const CELL_PX = 50

// Esagoni (006): vertice in alto, larghi quanto una cella, righe dispari spostate a destra di mezzo esagono.
const RAGGIO = CELL_PX / Math.sqrt(3)
const PASSO_RIGA = 1.5 * RAGGIO

// oddCols: colonne delle righe dispari (con gli esagoni possono essere una in meno); w, h in pixel.
export type Dims = { cols: number; rows: number; oddCols: number; w: number; h: number }

export function cellCenter(col: number, row: number, hex = false): [number, number] {
  if (!hex) return [col * CELL_PX + CELL_PX / 2, row * CELL_PX + CELL_PX / 2]
  return [(col + 1 / 2 + (row & 1) / 2) * CELL_PX, RAGGIO + row * PASSO_RIGA]
}

// Cella che contiene il punto (x, y), in pixel dell'immagine: il centro del token decide la cella.
// Con gli esagoni è quella col centro più vicino, cercata nelle due righe a cavallo del punto.
export function snapToCell(x: number, y: number, hex = false) {
  if (!hex) return { col: Math.floor(x / CELL_PX), row: Math.floor(y / CELL_PX) }
  const r = Math.floor((y - RAGGIO) / PASSO_RIGA)
  const [a, b] = [r, r + 1].map((row) => {
    const col = Math.round(x / CELL_PX - 1 / 2 - (row & 1) / 2) + 0 // + 0: round può dare -0
    const [cx, cy] = cellCenter(col, row, true)
    return { col, row, d: Math.hypot(x - cx, y - cy) }
  })
  const { col, row } = a.d <= b.d ? a : b
  return { col, row }
}

// Celle di una mappa di w x h pixel, comprese quelle parziali sul bordo.
export function gridDims(w: number, h: number, hex = false): Dims {
  const cols = Math.ceil(w / CELL_PX)
  return {
    cols,
    rows: Math.ceil(h / (hex ? PASSO_RIGA : CELL_PX)),
    oddCols: hex ? Math.max(1, Math.ceil(w / CELL_PX - 1 / 2)) : cols,
    w,
    h,
  }
}

// Riporta una cella dentro la mappa.
export function clampToMap(col: number, row: number, cols: number, rows: number, oddCols = cols) {
  const r = Math.min(Math.max(row, 0), Math.max(rows - 1, 0))
  return { col: Math.min(Math.max(col, 0), Math.max((r & 1 ? oddCols : cols) - 1, 0)), row: r }
}
