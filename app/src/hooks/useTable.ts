import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Role = 'dm' | 'player'
export type Token = {
  id: string
  campaign_id: string
  name: string
  color: string
  col: number
  row: number
  owner_id: string | null
}
export type Member = { user_id: string; role: Role; display_name: string }

// Carica ruolo, mappa, membri e token della campagna e resta abbonato ai cambi.
export function useTable(campaignId: string, userId: string) {
  const [role, setRole] = useState<Role | null | undefined>(undefined) // undefined = in caricamento
  const [mapPath, setMapPath] = useState<string | null>(null)
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [tokens, setTokens] = useState<Token[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [errore, setErrore] = useState('')

  const caricaToken = useCallback(async () => {
    const { data } = await supabase.from('tokens').select('*').eq('campaign_id', campaignId)
    if (data) setTokens(data as Token[])
  }, [campaignId])

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
      .select('user_id, role, display_name')
      .eq('campaign_id', campaignId)
      .then(({ data }) => {
        if (!vivo || !data) return
        setMembers(data as Member[])
        setRole((data.find((m) => m.user_id === userId)?.role as Role) ?? null)
      })

    // Si carica quando l'abbonamento è attivo, così non si perdono modifiche in mezzo.
    const filtro = `campaign_id=eq.${campaignId}`
    const canale = supabase
      .channel(`table:${campaignId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'maps', filter: filtro }, caricaMappa)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens', filter: filtro }, (p) => {
        // Gli eventi sostituiscono per id, quindi sono idempotenti rispetto alla select iniziale.
        if (p.eventType === 'DELETE') {
          setTokens((ts) => ts.filter((t) => t.id !== (p.old as Token).id))
        } else {
          const nuovo = p.new as Token
          setTokens((ts) => (ts.some((t) => t.id === nuovo.id) ? ts.map((t) => (t.id === nuovo.id ? nuovo : t)) : [...ts, nuovo]))
        }
      })
      .subscribe((stato) => {
        if (stato === 'SUBSCRIBED') {
          caricaMappa()
          caricaToken()
        }
      })

    return () => {
      vivo = false
      supabase.removeChannel(canale)
    }
  }, [campaignId, userId, caricaToken])

  // Aggiorna subito in locale e scrive sul DB; se la RLS rifiuta, rilegge lo stato vero.
  const moveToken = useCallback(
    async (id: string, col: number, row: number) => {
      setTokens((ts) => ts.map((t) => (t.id === id ? { ...t, col, row } : t)))
      const { data, error } = await supabase.from('tokens').update({ col, row }).eq('id', id).select('id')
      if (error || !data?.length) {
        setErrore(error?.message ?? 'Non puoi spostare questo token.')
        caricaToken()
      }
    },
    [caricaToken],
  )

  return { role, mapUrl, mapPath, tokens, members, moveToken, errore }
}
