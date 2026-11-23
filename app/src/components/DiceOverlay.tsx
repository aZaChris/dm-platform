import { useEffect, useState } from 'react'
import type { Roll } from '../hooks/useTable'

const ROLLING_MS = 1100
const VISIBLE_MS = 3600
const calmo = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// d20 a tutto schermo, visibile a tutti i membri: annuncio, rotolata, esito, verdetto.
export function DiceOverlay({ roll, onClose }: { roll: Roll; onClose: () => void }) {
  const [shown, setShown] = useState(calmo() ? roll.face : 0)
  const [done, setDone] = useState(calmo())

  useEffect(() => {
    if (calmo()) return
    const cicla = setInterval(() => setShown(1 + Math.floor(Math.random() * 20)), 70)
    const ferma = setTimeout(() => {
      clearInterval(cicla)
      setShown(roll.face)
      setDone(true)
    }, ROLLING_MS)
    return () => {
      clearInterval(cicla)
      clearTimeout(ferma)
    }
  }, [roll])

  useEffect(() => {
    const chiudi = setTimeout(onClose, VISIBLE_MS)
    return () => clearTimeout(chiudi)
  }, [roll, onClose])

  const crit = done && roll.face === 20
  const fumble = done && roll.face === 1
  const successo = roll.dc == null ? null : roll.face === 20 || (roll.face !== 1 && roll.total >= roll.dc)
  const segno = roll.modifier >= 0 ? '+' : '−'

  return (
    <div className="dice-veil" role="dialog" aria-live="polite" aria-label="Tiro di dado" onClick={onClose}>
      <div className="dice-stage">
        <p className="eyebrow">
          {roll.display_name}
          {roll.dc != null && ` · CD ${roll.dc}`}
        </p>
        <h2 className="dice-title">{roll.label}</h2>

        <div className={`d20 ${done ? 'settled' : 'rolling'} ${crit ? 'crit' : ''} ${fumble ? 'fumble' : ''}`}>
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <polygon points="50,3 93,27 93,73 50,97 7,73 7,27" />
            <polygon points="50,3 93,73 7,73" className="facet" />
            <polyline points="7,27 50,3 93,27 93,73 50,97 7,73 7,27 50,73 93,27 M50,3 50,73 M7,73 93,73" className="facet" />
          </svg>
          <span className="d20-n">{shown || ''}</span>
        </div>

        <p className={`dice-total ${done ? 'in' : ''}`}>
          {roll.face} {segno} {Math.abs(roll.modifier)} = <strong>{roll.total}</strong>
        </p>
        {done && (
          <p className={`dice-verdict ${successo === null ? '' : successo ? 'ok' : 'ko'}`}>
            {crit ? 'Colpo critico' : fumble ? 'Fallimento critico' : successo === null ? '' : successo ? 'Successo' : 'Fallimento'}
          </p>
        )}
      </div>
    </div>
  )
}
