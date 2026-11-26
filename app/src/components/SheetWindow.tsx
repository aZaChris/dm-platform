import { useRef, useState } from 'react'

type Props = { title: string; onClose: () => void; children: React.ReactNode; actions?: React.ReactNode }

// Finestra mobile sopra la mappa: si trascina dalla barra, si ridimensiona dall'angolo (CSS resize), si riduce o si chiude.
// Non blocca il resto della pagina: la mappa sotto resta usabile.
// ponytail: posizione e dimensione non si ricordano tra una visita e l'altra; localStorage se servirà.
export function SheetWindow({ title, onClose, children, actions }: Props) {
  const [pos, setPos] = useState(() => ({ x: Math.max(16, innerWidth - 460), y: 96 }))
  const [ridotta, setRidotta] = useState(false)
  const presa = useRef<{ dx: number; dy: number } | null>(null)

  function giu(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    presa.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  function muovi(e: React.PointerEvent) {
    if (!presa.current) return
    // Resta dentro lo schermo: almeno la barra deve restare afferrabile.
    setPos({
      x: Math.min(Math.max(e.clientX - presa.current.dx, 8 - 300), innerWidth - 120),
      y: Math.min(Math.max(e.clientY - presa.current.dy, 8), innerHeight - 48),
    })
  }
  // Con la tastiera: le frecce sulla barra spostano la finestra di 24px.
  function tasto(e: React.KeyboardEvent) {
    const d = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[e.key]
    if (!d) return
    e.preventDefault()
    setPos((p) => ({ x: p.x + d[0], y: Math.max(8, p.y + d[1]) }))
  }

  return (
    <section className={`sheet-window ${ridotta ? 'is-min' : ''}`} style={{ left: pos.x, top: pos.y }} role="dialog" aria-modal="false" aria-labelledby="sw-title"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <header className="sw-bar" onPointerDown={giu} onPointerMove={muovi} onPointerUp={() => (presa.current = null)}
        tabIndex={0} onKeyDown={tasto} aria-label={`${title}: trascina o usa le frecce per spostare la finestra`}>
        <h2 id="sw-title" className="sw-title">{title}</h2>
        {actions}
        <button type="button" className="icon-btn" onClick={() => setRidotta(!ridotta)} aria-label={ridotta ? 'Espandi la finestra' : 'Riduci la finestra'} aria-expanded={!ridotta}>{ridotta ? '▢' : '–'}</button>
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Chiudi la finestra della scheda">×</button>
      </header>
      {!ridotta && <div className="sw-body">{children}</div>}
    </section>
  )
}
