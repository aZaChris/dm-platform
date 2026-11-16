import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

type Riga = { role: 'dm' | 'player'; campaigns: { id: string; name: string } }

export function Campaigns({ userId }: { userId: string }) {
  const [righe, setRighe] = useState<Riga[]>([])
  const [nome, setNome] = useState('')
  const [errore, setErrore] = useState('')
  const [link, setLink] = useState('')

  async function carica() {
    const { data, error } = await supabase
      .from('campaign_members')
      .select('role, campaigns(id, name)')
      .eq('user_id', userId)
    if (error) setErrore(error.message)
    else setRighe(data as unknown as Riga[])
  }
  useEffect(() => {
    carica()
  }, [])

  async function crea(e: React.FormEvent) {
    e.preventDefault()
    setErrore('')
    const { data, error } = await supabase.rpc('create_campaign', { p_name: nome })
    if (error) setErrore(error.message)
    else location.hash = `#/tavolo/${data}`
  }

  async function creaInvito(campaignId: string) {
    setErrore('')
    const { data, error } = await supabase.from('invites').insert({ campaign_id: campaignId }).select('token').single()
    if (error) return setErrore(error.message)
    setLink(`${location.origin}${location.pathname}#/invito/${data.token}`)
  }

  return (
    <>
      <div className="row">
        <h1>Le tue campagne</h1>
        <button onClick={() => supabase.auth.signOut()}>Esci</button>
      </div>
      {righe.length === 0 && <p>Nessuna campagna: creane una o usa un link d'invito.</p>}
      {righe.map(({ role, campaigns: c }) => (
        <div className="row" key={c.id}>
          <a href={`#/tavolo/${c.id}`}>{c.name}</a> ({role === 'dm' ? 'DM' : 'Player'})
          {role === 'dm' && <button onClick={() => creaInvito(c.id)}>Crea invito</button>}
        </div>
      ))}
      {link && (
        <p>
          Link d'invito (vale 7 giorni, una sola persona): <input readOnly value={link} size={50} onFocus={(e) => e.target.select()} />
        </p>
      )}
      <form onSubmit={crea}>
        <input placeholder="Nome nuova campagna" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
        <button>Crea campagna (sarai il DM)</button>
      </form>
      {errore && <p className="error">{errore}</p>}
    </>
  )
}
