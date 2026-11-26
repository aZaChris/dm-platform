import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Grid = 'square' | 'hex'
export type Scene = {
  id: string
  campaign_id: string
  name: string
  active: boolean
  image_path: string | null
  grid: Grid
  cols: number | null
  rows: number | null
  cells: string | null
  cells_active: boolean
  tokens_moved_at: string | null
  created_at: string
}

// Scene della campagna (010). La RLS dà al DM tutte e al giocatore solo quella attiva.
export function useScenes(campaignId: string) {
  const [scenes, setScenes] = useState<Scene[]>([])
  const [vistaId, setVistaId] = useState<string | null>(null) // scena che il DM sta preparando; null = quella attiva
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [errore, setErrore] = useState('')

  const rileggi = useCallback(async () => {
    const { data } = await supabase.from('scenes').select('*').eq('campaign_id', campaignId).order('created_at')
    if (data) setScenes(data as Scene[])
  }, [campaignId])

  // Una riga cambiata sostituisce la sua; se è attiva, le altre non lo sono più (il giocatore non riceve
  // l'evento di quella che ha smesso di esserlo, perché non la può più leggere).
  const metti = useCallback((s: Scene) => {
    setScenes((l) => {
      const altre = s.active ? l.map((x) => ({ ...x, active: false })) : l
      return altre.some((x) => x.id === s.id) ? altre.map((x) => (x.id === s.id ? s : x)) : [...altre, s]
    })
  }, [])

  useEffect(() => {
    const canale = supabase
      .channel(`scenes:${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scenes', filter: `campaign_id=eq.${campaignId}` }, (p) => {
        if (p.eventType !== 'DELETE') metti(p.new as Scene)
      })
      // I DELETE portano solo l'id e non si filtrano lato server.
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'scenes' }, (p) => {
        setScenes((l) => l.filter((x) => x.id !== (p.old as { id?: string }).id))
      })
      .subscribe((stato) => {
        if (stato === 'SUBSCRIBED') void rileggi() // primo ingresso o riconnessione
      })
    return () => {
      void supabase.removeChannel(canale)
    }
  }, [campaignId, rileggi, metti])

  const attiva = scenes.find((s) => s.active) ?? null
  const scena = scenes.find((s) => s.id === vistaId) ?? attiva

  const percorso = scena?.image_path ?? null
  useEffect(() => {
    let vivo = true
    setMapUrl(null)
    if (percorso) void supabase.storage.from('maps').createSignedUrl(percorso, 3600).then(({ data }) => vivo && setMapUrl(data?.signedUrl ?? null))
    return () => {
      vivo = false
    }
  }, [percorso])

  // Aggiorna subito in locale (per le celle); il resto torna via Realtime.
  const locale = useCallback((id: string, campi: Partial<Scene>) => setScenes((l) => l.map((x) => (x.id === id ? { ...x, ...campi } : x))), [])

  // Scrive campi di una scena; la RLS lo permette solo al DM.
  const aggiorna = useCallback(
    async (id: string, campi: Partial<Scene>) => {
      const { data, error } = await supabase.from('scenes').update({ ...campi, updated_at: new Date().toISOString() }).eq('id', id).select('*')
      if (error || !data?.length) {
        setErrore(error?.message ?? 'Solo il DM può cambiare la scena.')
        return false
      }
      setErrore('')
      metti(data[0] as Scene)
      return true
    },
    [metti],
  )

  async function crea(name: string) {
    const { data, error } = await supabase.from('scenes').insert({ campaign_id: campaignId, name }).select('*').single()
    if (error) return setErrore(error.message)
    setErrore('')
    metti(data as Scene)
    setVistaId(data.id) // si va subito a prepararla
  }

  async function attivaScena(id: string) {
    const { error } = await supabase.rpc('activate_scene', { p_scene: id })
    if (error) return setErrore(error.message.includes('combat_active') ? 'Termina il combattimento prima di cambiare scena.' : error.message)
    setErrore('')
    setVistaId(null)
    await rileggi()
  }

  // La scena attiva non si elimina (RLS). I suoi token vanno via con lei (on delete cascade).
  async function elimina(s: Scene) {
    const { data, error } = await supabase.from('scenes').delete().eq('id', s.id).select('id')
    if (error || !data?.length) return setErrore(error?.message ?? 'Non puoi eliminare questa scena.')
    setErrore('')
    setVistaId(null)
    setScenes((l) => l.filter((x) => x.id !== s.id))
    if (s.image_path) await supabase.storage.from('maps').remove([s.image_path]) // se fallisce pazienza
  }

  return { scenes, scena, attiva, mapUrl, errore, vedi: setVistaId, crea, attivaScena, elimina, aggiorna, locale, rileggi }
}
