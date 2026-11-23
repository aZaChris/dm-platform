import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Image as KImage, Line, Group, Circle, Text } from 'react-konva'
import { CELL_PX, clampToMap, snapToCell } from '../lib/grid'
import type { Token } from '../hooks/useTable'

type Props = {
  showGrid: boolean
  selectedId: string | null
  onDims: (cols: number, rows: number) => void
  url: string
  tokens: Token[]
  userId: string
  isDm: boolean
  onMove: (id: string, col: number, row: number) => void
}

export function MapCanvas({ showGrid, selectedId, onDims, url, tokens, userId, isDm, onMove }: Props) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const [vista, setVista] = useState({ w: 600, h: innerHeight * 0.75 })

  useEffect(() => {
    const i = new Image()
    i.onload = () => {
      setImg(i)
      onDims(Math.ceil(i.width / CELL_PX), Math.ceil(i.height / CELL_PX))
    }
    i.src = url
  }, [url])

  useEffect(() => {
    // Si adatta al contenitore (con la barra laterale la finestra non basta).
    const el = ref.current!
    const ro = new ResizeObserver(() => setVista({ w: el.clientWidth, h: innerHeight * 0.75 }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (!img) return <div ref={ref}><p>Carico la mappa…</p></div>

  const scala = Math.min(vista.w / img.width, vista.h / img.height)
  const cols = Math.ceil(img.width / CELL_PX)
  const rows = Math.ceil(img.height / CELL_PX)
  const linee: number[][] = []
  for (let x = 0; x <= img.width; x += CELL_PX) linee.push([x, 0, x, img.height])
  for (let y = 0; y <= img.height; y += CELL_PX) linee.push([0, y, img.width, y])
  const raggio = CELL_PX * 0.4

  return (
    <div ref={ref} className="map-wrap">
    <Stage width={img.width * scala} height={img.height * scala}>
      <Layer scaleX={scala} scaleY={scala}>
        <KImage image={img} listening={false} />
        {showGrid && linee.map((p, i) => (
          <Line key={i} points={p} stroke="rgba(0,0,0,0.35)" strokeWidth={1 / scala} listening={false} />
        ))}
        {tokens.map((t) => (
          <Group
            key={t.id}
            x={t.col * CELL_PX + CELL_PX / 2}
            y={t.row * CELL_PX + CELL_PX / 2}
            draggable={isDm || t.owner_id === userId}
            onDragEnd={(e) => {
              const g = e.target
              const { col, row } = snapToCell(g.x(), g.y())
              const c = clampToMap(col, row, cols, rows)
              // Aggancia subito il nodo alla cella, senza aspettare il ritorno dal server.
              g.position({ x: c.col * CELL_PX + CELL_PX / 2, y: c.row * CELL_PX + CELL_PX / 2 })
              if (c.col !== t.col || c.row !== t.row) onMove(t.id, c.col, c.row)
            }}
          >
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
