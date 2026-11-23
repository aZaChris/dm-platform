import { useState } from 'react'
import type { Roll } from '../hooks/useTable'

type Props = { rolls: Roll[]; onRoll: (label: string, modifier: number, dc: number | null) => Promise<void> }

// Form del tiro più diario degli ultimi tiri (visibile a tutta la campagna).
export function DiceRoller({ rolls, onRoll }: Props) {
  const [label, setLabel] = useState('Prova di Percezione')
  const [mod, setMod] = useState(0)
  const [dc, setDc] = useState('')
  const [invio, setInvio] = useState(false)

  async function tira(e: React.FormEvent) {
    e.preventDefault()
    setInvio(true)
    await onRoll(label.trim() || 'Tiro libero', mod, dc ? Number(dc) : null)
    setInvio(false)
  }

  return (
    <section className="dice-panel">
      <h2 className="side-h">Dadi</h2>
      <form onSubmit={tira}>
        <input name="prova" autoComplete="off" value={label} onChange={(e) => setLabel(e.target.value)} maxLength={60} aria-label="Nome della prova" />
        <div className="row">
          <input name="modificatore" autoComplete="off" inputMode="numeric" type="number" min={-20} max={20} value={mod} onChange={(e) => setMod(Number(e.target.value))} aria-label="Modificatore" style={{ width: '5rem' }} />
          <input name="cd" autoComplete="off" inputMode="numeric" type="number" min={1} max={40} value={dc} onChange={(e) => setDc(e.target.value)} placeholder="CD" aria-label="Classe difficoltà" style={{ width: '5rem' }} />
        </div>
        <button disabled={invio}>Tira d20</button>
      </form>
      <ul className="dice-log">
        {rolls.map((r) => (
          <li key={r.id}>
            <span>
              <b>{r.display_name}</b> · {r.label}
            </span>
            <span className={r.face === 20 ? 'crit-txt' : r.face === 1 ? 'fail-txt' : ''}>
              {r.face}
              {r.modifier ? (r.modifier > 0 ? `+${r.modifier}` : `${r.modifier}`) : ''} = {r.total}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
