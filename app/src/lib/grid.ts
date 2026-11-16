// Dimensione fissa della cella (spec: "cella fissa"). Le posizioni dei token sono in celle.
export const CELL_PX = 50

// Cella che contiene il punto (x, y), in pixel dell'immagine: il centro del token decide la cella.
export function snapToCell(x: number, y: number, cellPx = CELL_PX) {
  return { col: Math.floor(x / cellPx), row: Math.floor(y / cellPx) }
}

// Riporta una cella dentro la mappa (cols x rows celle, anche parziali sul bordo).
export function clampToMap(col: number, row: number, cols: number, rows: number) {
  return {
    col: Math.min(Math.max(col, 0), Math.max(cols - 1, 0)),
    row: Math.min(Math.max(row, 0), Math.max(rows - 1, 0)),
  }
}
