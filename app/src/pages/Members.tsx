import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTable, type Member } from '../hooks/useTable'
import { InviteBox } from '../components/InviteBox'

// Membri della campagna: tutti li vedono, solo il DM invita e rimuove.
export function Members({ campaignId, userId }: { campaignId: string; userId: string }) {
  const { role, members } = useTable(campaignId, userId)
  const [errore, setErrore] = useState('')

  async function rimuovi(m: Member) {
    if (!confirm(`Rimuovere ${m.display_name} dalla campagna?`)) return
    setErrore('')
    const { data, error } = await supabase
      .from('campaign_members')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('user_id', m.user_id)
      .select('user_id')
    if (error) setErrore(error.message)
    else if (!data.length) setErrore('Non è stato possibile rimuovere il membro.')
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

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">Il tuo party</p>
          <h1 className="display">Membri</h1>
        </div>
        <a href={`#/tavolo/${campaignId}`}>← Torna al tavolo</a>
      </header>

      <div className="grid3 wide">
        {members.map((m) => (
          <article className="card member" key={m.user_id}>
            <span className="avatar big" aria-hidden="true">{m.display_name.slice(0, 2).toUpperCase()}</span>
            <div className="member-info">
              <h3 className="member-name">{m.display_name}{m.user_id === userId && <span className="muted"> (tu)</span>}</h3>
              <span className={`badge ${m.role === 'dm' ? 'dm' : ''}`}>{m.role === 'dm' ? 'Dungeon Master' : 'Giocatore'}</span>
            </div>
            {role === 'dm' && m.user_id !== userId && <button onClick={() => rimuovi(m)}>Rimuovi</button>}
          </article>
        ))}
      </div>

      {role === 'dm' && (
        <section className="card narrow">
          <h2>Invita un giocatore</h2>
          <InviteBox campaignId={campaignId} />
        </section>
      )}
      {errore && <p className="error" role="alert">{errore}</p>}
    </>
  )
}
