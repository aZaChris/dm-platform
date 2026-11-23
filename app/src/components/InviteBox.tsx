import { useState } from 'react'
import { supabase } from '../lib/supabase'

// "Crea invito" per una campagna: genera il link (7 giorni, una persona) e lo fa copiare.
export function InviteBox({ campaignId }: { campaignId: string }) {
  const [link, setLink] = useState('')
  const [copiato, setCopiato] = useState(false)
  const [errore, setErrore] = useState('')

  async function crea() {
    setErrore('')
    setCopiato(false)
    const { data, error } = await supabase.from('invites').insert({ campaign_id: campaignId }).select('token').single()
    if (error) return setErrore(error.message)
    setLink(`${location.origin}${location.pathname}#/invito/${data.token}`)
  }

  async function copia() {
    try {
      await navigator.clipboard.writeText(link)
      setCopiato(true)
    } catch {
      /* il campo resta selezionabile a mano */
    }
  }

  return (
    <>
      <button onClick={crea}>Crea invito</button>
      {link && (
        <div className="invite-link">
          <p className="eyebrow">Vale 7 giorni, una sola persona</p>
          <div className="row">
            <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Link d'invito" />
            <button onClick={copia}>{copiato ? 'Copiato ✓' : 'Copia'}</button>
          </div>
        </div>
      )}
      {errore && <p className="error" role="alert">{errore}</p>}
    </>
  )
}
