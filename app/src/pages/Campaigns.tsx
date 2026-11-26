import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCampaigns } from '../hooks/useCampaigns'
import { CampaignCard } from '../components/CampaignCard'
import { InviteBox } from '../components/InviteBox'

export function Campaigns({ userId }: { userId: string }) {
  const { righe, errore: erroreCarica, setErrore: setErroreCarica } = useCampaigns(userId)
  const [nome, setNome] = useState('')
  const [errore, setErrore] = useState('')

  async function crea(e: React.FormEvent) {
    e.preventDefault()
    setErrore('')
    const { data, error } = await supabase.rpc('create_campaign', { p_name: nome })
    if (error) setErrore(error.message)
    else location.hash = `#/tavolo/${data}`
  }

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">La biblioteca delle avventure</p>
          <h1 className="display">Le campagne</h1>
          <p className="muted">Scegli una storia o prepara il prossimo capitolo.</p>
        </div>
      </header>

      {righe === null ? (
        <p className="muted">Caricamento…</p>
      ) : righe.length === 0 ? (
        <p className="muted">Nessuna campagna: creane una o usa un link d'invito.</p>
      ) : (
        <div className="grid3">
          {righe.map((r, i) => (
            <CampaignCard key={r.campaigns.id} riga={r} i={i}>
              {r.role === 'dm' && <InviteBox campaignId={r.campaigns.id} />}
            </CampaignCard>
          ))}
        </div>
      )}

      <section className="card narrow">
        <h2>Nuova campagna</h2>
        <form onSubmit={crea}>
          <input name="campagna" autoComplete="off" aria-label="Nome della campagna" placeholder="Es. La Corona di Cenere…" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
          <button>Crea (sarai il DM)</button>
        </form>
      </section>
      {(errore || erroreCarica) && (
        <p className="error" role="alert" onClick={() => setErroreCarica('')}>{errore || erroreCarica}</p>
      )}
    </>
  )
}
