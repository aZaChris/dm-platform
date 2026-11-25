import { useState } from 'react'
import type { Token } from '../hooks/useTable'
import type { useEncounter } from '../hooks/useEncounter'
import { tied, type Participant } from '../lib/initiative'

type Props = { tokens: Token[]; userId: string; isDm: boolean; enc: ReturnType<typeof useEncounter> }

// Una riga dell'elenco: nome, valore e, per chi può (DM o proprietario), campi per scriverlo o tirarlo.
function Riga({ p, token, puoi, isDm, inPari, diTurno, enc }: { p: Participant; token: Token; puoi: boolean; isDm: boolean; inPari: boolean; diTurno: boolean; enc: Props['enc'] }) {
  const [valore, setValore] = useState(p.initiative?.toString() ?? '')
  const [mod, setMod] = useState(p.modifier)
  const salva = () => valore !== '' && void enc.setInitiative(p.token_id, Number(valore), mod)

  return (
    <li className={`init-row${diTurno ? ' init-turn' : ''}`} aria-current={diTurno ? 'true' : undefined}>
      <div className="init-head">
        <span className="init-dot" style={{ background: token.color }} aria-hidden="true" />
        <b className="init-name">{token.name}</b>
        <span className="init-val">{p.initiative ?? '—'}</span>
      </div>
      {(puoi || isDm) && (
        <div className="row init-ctrl">
          {puoi && (
            <>
              <input type="number" inputMode="numeric" min={-20} max={60} value={valore} onChange={(e) => setValore(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && salva()} aria-label={`Iniziativa di ${token.name}`} style={{ width: '4.5rem' }} />
              <input type="number" inputMode="numeric" min={-20} max={20} value={mod} onChange={(e) => setMod(Number(e.target.value))} aria-label={`Modificatore di ${token.name}`} style={{ width: '4.5rem' }} />
              <button onClick={salva} disabled={valore === ''} aria-label={`Salva l'iniziativa di ${token.name}`}>Salva</button>
              <button onClick={() => void enc.rollInitiative(p.token_id, mod)} aria-label={`Tira d20 per l'iniziativa di ${token.name}`}>Tira d20</button>
            </>
          )}
          {isDm && inPari && <button onClick={() => void enc.moveUp(p.token_id)} aria-label={`Sposta su ${token.name}`}>Sposta su</button>}
          {isDm && <button className="link-btn" onClick={() => void enc.remove(p.token_id)} aria-label={`Togli ${token.name} dal combattimento`}>Togli</button>}
        </div>
      )}
    </li>
  )
}

export function Initiative({ tokens, userId, isDm, enc }: Props) {
  const [scelti, setScelti] = useState<string[]>([])
  const [daAggiungere, setDaAggiungere] = useState('')
  const perId = new Map(tokens.map((t) => [t.id, t]))
  const { encounter: e, ordine } = enc
  // Un partecipante senza token visibile (appena eliminato) non si mostra.
  const righe = ordine.filter((p) => perId.has(p.token_id))
  const mancanti = righe.filter((p) => p.initiative == null).map((p) => perId.get(p.token_id)!.name)
  const fuori = tokens.filter((t) => !ordine.some((p) => p.token_id === t.id))
  const diTurno = e?.started ? perId.get(e.turn_token_id ?? '') : undefined

  return (
    <section>
      <h2 className="side-h">Iniziativa</h2>
      {enc.errore && <p className="error" role="alert">{enc.errore}</p>}

      {!e ? (
        isDm ? (
          <fieldset className="init-pick">
            <legend className="muted">Chi partecipa al combattimento?</legend>
            {tokens.length === 0 && <p className="muted">Crea prima dei token sulla mappa.</p>}
            {tokens.map((t) => (
              <label key={t.id} className="init-check">
                <input type="checkbox" checked={scelti.includes(t.id)} onChange={(ev) => setScelti(ev.target.checked ? [...scelti, t.id] : scelti.filter((x) => x !== t.id))} />
                <span className="init-dot" style={{ background: t.color }} aria-hidden="true" /> {t.name}
              </label>
            ))}
            <button className="init-main" disabled={scelti.length === 0} onClick={() => void enc.start(scelti).then(() => setScelti([]))}>Avvia combattimento</button>
          </fieldset>
        ) : (
          <p className="muted">Nessun combattimento in corso.</p>
        )
      ) : (
        <>
          <p className="init-status" aria-live="polite">
            {e.started ? (diTurno ? `Round ${e.round} · turno di ${diTurno.name}` : `Round ${e.round}`) : 'Preparazione: si stabiliscono le iniziative'}
          </p>
          <ol className="init-list">
            {righe.map((p, i) => {
              const token = perId.get(p.token_id)!
              return (
                <Riga
                  key={`${p.token_id}-${p.initiative}-${p.modifier}`}
                  p={p}
                  token={token}
                  puoi={isDm || token.owner_id === userId}
                  isDm={isDm}
                  inPari={i > 0 && p.initiative != null && tied(p, righe[i - 1])}
                  diTurno={!!e.started && e.turn_token_id === p.token_id}
                  enc={enc}
                />
              )
            })}
          </ol>

          {isDm && (
            <div className="init-dm">
              {!e.started ? (
                <>
                  {mancanti.length > 0 && <p className="muted" id="init-mancanti">Manca l'iniziativa di: {mancanti.join(', ')}</p>}
                  <button className="init-main" disabled={righe.length === 0 || mancanti.length > 0} aria-describedby={mancanti.length ? 'init-mancanti' : undefined} onClick={() => void enc.begin()}>Inizia</button>
                </>
              ) : (
                <div className="row">
                  <button onClick={enc.prev} disabled={e.round === 1 && righe[0]?.token_id === e.turn_token_id}>Turno precedente</button>
                  <button className="init-main" onClick={enc.next}>Turno successivo</button>
                </div>
              )}
              {fuori.length > 0 && (
                <div className="row">
                  <select aria-label="Aggiungi al combattimento" value={daAggiungere} onChange={(ev) => setDaAggiungere(ev.target.value)}>
                    <option value="">Aggiungi un token…</option>
                    {fuori.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button disabled={!daAggiungere} onClick={() => void enc.add(daAggiungere).then(() => setDaAggiungere(''))}>Aggiungi</button>
                </div>
              )}
              <button className="link-btn" onClick={() => confirm('Terminare il combattimento per tutti?') && void enc.end()}>Termina combattimento</button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
