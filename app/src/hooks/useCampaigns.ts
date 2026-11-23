import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Riga = { role: 'dm' | 'player'; campaigns: { id: string; name: string } }

// Campagne dell'utente (con il suo ruolo): usato da Panoramica e Campagne.
export function useCampaigns(userId: string) {
  const [righe, setRighe] = useState<Riga[] | null>(null) // null = in caricamento
  const [errore, setErrore] = useState('')

  const carica = useCallback(async () => {
    const { data, error } = await supabase.from('campaign_members').select('role, campaigns(id, name)').eq('user_id', userId)
    if (error) setErrore(error.message)
    else setRighe(data as unknown as Riga[])
  }, [userId])

  useEffect(() => {
    carica()
  }, [carica])

  return { righe, errore, setErrore }
}
