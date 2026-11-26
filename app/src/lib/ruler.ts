// Righello (feature 005): distanza tra due celle sulla griglia quadrata.
// Regola base di D&D 5e: ogni passo in diagonale vale una cella. Con la griglia esagonale (006) cambia solo questo file.
export type Cell = [number, number] // [col, row]
export type Distance = { cells: number; ft: number; m: number }

export function distance(from: Cell, to: Cell): Distance {
  const cells = Math.max(Math.abs(to[0] - from[0]), Math.abs(to[1] - from[1]))
  return { cells, ft: cells * 5, m: cells * 1.5 }
}

// «6 celle · 30 ft · 9 m»: una cella al singolare, metri con la virgola come nella traduzione italiana.
export function formatDistance(d: Distance) {
  const m = Number.isInteger(d.m) ? String(d.m) : d.m.toFixed(1).replace('.', ',')
  return `${d.cells} ${d.cells === 1 ? 'cella' : 'celle'} · ${d.ft} ft · ${m} m`
}
