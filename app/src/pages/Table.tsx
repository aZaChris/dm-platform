import { useEffect } from 'react'
import { useTable } from '../hooks/useTable'
import { MapCanvas } from '../components/MapCanvas'
import { DmPanel } from '../components/DmPanel'
import { DiceRoller } from '../components/DiceRoller'
import { DiceOverlay } from '../components/DiceOverlay'
import { ULTIMA } from '../components/Shell'

export function Table({ campaignId, userId }: { campaignId: string; userId: string }) {
  const { role, mapUrl, mapPath, tokens, members, moveToken, errore, rolls, nuovoTiro, chiudiTiro, tiraD20 } = useTable(campaignId, userId)

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
          <p className="eyebrow">{role === 'dm' ? 'Dungeon Master' : 'Giocatore'}</p>
          <h1 className="display">Tavolo di gioco</h1>
        </div>
        <a href="#/campagne">← Campagne</a>
      </header>
      {errore && <p className="error" role="alert">{errore}</p>}
      <div className="table-layout">
        <div className="table-main">
          {mapUrl ? (
            <MapCanvas url={mapUrl} tokens={tokens} userId={userId} isDm={role === 'dm'} onMove={moveToken} />
          ) : (
            <section className="card"><p className="muted">Nessuna mappa{role === 'dm' ? ': caricane una dal pannello a destra.' : ' ancora.'}</p></section>
          )}
        </div>
        <div className="table-side">
          <section className="card"><DiceRoller rolls={rolls} onRoll={tiraD20} /></section>
          {role === 'dm' && <section className="card"><DmPanel campaignId={campaignId} mapPath={mapPath} tokens={tokens} members={members} /></section>}
        </div>
      </div>
      {nuovoTiro && <DiceOverlay key={nuovoTiro.id} roll={nuovoTiro} onClose={chiudiTiro} />}
    </>
  )
}
