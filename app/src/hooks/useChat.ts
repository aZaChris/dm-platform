import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Message = {
  id: string
  campaign_id: string
  user_id: string
  display_name: string
  recipient_id: string | null // null = a tutti, altrimenti sussurro
  body: string
  created_at: string
}

export const MAX_MESSAGGIO = 500 // come il check di 0009_chat.sql
const LIMITE = 100 // ponytail: solo gli ultimi 100; scorrere più indietro quando servirà davvero

// Traduce gli errori del database in frasi per chi scrive.
function messaggioErrore(msg: string) {
  if (msg.includes('not_member')) return 'Non fai parte di questa campagna.'
  if (msg.includes('row-level security')) return 'Non puoi mandare un messaggio a questo destinatario.'
  if (msg.includes('check constraint')) return `Il messaggio deve avere da 1 a ${MAX_MESSAGGIO} caratteri.`
  return msg
}

// Ultimi messaggi della campagna (la RLS toglie i sussurri altrui) e abbonamento ai nuovi e agli eliminati.
export function useChat(campaignId: string) {
  const [messages, setMessages] = useState<Message[]>([]) // dal più vecchio al più recente
  const [errore, setErrore] = useState('')

  const carica = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(LIMITE)
    if (data) setMessages((data as Message[]).reverse())
  }, [campaignId])

  useEffect(() => {
    // INSERT: aggiunge se l'id non c'è (idempotente rispetto alla select). DELETE porta solo l'id e non si filtra lato server.
    const canale = supabase
      .channel(`chat:${campaignId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `campaign_id=eq.${campaignId}` }, (p) => {
        const nuovo = p.new as Message
        setMessages((ms) => (ms.some((m) => m.id === nuovo.id) ? ms : [...ms, nuovo].slice(-LIMITE)))
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, (p) => {
        const id = (p.old as { id?: string }).id
        setMessages((ms) => ms.filter((m) => m.id !== id))
      })
      .subscribe((stato) => {
        if (stato === 'SUBSCRIBED') void carica() // primo ingresso o riconnessione: recupera ciò che è arrivato nel frattempo
      })
    return () => {
      void supabase.removeChannel(canale)
    }
  }, [campaignId, carica])

  // user_id e display_name non si mandano: li imposta il trigger. Restituisce l'errore o null.
  const send = useCallback(
    async (body: string, recipientId: string | null) => {
      const { error } = await supabase.from('messages').insert({ campaign_id: campaignId, body, recipient_id: recipientId })
      if (!error) {
        setErrore('')
        return null
      }
      const testo = messaggioErrore(error.message)
      setErrore(testo)
      return testo
    },
    [campaignId],
  )

  const remove = useCallback(async (id: string) => {
    const { data, error } = await supabase.from('messages').delete().eq('id', id).select('id')
    if (error || !data?.length) setErrore(error?.message ?? 'Non puoi eliminare questo messaggio.')
  }, [])

  return { messages, errore, send, remove }
}
