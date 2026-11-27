// Righello (feature 005): distanza tra due celle.
// Sui quadrati, regola base di D&D 5e: ogni passo in diagonale vale una cella.
// Sugli esagoni (006): passi tra esagoni confinanti, in coordinate assiali (q, riga).
export type Cell = [number, number] // [col, row]
export type Distance = { cells: number; ft: number; m: number }

export function distance(from: Cell, to: Cell, hex = false): Distance {
  const q = ([col, row]: Cell) => col - (row - (row & 1)) / 2
  const dr = to[1] - from[1]
  const dc = hex ? q(to) - q(from) : to[0] - from[0]
  const cells = Math.max(Math.abs(dc), Math.abs(dr), hex ? Math.abs(dc + dr) : 0)
  return { cells, ft: cells * 5, m: cells * 1.5 }
}

// «6 celle · 30 ft · 9 m»: una cella al singolare, metri con la virgola come nella traduzione italiana.
export function formatDistance(d: Distance, hex = false) {
  const m = Number.isInteger(d.m) ? String(d.m) : d.m.toFixed(1).replace('.', ',')
  return `${d.cells} ${hex ? (d.cells === 1 ? 'esagono' : 'esagoni') : d.cells === 1 ? 'cella' : 'celle'} · ${d.ft} ft · ${m} m`
}
