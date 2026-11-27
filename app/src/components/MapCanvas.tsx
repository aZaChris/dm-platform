import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Konva from 'konva'
import { Stage, Layer, Image as KImage, Line, Group, Circle, Text, Shape, Label, Tag } from 'react-konva'
import { CELL_PX, clampToMap, snapToCell } from '../lib/grid'
import { CELL_TYPES, applyPatch, cellIndex, floodFill, lineCells, type CellType, type Patch } from '../lib/cells'
import type { CellMap } from '../hooks/useCellMap'
import type { Token } from '../hooks/useTable'
import type { Measure } from '../hooks/useRuler'
import { distance, formatDistance, type Cell } from '../lib/ruler'

export type Tool = 'brush' | 'fill' | 'erase'

type Props = {
  showGrid: boolean
  selectedId: string | null
  turnTokenId?: string | null // token di turno nel combattimento (feature 004)
  onDims: (cols: number, rows: number) => void
  onOpen?: (tokenId: string) => void // doppio clic o doppio tocco su un token: apre la sua scheda (007, US4)
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
  // Righello (005): con ruler attivo il trascinamento misura invece di muovere token o dipingere.
  ruler?: boolean
  measures?: Measure[]
  onMeasure?: (from: Cell, to: Cell | null) => void
}

const COLORE = Object.fromEntries(CELL_TYPES.map((t) => [t.type, t.color]))

export function MapCanvas({ showGrid, selectedId, turnTokenId, onDims, onOpen, url, cellMap, tokens, userId, isDm, onMove, editing, tool, cellType, onPaint, ruler, measures = [], onMeasure }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const [vista, setVista] = useState({ w: 600, h: innerHeight * 0.75 })
  const [bozza, setBozza] = useState<Patch>([]) // il tratto in corso, mostrato subito in locale
  const tratto = useRef<Map<number, CellType> | null>(null)
  const ultima = useRef<[number, number] | null>(null)
  const inizio = useRef<Cell | null>(null) // partenza della misura in corso
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
  const modifica = !!(editing && celle && isDm) && !ruler
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

  // La cella sotto il puntatore, riportata dentro la mappa: la misura non esce dal bordo.
  function cellaDentro(e: Parameters<typeof cellaSotto>[0]): Cell | null {
    const p = e.target.getStage()?.getPointerPosition()
    if (!p) return null
    const { col, row } = snapToCell(p.x / scala, p.y / scala)
    const c = clampToMap(col, row, cols, rows)
    return [c.col, c.row]
  }

  function giu(e: Konva.KonvaEventObject<PointerEvent>) {
    if (ruler) {
      const c = cellaDentro(e)
      if (!c) return
      // Il puntatore resta «catturato»: uscendo dalla mappa la misura non si chiude, si ferma al bordo.
      ;(e.evt.target as Element).setPointerCapture(e.evt.pointerId)
      inizio.current = c
      onMeasure?.(c, c)
      return
    }
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
    if (ruler && inizio.current) {
      const c = cellaDentro(e)
      if (c) onMeasure?.(inizio.current, c) // l'hook manda solo se la cella è cambiata
      return
    }
    if (!tratto.current) return
    const c = cellaSotto(e)
    if (c) aggiungi(c.col, c.row)
  }

  function su() {
    if (inizio.current) {
      inizio.current = null
      onMeasure?.([0, 0], null)
      return
    }
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
      style={modifica || ruler ? { touchAction: 'none', cursor: 'crosshair' } : undefined}
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
          <TokenNode
            key={t.id}
            t={t}
            raggio={raggio}
            draggable={!modifica && !ruler && (isDm || t.owner_id === userId)}
            selezionato={t.id === selectedId}
            diTurno={t.id === turnTokenId}
            onOpen={onOpen ? () => onOpen(t.id) : undefined}
            onDrop={(x, y, g) => {
              const { col, row } = snapToCell(x, y)
              const c = clampToMap(col, row, cols, rows)
              // Aggancia subito il nodo alla cella, senza aspettare il ritorno dal server.
              g.position({ x: c.col * CELL_PX + CELL_PX / 2, y: c.row * CELL_PX + CELL_PX / 2 })
              if (c.col !== t.col || c.row !== t.row) onMove(t.id, c.col, c.row)
            }}
          />
        ))}
        {measures.map((m) => {
          const centro = (c: Cell) => [c[0] * CELL_PX + CELL_PX / 2, c[1] * CELL_PX + CELL_PX / 2]
          const [x1, y1] = centro(m.from)
          const [x2, y2] = centro(m.to)
          const colore = m.mine ? '#dcb468' : '#8fd3b8'
          const testo = formatDistance(distance(m.from, m.to)) + (m.mine ? '' : ` · ${m.name}`)
          return (
            <Group key={m.id} listening={false}>
              <Line points={[x1, y1, x2, y2]} stroke={colore} strokeWidth={4 / scala + 2} dash={[12, 8]} lineCap="round" shadowColor="#000" shadowBlur={6} shadowOpacity={0.6} />
              <Circle x={x1} y={y1} radius={7} fill={colore} />
              <Circle x={x2} y={y2} radius={9} stroke={colore} strokeWidth={3} />
              <Label x={x2} y={y2 - 18} scaleX={1 / Math.max(scala, 0.6)} scaleY={1 / Math.max(scala, 0.6)}>
                <Tag fill="#0d1a1f" stroke={colore} strokeWidth={1.5} cornerRadius={6} pointerDirection="down" pointerWidth={10} pointerHeight={7} />
                <Text text={testo} fill="#ece6d6" fontSize={15} fontStyle="bold" padding={7} />
              </Label>
            </Group>
          )
        })}
      </Layer>
    </Stage>
    </div>
  )
}

const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches

type NodoProps = {
  t: Token
  raggio: number
  draggable: boolean
  selezionato: boolean
  diTurno: boolean
  onOpen?: () => void
  onDrop: (x: number, y: number, g: Konva.Group) => void
}

// Un token sulla mappa. Quando col/riga cambiano (anche da un altro giocatore) scivola nella nuova cella
// invece di saltare: la posizione la muove la tween di Konva, non le prop, sennò React la reimposterebbe di colpo.
function TokenNode({ t, raggio, draggable, selezionato, diTurno, onOpen, onDrop }: NodoProps) {
  const g = useRef<Konva.Group>(null)
  const anello = useRef<Konva.Circle>(null)
  const x = t.col * CELL_PX + CELL_PX / 2
  const y = t.row * CELL_PX + CELL_PX / 2

  useLayoutEffect(() => {
    const n = g.current
    if (!n || n.isDragging()) return
    if (n.x() === 0 && n.y() === 0) return void n.position({ x, y }) // primo disegno: al suo posto, senza viaggio
    if (calmo()) return void n.position({ x, y })
    n.to({ x, y, duration: 0.35, easing: Konva.Easings.EaseOut })
  }, [x, y])

  // L'anello del turno gira piano: un'animazione sola, ferma con «riduci movimento».
  useEffect(() => {
    const a = anello.current
    if (!diTurno || !a || calmo()) return
    const anim = new Konva.Animation((f) => void a.rotation(((f?.time ?? 0) / 40) % 360), a.getLayer())
    anim.start()
    return () => void anim.stop()
  }, [diTurno])

  return (
    <Group ref={g} draggable={draggable} onDblClick={onOpen} onDblTap={onOpen} onDragEnd={() => g.current && onDrop(g.current.x(), g.current.y(), g.current)}
      onMouseEnter={(e) => { if (draggable) e.target.getStage()!.container().style.cursor = 'grab' }}
      onMouseLeave={(e) => { e.target.getStage()!.container().style.cursor = '' }}>
      {diTurno && <Circle ref={anello} radius={raggio + 7} stroke="#8fd3b8" strokeWidth={3} dash={[6, 4]} listening={false} />}
      <Circle radius={raggio} fill={t.color} stroke={selezionato ? '#dcb468' : '#fff'} strokeWidth={selezionato ? 5 : 2}
        shadowColor="#000" shadowBlur={10} shadowOpacity={0.55} shadowOffsetY={3} />
      <Text text={t.name.slice(0, 2).toUpperCase()} fill="#fff" fontStyle="bold" fontSize={raggio} width={raggio * 2} x={-raggio} y={-raggio / 2} align="center" listening={false} />
    </Group>
  )
}
