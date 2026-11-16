import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Role = 'dm' | 'player'

// Carica ruolo e mappa della campagna e resta abbonato ai cambi di mappa.
export function useTable(campaignId: string, userId: string) {
  const [role, setRole] = useState<Role | null | undefined>(undefined) // undefined = in caricamento
  const [mapPath, setMapPath] = useState<string | null>(null)
  const [mapUrl, setMapUrl] = useState<string | null>(null)

  useEffect(() => {
    let vivo = true

    async function caricaMappa() {
      const { data } = await supabase.from('maps').select('image_path').eq('campaign_id', campaignId).maybeSingle()
      if (!vivo) return
      if (!data) {
        setMapPath(null)
        setMapUrl(null)
        return
      }
      const { data: firmato } = await supabase.storage.from('maps').createSignedUrl(data.image_path, 3600)
      if (!vivo) return
      setMapPath(data.image_path)
      setMapUrl(firmato?.signedUrl ?? null)
    }

    supabase
      .from('campaign_members')
      .select('role')
      .eq('campaign_id', campaignId)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => vivo && setRole((data?.role as Role) ?? null))

    // Si carica quando l'abbonamento è attivo, così non si perdono modifiche in mezzo.
    const canale = supabase
      .channel(`table:${campaignId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maps', filter: `campaign_id=eq.${campaignId}` },
        caricaMappa,
      )
      .subscribe((stato) => stato === 'SUBSCRIBED' && caricaMappa())

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [campaignId, userId])

  return { role, mapUrl, mapPath }
}
