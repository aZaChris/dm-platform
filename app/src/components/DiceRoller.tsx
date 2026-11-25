import { useState } from 'react'
type Props = { onRoll: (label: string, modifier: number, dc: number | null) => Promise<void> }

// Form del tiro: il risultato compare a tutti nell'overlay e nella chat.
export function DiceRoller({ onRoll }: Props) {
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
    </section>
  )
}
