import { useEffect, useState } from 'react'
import { Stage, Layer, Image as KImage, Line } from 'react-konva'
import { CELL_PX } from '../lib/grid'

export function MapCanvas({ url }: { url: string }) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [vista, setVista] = useState({ w: innerWidth - 32, h: innerHeight * 0.75 })

  useEffect(() => {
    const i = new Image()
    i.onload = () => setImg(i)
    i.src = url
  }, [url])

  useEffect(() => {
    const on = () => setVista({ w: innerWidth - 32, h: innerHeight * 0.75 })
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])

  if (!img) return <p>Carico la mappa…</p>

  const scala = Math.min(vista.w / img.width, vista.h / img.height)
  const linee: number[][] = []
  for (let x = 0; x <= img.width; x += CELL_PX) linee.push([x, 0, x, img.height])
  for (let y = 0; y <= img.height; y += CELL_PX) linee.push([0, y, img.width, y])

  return (
    <Stage width={img.width * scala} height={img.height * scala}>
      <Layer scaleX={scala} scaleY={scala}>
        <KImage image={img} listening={false} />
        {linee.map((p, i) => (
          <Line key={i} points={p} stroke="rgba(0,0,0,0.35)" strokeWidth={1 / scala} listening={false} />
        ))}
      </Layer>
    </Stage>
  )
}
