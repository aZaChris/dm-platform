import { useEffect, useState } from 'react'
import { CELL_TYPES, MAX_COLS, MAX_ROWS, MIN_SIZE, type CellType } from '../lib/cells'
import type { CellMap } from '../hooks/useCellMap'
import type { Tool } from './MapCanvas'

type Props = {
  map: CellMap | null
  hasImage: boolean
  editing: boolean
  setEditing: (v: boolean) => void
  tool: Tool
  setTool: (t: Tool) => void
  cellType: CellType
  setCellType: (t: CellType) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onCreate: (cols: number, rows: number) => void
  onClear: () => void
  onResize: (cols: number, rows: number) => Promise<number | null>
  onSetActive: (active: boolean) => void
  onRemove: () => void
}

const STRUMENTI: { tool: Tool; nome: string; tasto: string }[] = [
  { tool: 'brush', nome: 'Pennello', tasto: 'B' },
  { tool: 'fill', nome: 'Riempimento', tasto: 'F' },
  { tool: 'erase', nome: 'Gomma', tasto: 'E' },
]

const clamp = (n: number, max: number) => Math.min(Math.max(Math.round(n) || MIN_SIZE, MIN_SIZE), max)

export function MapEditor(p: Props) {
  const [cols, setCols] = useState(20)
  const [rows, setRows] = useState(15)
  const [avviso, setAvviso] = useState('')
  const { map, editing, tool, setTool, setCellType, onUndo, onRedo } = p

  // Le dimensioni dei campi seguono la mappa (anche dopo un cambio fatto da un'altra scheda).
  useEffect(() => {
    if (map) {
      setCols(map.cols)
      setRows(map.rows)
    }
  }, [map?.cols, map?.rows])

  useEffect(() => {
    if (!editing) return
    function tasto(e: KeyboardEvent) {
      const el = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return
      const k = e.key.toLowerCase()
      if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'y')) {
        e.preventDefault()
        if (k === 'y' || e.shiftKey) onRedo()
        else onUndo()
      } else if (e.ctrlKey || e.metaKey || e.altKey) return
      else if (k === 'b') setTool('brush')
      else if (k === 'f') setTool('fill')
      else if (k === 'e') setTool('erase')
      else if (k >= '1' && k <= '5') {
        setCellType(CELL_TYPES[Number(k) - 1].type)
        if (tool === 'erase') setTool('brush')
      }
    }
    addEventListener('keydown', tasto)
    return () => removeEventListener('keydown', tasto)
  }, [editing, tool, setTool, setCellType, onUndo, onRedo])

  async function ridimensiona() {
    const c = clamp(cols, MAX_COLS)
    const r = clamp(rows, MAX_ROWS)
    setCols(c)
    setRows(r)
    const spostati = await p.onResize(c, r)
    setAvviso(spostati ? `${spostati} token riportati dentro il bordo` : '')
  }

  const campiDimensione = (
    <>
      <label>Colonne ({MIN_SIZE}-{MAX_COLS})
        <input type="number" min={MIN_SIZE} max={MAX_COLS} value={cols} onChange={(e) => setCols(Number(e.target.value))} />
      </label>
      <label>Righe ({MIN_SIZE}-{MAX_ROWS})
        <input type="number" min={MIN_SIZE} max={MAX_ROWS} value={rows} onChange={(e) => setRows(Number(e.target.value))} />
      </label>
    </>
  )

  if (!map) {
    return (
      <div className="map-editor">
        <b>Mappa a celle</b>
        <form onSubmit={(e) => { e.preventDefault(); p.onCreate(clamp(cols, MAX_COLS), clamp(rows, MAX_ROWS)) }}>
          {campiDimensione}
          <button type="submit">Nuova mappa</button>
        </form>
      </div>
    )
  }

  return (
    <div className="map-editor">
      <div className="map-editor-row">
        <button aria-pressed={editing} onClick={() => p.setEditing(!editing)}>Modifica mappa</button>
        <label>Mostra
          <select
            value={map.active ? 'celle' : 'immagine'}
            onChange={(e) => p.onSetActive(e.target.value === 'celle')}
          >
            <option value="celle">Mappa a celle</option>
            <option value="immagine" disabled={!p.hasImage}>Immagine{p.hasImage ? '' : ' (non caricata)'}</option>
          </select>
        </label>
      </div>
      {editing && (
        <>
          <div className="map-editor-row" role="group" aria-label="Strumento">
            {STRUMENTI.map((s) => (
              <button key={s.tool} aria-pressed={tool === s.tool} onClick={() => setTool(s.tool)} title={`Scorciatoia ${s.tasto}`}>{s.nome}</button>
            ))}
          </div>
          <div className="map-editor-row" role="group" aria-label="Tipo di cella">
            {CELL_TYPES.map((t, i) => (
              <button
                key={t.type}
                aria-pressed={p.cellType === t.type && tool !== 'erase'}
                onClick={() => { setCellType(t.type); if (tool === 'erase') setTool('brush') }}
                title={`Scorciatoia ${i + 1}`}
              >
                <span className="swatch" style={{ background: t.color }} aria-hidden="true" /> {t.nome}
              </button>
            ))}
          </div>
          <div className="map-editor-row">
            <button disabled={!p.canUndo} onClick={onUndo}>Annulla</button>
            <button disabled={!p.canRedo} onClick={onRedo}>Ripeti</button>
            <button onClick={() => { if (confirm('Svuotare tutta la mappa?')) p.onClear() }}>Svuota mappa</button>
          </div>
          <form className="map-editor-row" onSubmit={(e) => { e.preventDefault(); void ridimensiona() }}>
            {campiDimensione}
            <button type="submit">Cambia dimensione</button>
          </form>
          {avviso && <p className="muted" role="status">{avviso}</p>}
          <button onClick={() => { if (confirm('Eliminare la mappa a celle?')) { p.setEditing(false); p.onRemove() } }}>Elimina mappa a celle</button>
        </>
      )}
    </div>
  )
}
