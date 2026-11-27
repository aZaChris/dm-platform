import { clampToMap } from '../lib/grid'
import type { Token } from '../hooks/useTable'
import { Icon } from './Icon'

type Props = {
  tokens: Token[]
  userId: string
  isDm: boolean
  selezionato: string | null
  onSelect: (id: string) => void
  onMove: (id: string, col: number, row: number) => void
  dims: { cols: number; rows: number } | null
  conScheda?: Set<string> // token che hanno una scheda collegata
  onOpen?: (id: string) => void
  righello?: boolean // con il righello acceso le frecce allungano la misura, non muovono il token
}

const FRECCE: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }

// "Personaggi in scena": elenco dei token e alternativa da tastiera al trascinamento.
// Si sceglie un token e lo si sposta con le frecce; la RLS decide comunque chi può scrivere.
export function TokenList({ tokens, userId, isDm, selezionato, onSelect, onMove, dims, conScheda, onOpen, righello }: Props) {
  function tasto(e: React.KeyboardEvent, t: Token) {
    const d = FRECCE[e.key]
    if (!d || righello || !dims || !(isDm || t.owner_id === userId)) return
    e.preventDefault()
    const c = clampToMap(t.col + d[0], t.row + d[1], dims.cols, dims.rows)
    if (c.col !== t.col || c.row !== t.row) onMove(t.id, c.col, c.row)
  }

  if (tokens.length === 0) return <p className="muted">Nessun token in scena.</p>
  return (
    <>
      {tokens.map((t) => (
        <div key={t.id} className="token-line">
          <button
            className={`token-row ${t.id === selezionato ? 'on' : ''}`}
            aria-pressed={t.id === selezionato}
            onClick={() => onSelect(t.id)}
            onKeyDown={(e) => tasto(e, t)}
          >
            <span className="token-dot" style={{ background: t.color }} aria-hidden="true">{t.name.slice(0, 1).toUpperCase()}</span>
            <strong>{t.name}</strong>
            <span className="muted">col {t.col + 1}, riga {t.row + 1}</span>
          </button>
          {conScheda?.has(t.id) && onOpen && (
            <button type="button" className="icon-btn token-sheet" onClick={() => onOpen(t.id)} aria-label={`Apri la scheda di ${t.name}`} title="Apri la scheda">
              <Icon name="sheet" size={16} />
            </button>
          )}
        </div>
      ))}
      <p className="muted small">Scegli un token e spostalo con le frecce (solo i tuoi, se non sei il DM). Doppio clic su un token della mappa per aprire la sua scheda.</p>
    </>
  )
}
