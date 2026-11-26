import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTable } from '../hooks/useTable'
import { useCharacters } from '../hooks/useCharacters'
import { SheetPractical } from '../components/SheetPractical'
import { SheetClassic } from '../components/SheetClassic'
import { SheetField } from '../components/SheetField'
import { Roll20Import } from '../components/Roll20Import'
import { Icon } from '../components/Icon'
import { DiceOverlay } from '../components/DiceOverlay'
import { classLabel } from '../lib/character'

// Pagina Schede: elenco delle schede della campagna e la scheda scelta (feature 007).
export function Characters({ campaignId, userId }: { campaignId: string; userId: string }) {
  const { role, members, nome, nuovoTiro, chiudiTiro, tokens } = useTable(campaignId, userId)
  const chars = useCharacters(campaignId)
  const [scelta, setScelta] = useState<string | null>(null)
  const [modo, setModo] = useState<'scheda' | 'nuova' | 'import'>('scheda')
  const [nuovoNome, setNuovoNome] = useState('')
  const [vista, setVista] = useState<'pratica' | 'classica'>('pratica')

  // La vista scelta resta nel profilo dell'utente (user_metadata), uguale su ogni dispositivo (research, punto 7).
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user.user_metadata?.vista_scheda === 'classica') setVista('classica')
    })
  }, [])
  function scegliVista(v: 'pratica' | 'classica') {
    setVista(v)
    void supabase.auth.updateUser({ data: { vista_scheda: v } })
  }

  if (role === undefined || chars.schede === null) return <p className="muted">Caricamento…</p>
  if (role === null) {
    return (
      <section className="card narrow">
        <p className="error">Non fai parte di questa campagna.</p>
        <a href="#/campagne">Torna alle campagne</a>
      </section>
    )
  }

  const isDm = role === 'dm'
  const schede = chars.schede
  const aperta = schede.find((s) => s.id === scelta) ?? schede.find((s) => s.owner_id === userId) ?? schede[0]
  const canEdit = !!aperta && (isDm || aperta.owner_id === userId)
  const proprietario = (id: string | null) => members.find((m) => m.user_id === id)?.display_name ?? 'DM'

  async function crea(e: React.FormEvent) {
    e.preventDefault()
    const ids = await chars.create([{ name: nuovoNome.trim(), owner_id: userId }])
    if (ids) {
      setScelta(ids[0])
      setNuovoNome('')
      setModo('scheda')
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">{nome || 'La campagna'}</p>
          <h1 className="display">Schede</h1>
          <p className="muted">Le schede dei personaggi: tutti le leggono, le modificano il proprietario e il DM.</p>
        </div>
        <div className="row">
          <button type="button" onClick={() => setModo('import')}><Icon name="scroll" size={16} /> Importa da Roll20</button>
          <button type="button" className="init-main" onClick={() => setModo('nuova')}><Icon name="plus" size={16} /> Nuova scheda</button>
        </div>
      </header>
      {chars.errore && <p className="error" role="alert">{chars.errore}</p>}

      <div className="sheets-layout">
        <nav className="card sheet-list" aria-label="Schede della campagna">
          {schede.length === 0 ? (
            <p className="muted small">Nessuna scheda ancora: creane una o importala da Roll20.</p>
          ) : (
            <ul>
              {schede.map((s) => (
                <li key={s.id}>
                  <button type="button" className={`sheet-item ${aperta?.id === s.id ? 'on' : ''}`} aria-current={aperta?.id === s.id ? 'true' : undefined}
                    onClick={() => { setScelta(s.id); setModo('scheda') }}>
                    <b>{s.name}</b>
                    <span className="muted small">{classLabel(s.data)} · PF {s.data.hp.current}/{s.data.hp.max}</span>
                    <span className="muted small">{s.owner_id === userId ? 'Tua' : proprietario(s.owner_id)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <div className="sheet-main">
          {modo === 'import' ? (
            <Roll20Import userId={userId} isDm={isDm} members={members} schede={schede} chars={chars}
              onDone={(id) => { if (id) setScelta(id); setModo('scheda') }} />
          ) : modo === 'nuova' ? (
            <section className="card import-box" aria-labelledby="nuova-h">
              <h2 id="nuova-h">Nuova scheda</h2>
              <form onSubmit={crea}>
                <input aria-label="Nome del personaggio" placeholder="Nome del personaggio…" value={nuovoNome} onChange={(e) => setNuovoNome(e.target.value)} maxLength={60} required />
                <button>Crea la scheda</button>
              </form>
              <button type="button" className="link-btn" onClick={() => setModo('scheda')}>Annulla</button>
            </section>
          ) : aperta ? (
            <article className="card" aria-label={`Scheda di ${aperta.name}`}>
              <div className="sheet-title">
                {canEdit ? (
                  <SheetField label="Nome" hideLabel value={aperta.name} onSave={(v) => void chars.rename(aperta.id, String(v).slice(0, 60))} className="sf-title" />
                ) : <h2>{aperta.name}</h2>}
                {!canEdit && <span className="badge">Sola lettura</span>}
                <div className="view-toggle" role="group" aria-label="Vista della scheda">
                  <button type="button" aria-pressed={vista === 'pratica'} onClick={() => scegliVista('pratica')}>Pratica</button>
                  <button type="button" aria-pressed={vista === 'classica'} onClick={() => scegliVista('classica')}>Classica</button>
                </div>
              </div>
              {isDm && (
                <div className="sheet-links" role="group" aria-label="Collegamenti della scheda (solo DM)">
                  <label className="sf"><span className="sf-label">Token sulla mappa</span>
                    <select value={aperta.token_id ?? ''} onChange={(e) => void chars.link(aperta.id, { token_id: e.target.value || null })}>
                      <option value="">Nessun token</option>
                      {tokens.filter((t) => t.id === aperta.token_id || !schede.some((c) => c.token_id === t.id)).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </label>
                  <label className="sf"><span className="sf-label">Proprietario</span>
                    <select value={aperta.owner_id ?? ''} onChange={(e) => void chars.link(aperta.id, { owner_id: e.target.value || null })}>
                      <option value="">Il DM</option>
                      {members.map((m) => <option key={m.user_id} value={m.user_id}>{m.display_name}</option>)}
                    </select>
                  </label>
                </div>
              )}
              {vista === 'classica' ? (
                <SheetClassic data={aperta.data} canEdit={canEdit} patch={(p, v) => void chars.patch(aperta.id, p, v)} />
              ) : (
                <SheetPractical data={aperta.data} canEdit={canEdit} patch={(p, v) => void chars.patch(aperta.id, p, v)} roll={(l, n) => void chars.roll(aperta.id, l, n)} />
              )}
              {canEdit && (
                <div className="sheet-foot">
                  <button type="button" className="link-btn" onClick={() => confirm(`Eliminare la scheda di ${aperta.name}?`) && void chars.remove(aperta.id)}>Elimina scheda</button>
                </div>
              )}
            </article>
          ) : (
            <section className="card map-empty"><p className="muted">Crea la prima scheda o importala da Roll20.</p></section>
          )}
        </div>
      </div>
      {nuovoTiro && <DiceOverlay key={nuovoTiro.id} roll={nuovoTiro} onClose={chiudiTiro} />}
    </>
  )
}
