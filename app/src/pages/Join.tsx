import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function Join({ token }: { token: string }) {
  const [errore, setErrore] = useState('')

  useEffect(() => {
    supabase.rpc('join_campaign', { p_token: token }).then(({ data, error }) => {
      if (error) {
        setErrore(
          error.message.includes('invite_invalid')
            ? 'Invito non valido: è già stato usato, è scaduto o non esiste.'
            : error.message,
        )
      } else {
        location.hash = `#/tavolo/${data}`
      }
    })
  }, [token])

  if (errore) {
    return (
      <>
        <p className="error">{errore}</p>
        <a href="#/">Torna alle campagne</a>
      </>
    )
  }
  return <p>Sto entrando nella campagna…</p>
}
