import { useState } from 'react'
import { fromRoll20, ERRORE_FORMATO, type Importato } from '../lib/roll20'
import { classLabel } from '../lib/character'
import type { Member } from '../hooks/useTable'
import type { Scheda, useCharacters } from '../hooks/useCharacters'

type Props = {
  userId: string
  isDm: boolean
  members: Member[]
  schede: Scheda[]
  chars: ReturnType<typeof useCharacters>
  onDone: (id: string | null) => void
}

type Riga = Importato & { scelto: boolean; owner: string; sostituisci: boolean }

// Import da Roll20: si scelgono i file, si controlla il riepilogo, poi tutto in un colpo (o niente, FR-013).
export function Roll20Import({ userId, isDm, members, schede, chars, onDone }: Props) {
  const [righe, setRighe] = useState<Riga[]>([])
  const [errore, setErrore] = useState('')
  const [invio, setInvio] = useState(false)

  async function leggi(files: FileList | null) {
    setErrore('')
    setRighe([])
    if (!files?.length) return
    try {
      const tutte: Importato[] = []
      for (const f of Array.from(files)) {
        let json: unknown
        try {
          json = JSON.parse(await f.text())
        } catch {
          throw new Error(`${f.name}: ${ERRORE_FORMATO}`)
        }
        tutte.push(...fromRoll20(json))
      }
      setRighe(tutte.map((t) => ({ ...t, scelto: true, owner: userId, sostituisci: false })))
    } catch (e) {
      setErrore((e as Error).message)
    }
  }

  const aggiorna = (i: number, campi: Partial<Riga>) => setRighe((rs) => rs.map((r, j) => (j === i ? { ...r, ...campi } : r)))
  const esistente = (r: Riga) => schede.find((s) => s.name.toLowerCase() === r.name.toLowerCase() && (isDm || s.owner_id === userId))

  async function importa() {
    setInvio(true)
    const scelte = righe.filter((r) => r.scelto)
    const nuove = scelte.filter((r) => !(r.sostituisci && esistente(r)))
    let primo: string | null = null
    if (nuove.length) {
      const ids = await chars.create(nuove.map((r) => ({ name: r.name, owner_id: isDm ? r.owner || null : userId, data: r.data })))
      if (!ids) return setInvio(false)
      primo = ids[0]
    }
    for (const r of scelte.filter((r) => r.sostituisci && esistente(r))) {
      const s = esistente(r)!
      if (await chars.replace(s.id, r.name, r.data)) primo ??= s.id
    }
    setInvio(false)
    onDone(primo)
  }

  const scelte = righe.filter((r) => r.scelto).length
  return (
    <section className="card import-box" aria-labelledby="imp-h">
      <h2 id="imp-h">Importa da Roll20</h2>
      <p className="muted small">Scegli uno o più file JSON della scheda Roll20 (D&amp;D 5e). Dopo l'import la scheda resta tutta modificabile.</p>
      <label className="file-label">
        <span>File del personaggio</span>
        <input type="file" accept="application/json,.json" multiple onChange={(e) => void leggi(e.target.files)} />
      </label>
      {errore && <p className="error" role="alert">{errore}</p>}

      {righe.length > 0 && (
        <>
          <ul className="imp-list">
            {righe.map((r, i) => {
              const gia = esistente(r)
              return (
                <li key={i}>
                  <label className="init-check">
                    <input type="checkbox" checked={r.scelto} onChange={(e) => aggiorna(i, { scelto: e.target.checked })} />
                    <span><b>{r.name}</b> <span className="muted">· {classLabel(r.data)} · PF {r.data.hp.current}/{r.data.hp.max} · CA {r.data.ac}</span></span>
                  </label>
                  {isDm && (
                    <select aria-label={`Proprietario di ${r.name}`} value={r.owner} onChange={(e) => aggiorna(i, { owner: e.target.value })}>
                      <option value="">Del DM</option>
                      {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
                    </select>
                  )}
                  {gia && (
                    <select aria-label={`Cosa fare con ${r.name}, che esiste già`} value={r.sostituisci ? 's' : 'n'} onChange={(e) => aggiorna(i, { sostituisci: e.target.value === 's' })}>
                      <option value="n">Esiste già: crea una nuova scheda</option>
                      <option value="s">Esiste già: sostituiscila</option>
                    </select>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="row">
            <button type="button" className="init-main" disabled={!scelte || invio} onClick={() => void importa()}>
              {invio ? 'Importo…' : `Importa ${scelte} ${scelte === 1 ? 'personaggio' : 'personaggi'}`}
            </button>
            <button type="button" className="link-btn" onClick={() => onDone(null)}>Annulla</button>
          </div>
        </>
      )}
    </section>
  )
}
