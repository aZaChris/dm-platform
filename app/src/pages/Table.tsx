import { useEffect, useState } from 'react'
import { useTable } from '../hooks/useTable'
import { MapCanvas } from '../components/MapCanvas'
import { DmPanel } from '../components/DmPanel'
import { DiceRoller } from '../components/DiceRoller'
import { DiceOverlay } from '../components/DiceOverlay'
import { TokenList } from '../components/TokenList'
import { Icon } from '../components/Icon'
import { ULTIMA } from '../components/Shell'

export function Table({ campaignId, userId }: { campaignId: string; userId: string }) {
  const { nome, eventi, role, mapUrl, mapPath, tokens, members, moveToken, errore, rolls, nuovoTiro, chiudiTiro, tiraD20 } = useTable(campaignId, userId)
  const [showGrid, setShowGrid] = useState(true)
  const [selezionato, setSelezionato] = useState<string | null>(null)
  const [dims, setDims] = useState<{ cols: number; rows: number } | null>(null)

  useEffect(() => {
    try {
      localStorage.setItem(ULTIMA, campaignId) // la voce "Tavolo di gioco" della barra torna qui
    } catch {
      /* storage bloccato: pazienza */
    }
  }, [campaignId])

  if (role === undefined) return <p className="muted">Caricamento…</p>
  if (role === null) {
    return (
      <section className="card narrow">
        <p className="error">Non fai parte di questa campagna.</p>
        <a href="#/campagne">Torna alle campagne</a>
      </section>
    )
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Il tavolo virtuale</p>
          <h1 className="display">{nome || 'Tavolo di gioco'}</h1>
          <p className="muted">Trascina un token sulla griglia, o scegline uno dall'elenco e usa le frecce.</p>
        </div>
        <span className={`badge ${role === 'dm' ? 'dm' : ''}`}>{role === 'dm' ? 'Dungeon Master' : 'Giocatore'}</span>
      </header>
      {errore && <p className="error" role="alert">{errore}</p>}
      <div className="table-layout">
        <div className="table-main">
          {mapUrl ? (
            <section className="card map-card">
              <div className="map-toolbar">
                <b>Mappa</b>
                <button className="icon-btn" aria-pressed={showGrid} aria-label="Mostra o nascondi la griglia" title="Mostra o nascondi la griglia" onClick={() => setShowGrid(!showGrid)}>
                  <Icon name="grid" />
                </button>
              </div>
              <MapCanvas url={mapUrl} tokens={tokens} userId={userId} isDm={role === 'dm'} onMove={moveToken} showGrid={showGrid} selectedId={selezionato} onDims={(cols, rows) => setDims({ cols, rows })} />
              <div className="map-caption">
                <span>Posizioni in celle: col, riga</span>
                <span aria-live="polite">{eventi[0] ?? 'Nessuna modifica in questa sessione'}</span>
              </div>
            </section>
          ) : (
            <section className="card"><p className="muted">Nessuna mappa{role === 'dm' ? ': caricane una dal pannello a destra.' : ' ancora.'}</p></section>
          )}
        </div>
        <div className="table-side">
          <section className="card">
            <h2 className="side-h">Personaggi in scena</h2>
            <TokenList tokens={tokens} userId={userId} isDm={role === 'dm'} selezionato={selezionato} onSelect={setSelezionato} onMove={moveToken} dims={dims} />
          </section>
          <section className="card">
            <h2 className="side-h">Registro del tavolo</h2>
            {eventi.length === 0 ? (
              <p className="muted">Nessuna azione in questa sessione.</p>
            ) : (
              <ul className="dice-log">{eventi.map((e, i) => <li key={`${i}-${e}`}>{e}</li>)}</ul>
            )}
          </section>
          <section className="card"><DiceRoller rolls={rolls} onRoll={tiraD20} /></section>
          {role === 'dm' && <section className="card"><DmPanel campaignId={campaignId} mapPath={mapPath} tokens={tokens} members={members} /></section>}
        </div>
      </div>
      {nuovoTiro && <DiceOverlay key={nuovoTiro.id} roll={nuovoTiro} onClose={chiudiTiro} />}
    </>
  )
}
