import { useEffect, useRef, useState } from 'react'
import { useTable } from '../hooks/useTable'
import { useCellMap } from '../hooks/useCellMap'
import { useChat } from '../hooks/useChat'
import { useEncounter } from '../hooks/useEncounter'
import type { CellType, Patch } from '../lib/cells'
import { MapCanvas, type Tool } from '../components/MapCanvas'
import { MapEditor } from '../components/MapEditor'
import { DmPanel } from '../components/DmPanel'
import { DiceRoller } from '../components/DiceRoller'
import { Chat } from '../components/Chat'
import { Initiative } from '../components/Initiative'
import { DiceOverlay } from '../components/DiceOverlay'
import { TokenList } from '../components/TokenList'
import { Icon } from '../components/Icon'
import { ULTIMA } from '../components/Shell'
import { useCharacters } from '../hooks/useCharacters'
import { SheetPractical } from '../components/SheetPractical'

type Scheda = 'scena' | 'chat' | 'combattimento' | 'pg' | 'dm'

export function Table({ campaignId, userId }: { campaignId: string; userId: string }) {
  const { nome, eventi, role, mapUrl, mapPath, tokens, members, moveToken, errore, rolls, nuovoTiro, chiudiTiro, tiraD20 } = useTable(campaignId, userId)
  const cm = useCellMap(campaignId)
  const chat = useChat(campaignId)
  const enc = useEncounter(campaignId, role === 'dm')
  const chars = useCharacters(campaignId)
  const [editing, setEditing] = useState(false)
  const [tool, setTool] = useState<Tool>('brush')
  const [cellType, setCellType] = useState<CellType>('w')
  const [showGrid, setShowGrid] = useState(true)
  const [selezionato, setSelezionato] = useState<string | null>(null)
  const [dims, setDims] = useState<{ cols: number; rows: number } | null>(null)
  const [tab, setTab] = useState<Scheda>('scena')
  // Pallino «nuovi messaggi» sulla scheda Chat: acceso se c'è qualcosa di più recente dell'ultima volta che l'hai guardata.
  // ponytail: confronta l'orario del server con quello del browser; con orologi sfasati di secondi il pallino può sbagliare di poco.
  const visto = useRef(Date.now())
  const ultimo = Math.max(Date.parse(chat.messages.at(-1)?.created_at ?? '') || 0, Date.parse(rolls[0]?.created_at ?? '') || 0)
  const nonLetti = tab !== 'chat' && ultimo > visto.current
  const apri = (k: Scheda) => {
    if (k === 'chat' || tab === 'chat') visto.current = Date.now()
    setTab(k)
  }

  useEffect(() => {
    try {
      localStorage.setItem(ULTIMA, campaignId) // la voce "Tavolo di gioco" della barra torna qui
    } catch {
      /* storage bloccato: pazienza */
    }
  }, [campaignId])

  const schede: Scheda[] = role === 'dm' ? ['scena', 'chat', 'combattimento', 'pg', 'dm'] : ['scena', 'chat', 'combattimento', 'pg']
  const turno = enc.encounter?.started ? enc.encounter.turn_token_id : null
  // La scheda del token scelto sulla mappa, altrimenti la propria (feature 007).
  const pg = chars.schede?.find((c) => c.token_id === selezionato) ?? chars.schede?.find((c) => c.owner_id === userId)
  const editorProps = {
    map: cm.map, hasImage: !!mapUrl, editing, setEditing, tool, setTool, cellType, setCellType,
    canUndo: cm.canUndo, canRedo: cm.canRedo, onUndo: cm.undo, onRedo: cm.redo, onCreate: cm.create,
    onClear: cm.clear, onResize: cm.resize, onSetActive: cm.setActive, onRemove: cm.remove,
  }

  if (role === undefined) return <p className="muted">Caricamento…</p>
  if (role === null) {
    return (
      <section className="card narrow">
        <p className="error">Non fai parte di questa campagna.</p>
        <a href="#/campagne">Torna alle campagne</a>
      </section>
    )
  }

  const scheda = (k: Scheda, testo: React.ReactNode) => (
    <button
      role="tab"
      id={`tab-${k}`}
      aria-selected={tab === k}
      aria-controls={`pan-${k}`}
      tabIndex={tab === k ? 0 : -1}
      className="tab"
      onClick={() => apri(k)}
    >
      {testo}
    </button>
  )
  // Frecce sinistra/destra tra le schede, come vuole il pattern ARIA dei tab.
  function frecce(e: React.KeyboardEvent) {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!d) return
    const i = (schede.indexOf(tab) + d + schede.length) % schede.length
    apri(schede[i])
    document.getElementById(`tab-${schede[i]}`)?.focus()
  }

  return (
    <>
      <header className="page-head table-head">
        <div>
          <p className="eyebrow">Il tavolo virtuale</p>
          <h1 className="display">{nome || 'Tavolo di gioco'}</h1>
        </div>
        <span className={`badge ${role === 'dm' ? 'dm' : ''}`}>{role === 'dm' ? 'Dungeon Master' : 'Giocatore'}</span>
      </header>
      {(errore || cm.errore) && <p className="error" role="alert">{errore || cm.errore}</p>}
      <div className="table-layout">
        <div className="table-main">
          {mapUrl || cm.map?.active ? (
            <section className="card map-card">
              <div className="map-toolbar">
                <b>{cm.map?.active ? 'Mappa a celle' : 'Mappa'}</b>
                <span className="map-hint muted">Trascina un token, o sceglilo in «Scena» e usa le frecce</span>
                <button className="icon-btn" aria-pressed={showGrid} aria-label="Mostra o nascondi la griglia" title="Mostra o nascondi la griglia" onClick={() => setShowGrid(!showGrid)}>
                  <Icon name="grid" />
                </button>
              </div>
              <MapCanvas url={mapUrl} cellMap={cm.map} editing={editing} tool={tool} cellType={cellType} onPaint={(p: Patch) => void cm.paint(p)} tokens={tokens} userId={userId} isDm={role === 'dm'} onMove={moveToken} showGrid={showGrid} selectedId={selezionato} turnTokenId={turno} onDims={(cols, rows) => setDims({ cols, rows })} />
              <div className="map-caption">
                <span>Posizioni in celle: col, riga</span>
                <span aria-live="polite" key={eventi[0]} className="map-last">{eventi[0] ?? 'Nessuna modifica in questa sessione'}</span>
              </div>
            </section>
          ) : (
            <section className="card map-empty">
              <Icon name="map" size={40} />
              <h2>Nessuna mappa in scena</h2>
              {role === 'dm' ? (
                <>
                  <p className="muted">Disegna una mappa a celle qui sotto, o carica un'immagine dalla scheda «DM».</p>
                  <MapEditor {...editorProps} />
                </>
              ) : (
                <p className="muted">Il DM non ha ancora preparato la mappa.</p>
              )}
            </section>
          )}
        </div>
        <aside className="card table-side" aria-label="Pannello del tavolo">
          <div className="tabs" role="tablist" aria-label="Sezioni del tavolo" onKeyDown={frecce}>
            {scheda('scena', 'Scena')}
            {scheda('chat', <>Chat{nonLetti && <span className="tab-dot" aria-label="(nuovi messaggi)" />}</>)}
            {scheda('combattimento', <>Combattimento{turno && <span className="tab-dot mint" aria-label="(in corso)" />}</>)}
            {scheda('pg', 'Scheda')}
            {role === 'dm' && scheda('dm', 'DM')}
          </div>
          <div className="tab-body">
            <div role="tabpanel" id="pan-scena" aria-labelledby="tab-scena" hidden={tab !== 'scena'}>
              <h2 className="side-h">Personaggi in scena</h2>
              <TokenList tokens={tokens} userId={userId} isDm={role === 'dm'} selezionato={selezionato} onSelect={setSelezionato} onMove={moveToken} dims={dims} />
              <h2 className="side-h">Registro del tavolo</h2>
              {eventi.length === 0 ? (
                <p className="muted">Nessuna azione in questa sessione.</p>
              ) : (
                <ul className="dice-log">{eventi.map((e, i) => <li key={`${i}-${e}`}>{e}</li>)}</ul>
              )}
            </div>
            <div role="tabpanel" id="pan-chat" aria-labelledby="tab-chat" hidden={tab !== 'chat'}>
              <Chat userId={userId} isDm={role === 'dm'} messages={chat.messages} rolls={rolls} members={members} errore={chat.errore} onSend={chat.send} onRemove={chat.remove} />
            </div>
            <div role="tabpanel" id="pan-combattimento" aria-labelledby="tab-combattimento" hidden={tab !== 'combattimento'}>
              <Initiative tokens={tokens} userId={userId} isDm={role === 'dm'} enc={enc} />
            </div>
            <div role="tabpanel" id="pan-pg" aria-labelledby="tab-pg" hidden={tab !== 'pg'}>
              {pg ? (
                <>
                  <h2 className="side-h">{pg.name}</h2>
                  <SheetPractical data={pg.data} canEdit={role === 'dm' || pg.owner_id === userId} patch={(p, v) => void chars.patch(pg.id, p, v)} roll={(l, n) => void chars.roll(pg.id, l, n)} />
                </>
              ) : (
                <p className="muted">Nessuna scheda per te o per il token scelto. <a href={`#/schede/${campaignId}`}>Crea o importa la tua scheda</a></p>
              )}
              {chars.errore && <p className="error" role="alert">{chars.errore}</p>}
            </div>
            {role === 'dm' && (
              <div role="tabpanel" id="pan-dm" aria-labelledby="tab-dm" hidden={tab !== 'dm'}>
                {cm.map && (
                  <>
                    <h2 className="side-h">Mappa a celle</h2>
                    <MapEditor {...editorProps} />
                  </>
                )}
                <h2 className="side-h">Mappa e token</h2>
                <DmPanel campaignId={campaignId} mapPath={mapPath} tokens={tokens} members={members} />
              </div>
            )}
          </div>
          <div className="side-dice"><DiceRoller onRoll={tiraD20} /></div>
        </aside>
      </div>
      {nuovoTiro && <DiceOverlay key={nuovoTiro.id} roll={nuovoTiro} onClose={chiudiTiro} />}
    </>
  )
}
