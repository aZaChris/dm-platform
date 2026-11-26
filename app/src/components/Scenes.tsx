import { useState } from 'react'
import type { useScenes } from '../hooks/useScenes'

// Scelta della scena da preparare e da mettere in scena (solo DM).
export function Scenes({ sc }: { sc: ReturnType<typeof useScenes> }) {
  const [nome, setNome] = useState('')
  const { scenes, scena } = sc
  if (!scena) return <p className="muted">Caricamento…</p>
  return (
    <div>
      <div className="row">
        <label>
          Stai guardando:{' '}
          <select value={scena.id} onChange={(e) => sc.vedi(e.target.value)}>
            {scenes.map((s) => <option key={s.id} value={s.id}>{s.name}{s.active ? ' (in gioco)' : ''}</option>)}
          </select>
        </label>
        {!scena.active && (
          <>
            <button onClick={() => void sc.attivaScena(scena.id)}>Metti in gioco</button>
            <button onClick={() => { if (confirm(`Eliminare «${scena.name}» con mappa e token?`)) void sc.elimina(scena) }}>Elimina scena</button>
          </>
        )}
      </div>
      <form className="row" onSubmit={(e) => { e.preventDefault(); void sc.crea(nome.trim()); setNome('') }}>
        <input aria-label="Nome della nuova scena" placeholder="Nome nuova scena…" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} required pattern=".*\S.*" />
        <button>Aggiungi scena</button>
      </form>
    </div>
  )
}
