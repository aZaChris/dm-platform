import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCampaigns } from '../hooks/useCampaigns'
import { CampaignCard } from '../components/CampaignCard'
import { Icon } from '../components/Icon'
import { ultimaCampagna } from '../components/Shell'
import type { Roll } from '../hooks/useTable'

// Panoramica: saluto, accesso al tavolo, campagne e ultimi tiri.
export function Overview({ userId }: { userId: string }) {
  const { righe, errore } = useCampaigns(userId)
  const [tiri, setTiri] = useState<Roll[]>([])

  useEffect(() => {
    // La RLS mostra solo i tiri delle mie campagne.
    supabase.from('rolls').select('*').order('created_at', { ascending: false }).limit(6).then(({ data }) => data && setTiri(data as Roll[]))
  }, [])

  const ultima = ultimaCampagna() ?? righe?.[0]?.campaigns.id
  const tavolo = ultima ? `#/tavolo/${ultima}` : '#/campagne'

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">La tua prossima avventura</p>
          <h1 className="display">Bentornato al tavolo.</h1>
          <p className="muted">Ogni grande storia inizia con un tiro di dado.</p>
        </div>
        <a className="btn" href="#/campagne"><Icon name="plus" /> Nuova campagna</a>
      </header>

      <section className="hero">
        <p className="eyebrow muted-eyebrow">Il tavolo ti aspetta</p>
        <h2 className="hero-title">Le storie migliori si vivono insieme.</h2>
        <p>Riunisci il party, esplora la mappa e fai avanzare la tua avventura, una cella alla volta.</p>
        <a className="btn" href={tavolo}>Apri il tavolo <Icon name="arrow" size={15} /></a>
      </section>

      <div className="section-head">
        <h2>Le tue campagne</h2>
        <a href="#/campagne">Vedi tutte →</a>
      </div>
      {errore && <p className="error">{errore}</p>}
      {righe === null ? (
        <p className="muted">Caricamento…</p>
      ) : righe.length === 0 ? (
        <p className="muted">Nessuna campagna ancora: creane una o usa un link d'invito.</p>
      ) : (
        <div className="grid3">
          {righe.slice(0, 3).map((r) => (
            <CampaignCard key={r.campaigns.id} riga={r} />
          ))}
        </div>
      )}

      <div className="grid-2-1">
        <section className="card">
          <h2>Diario delle attività</h2>
          {tiri.length === 0 ? (
            <p className="muted">Nessun tiro ancora: al tavolo, prova il d20.</p>
          ) : (
            <ul className="dice-log">
              {tiri.map((r) => (
                <li key={r.id}>
                  <span><b>{r.display_name}</b> · {r.label}</span>
                  <span className={r.face === 20 ? 'crit-txt' : r.face === 1 ? 'fail-txt' : ''}>{r.total}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h2>Accesso rapido</h2>
          <a className="quick" href={tavolo}><Icon name="map" /> Entra nel tavolo <Icon name="arrow" size={15} /></a>
          <a className="quick" href="#/campagne"><Icon name="scroll" /> Le tue campagne <Icon name="arrow" size={15} /></a>
        </section>
      </div>
    </>
  )
}
