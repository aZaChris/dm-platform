import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KImage, Line, Group, Circle, Text, Shape } from 'react-konva'
import { CELL_PX, clampToMap, snapToCell } from '../lib/grid'
import { CELL_TYPES, applyPatch, cellIndex, floodFill, lineCells, type CellType, type Patch } from '../lib/cells'
import type { CellMap } from '../hooks/useCellMap'
import type { Token } from '../hooks/useTable'

export type Tool = 'brush' | 'fill' | 'erase'

type Props = {
  showGrid: boolean
  selectedId: string | null
  turnTokenId?: string | null // token di turno nel combattimento (feature 004)
  onDims: (cols: number, rows: number) => void
  url: string | null
  cellMap?: CellMap | null
  tokens: Token[]
  userId: string
  isDm: boolean
  onMove: (id: string, col: number, row: number) => void
  // Modifica (solo DM): strumento, tipo di cella e invio del tratto al rilascio.
  editing?: boolean
  tool?: Tool
  cellType?: CellType
  onPaint?: (patch: Patch) => void
}

const COLORE = Object.fromEntries(CELL_TYPES.map((t) => [t.type, t.color]))

export function MapCanvas({ showGrid, selectedId, turnTokenId, onDims, url, cellMap, tokens, userId, isDm, onMove, editing, tool, cellType, onPaint }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const [vista, setVista] = useState({ w: 600, h: innerHeight * 0.75 })
  const [bozza, setBozza] = useState<Patch>([]) // il tratto in corso, mostrato subito in locale
  const tratto = useRef<Map<number, CellType> | null>(null)
  const ultima = useRef<[number, number] | null>(null)
  const celle = cellMap?.active ? cellMap : null

  useEffect(() => {
    if (!url) return setImg(null)
    const i = new Image()
    i.onload = () => {
      setImg(i)
      if (!celle) onDims(Math.ceil(i.width / CELL_PX), Math.ceil(i.height / CELL_PX))
    }
    i.src = url
  }, [url])

  useEffect(() => {
    if (celle) onDims(celle.cols, celle.rows)
    else if (img) onDims(Math.ceil(img.width / CELL_PX), Math.ceil(img.height / CELL_PX))
  }, [celle?.cols, celle?.rows, !celle])

  useEffect(() => {
    // Si adatta al contenitore (con la barra laterale la finestra non basta).
    const el = ref.current!
    const ro = new ResizeObserver(() => setVista({ w: el.clientWidth, h: innerHeight * 0.75 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Con la mappa a celle la dimensione viene da colonne e righe, altrimenti dall'immagine.
  const W = celle ? celle.cols * CELL_PX : img?.width
  const H = celle ? celle.rows * CELL_PX : img?.height
  if (!W || !H) return <div ref={ref}><p>Carico la mappa…</p></div>

  const scala = Math.min(vista.w / W, vista.h / H)
  const cols = Math.ceil(W / CELL_PX)
  const rows = Math.ceil(H / CELL_PX)
  const linee: number[][] = []
  for (let x = 0; x <= W; x += CELL_PX) linee.push([x, 0, x, H])
  for (let y = 0; y <= H; y += CELL_PX) linee.push([0, y, W, y])
  const raggio = CELL_PX * 0.4
  const modifica = !!(editing && celle && isDm)
  // Le celle mostrate includono il tratto in corso, ancora non salvato.
  const mostrate = celle ? (bozza.length ? applyPatch(celle.cells, bozza) : celle.cells) : ''

  function cellaSotto(e: { target: { getStage(): { getPointerPosition(): { x: number; y: number } | null } | null } }) {
    const p = e.target.getStage()?.getPointerPosition()
    if (!p) return null
    const { col, row } = snapToCell(p.x / scala, p.y / scala)
    return col < 0 || row < 0 || col >= cols || row >= rows ? null : { col, row }
  }

  function aggiungi(col: number, row: number) {
    const tipo: CellType = tool === 'erase' ? '.' : (cellType ?? 'w')
    const da = ultima.current ?? [col, row]
    for (const [c, r] of lineCells(da[0], da[1], col, row)) tratto.current!.set(cellIndex(c, r, cols), tipo)
    ultima.current = [col, row]
    setBozza([...tratto.current!])
  }

  function giu(e: Parameters<typeof cellaSotto>[0]) {
    if (!modifica || !celle) return
    const c = cellaSotto(e)
    if (!c) return
    if (tool === 'fill') {
      const tipo = cellType ?? 'w'
      const indici = floodFill(celle.cells, celle.cols, celle.rows, cellIndex(c.col, c.row, cols), tipo)
      if (indici.length) onPaint?.(indici.map((i) => [i, tipo]))
      return
    }
    tratto.current = new Map()
    ultima.current = null
    aggiungi(c.col, c.row)
  }

  function muovi(e: Parameters<typeof cellaSotto>[0]) {
    if (!tratto.current) return
    const c = cellaSotto(e)
    if (c) aggiungi(c.col, c.row)
  }

  function su() {
    if (!tratto.current) return
    const patch: Patch = [...tratto.current]
    tratto.current = null
    ultima.current = null
    onPaint?.(patch) // una sola chiamata per tratto, al rilascio
    setBozza([])
  }

  return (
    <div ref={ref} className="map-wrap">
    <Stage
      width={W * scala}
      height={H * scala}
      style={modifica ? { touchAction: 'none', cursor: 'crosshair' } : undefined}
      onPointerDown={giu}
      onPointerMove={muovi}
      onPointerUp={su}
      onPointerLeave={su}
    >
      <Layer scaleX={scala} scaleY={scala}>
        {celle ? (
          <Shape
            listening={false}
            sceneFunc={(ctx) => {
              for (let i = 0; i < mostrate.length; i++) {
                const t = mostrate[i]
                const x = (i % celle.cols) * CELL_PX
                const y = Math.floor(i / celle.cols) * CELL_PX
                ctx.setAttr('fillStyle', COLORE[t])
                ctx.fillRect(x, y, CELL_PX, CELL_PX)
                if (t === 'w') {
                  ctx.setAttr('strokeStyle', '#5b6a70')
                  ctx.setAttr('lineWidth', 3)
                  ctx.strokeRect(x + 1.5, y + 1.5, CELL_PX - 3, CELL_PX - 3)
                } else if (t === 'd') {
                  ctx.setAttr('fillStyle', '#e8c58a')
                  ctx.fillRect(x + 6, y + CELL_PX / 2 - 4, CELL_PX - 12, 8)
                } else if (t === 'a') {
                  ctx.setAttr('strokeStyle', 'rgba(255,255,255,0.35)')
                  ctx.setAttr('lineWidth', 2)
                  ctx.beginPath()
                  ctx.moveTo(x + 8, y + CELL_PX / 2)
                  ctx.quadraticCurveTo(x + CELL_PX / 3, y + CELL_PX / 2 - 8, x + CELL_PX / 2, y + CELL_PX / 2)
                  ctx.quadraticCurveTo(x + (2 * CELL_PX) / 3, y + CELL_PX / 2 + 8, x + CELL_PX - 8, y + CELL_PX / 2)
                  ctx.stroke()
                }
              }
            }}
          />
        ) : (
          img && <KImage image={img} listening={false} />
        )}
        {showGrid && linee.map((p, i) => (
          <Line key={i} points={p} stroke={celle ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.35)'} strokeWidth={1 / scala} listening={false} />
        ))}
        {tokens.map((t) => (
          <Group
            key={t.id}
            x={t.col * CELL_PX + CELL_PX / 2}
            y={t.row * CELL_PX + CELL_PX / 2}
            draggable={!modifica && (isDm || t.owner_id === userId)}
            onDragEnd={(e) => {
              const g = e.target
              const { col, row } = snapToCell(g.x(), g.y())
              const c = clampToMap(col, row, cols, rows)
              // Aggancia subito il nodo alla cella, senza aspettare il ritorno dal server.
              g.position({ x: c.col * CELL_PX + CELL_PX / 2, y: c.row * CELL_PX + CELL_PX / 2 })
              if (c.col !== t.col || c.row !== t.row) onMove(t.id, c.col, c.row)
            }}
          >
            {t.id === turnTokenId && <Circle radius={raggio + 7} stroke="#8fd3b8" strokeWidth={3} dash={[6, 4]} listening={false} />}
            <Circle radius={raggio} fill={t.color} stroke={t.id === selectedId ? '#dcb468' : '#fff'} strokeWidth={t.id === selectedId ? 5 : 2} />
            <Text
              text={t.name.slice(0, 2).toUpperCase()}
              fill="#fff"
              fontStyle="bold"
              fontSize={raggio}
              width={raggio * 2}
              x={-raggio}
              y={-raggio / 2}
              align="center"
              listening={false}
            />
          </Group>
        ))}
      </Layer>
    </Stage>
    </div>
  )
}
